import { Router } from 'express';
import Satellite from '../models/Satellite';
import { fetchAndIngestSatellites } from '../services/celestrak';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const group = (req.query.group as string) || 'visual';
    
    // Simplistic approach: if no sats for this group exist or are older than 12 hours, ingest them.
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    const count = await Satellite.countDocuments({ sourceGroup: group, updatedAt: { $gte: twelveHoursAgo } });
    if (count === 0) {
      console.log(`[CelesTrak] Fetching latest TLEs for group: ${group}...`);
      await fetchAndIngestSatellites(group);
    }
    
    const satellites = await Satellite.find({ sourceGroup: group }).select('-_id -__v');
    res.json(satellites);
  } catch (error) {
    console.error('Error fetching satellites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/ingest', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token !== process.env.ADMIN_INGEST_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const group = (req.query.group as string) || 'visual';
    const updatedCount = await fetchAndIngestSatellites(group);
    res.json({ success: true, updatedCount });
  } catch (error) {
    console.error('Error ingesting satellites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
