import Satellite from '../models/Satellite';

const CELESTRAK_BASE_URL = process.env.CELESTRAK_BASE_URL || 'https://celestrak.org/NORAD/elements/gp.php';

function parseTLEEpoch(tleLine1: string): Date {
  const epochYearStr = tleLine1.substring(18, 20);
  const epochDayStr = tleLine1.substring(20, 32);
  const year = parseInt(epochYearStr, 10);
  const fullYear = year < 57 ? 2000 + year : 1900 + year;
  const days = parseFloat(epochDayStr);
  const epochDate = new Date(Date.UTC(fullYear, 0, 1));
  epochDate.setUTCMilliseconds((days - 1) * 24 * 60 * 60 * 1000);
  return epochDate;
}

export async function fetchAndIngestSatellites(group: string = 'visual') {
  const url = `${CELESTRAK_BASE_URL}?GROUP=${group}&FORMAT=TLE`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch from Celestrak: ${response.statusText}`);
  
  const text = await response.text();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const bulkOps = [];
  
  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i];
    const tleLine1 = lines[i+1];
    const tleLine2 = lines[i+2];
    
    if (!tleLine1 || !tleLine2) continue;
    
    // Extract NORAD ID from line 2
    const noradIdStr = tleLine2.substring(2, 7).trim();
    const noradId = parseInt(noradIdStr, 10);
    if (isNaN(noradId)) continue;
    
    const tleEpoch = parseTLEEpoch(tleLine1);
    
    bulkOps.push({
      updateOne: {
        filter: { noradId },
        update: { $set: { name, tleLine1, tleLine2, sourceGroup: group, tleEpoch } },
        upsert: true
      }
    });
  }
  
  if (bulkOps.length > 0) {
    await Satellite.bulkWrite(bulkOps);
  }
  
  return bulkOps.length;
}
