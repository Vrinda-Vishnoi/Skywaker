import * as satellite from 'satellite.js';
import { AstroTime, Observer, Horizon, Equator, Body } from 'astronomy-engine';

export interface PassMetrics {
  observerSunAltitudeDeg: number;
  peakElevationDeg: number;
  durationSeconds: number;
}

export interface PassExplanation {
  reasons: string[];
  metrics: PassMetrics;
}

export interface PassEvent {
  time: Date;
  azimuthDeg: number;
  elevationDeg?: number;
}

export interface PassPrediction {
  rise: PassEvent;
  peak: PassEvent;
  set: PassEvent;
  visible: boolean;
  explanation: PassExplanation;
}

function calculateObserverSunAltitude(date: Date, lat: number, lon: number): number {
  const observer = new Observer(lat, lon, 0);
  const time = new AstroTime(date);
  const sunPos = Equator(Body.Sun, time, observer, true, true);
  const hor = Horizon(time, observer, sunPos.ra, sunPos.dec, 'normal');
  return hor.altitude;
}

export function predictPasses(
  tleLine1: string,
  tleLine2: string,
  observerLat: number,
  observerLon: number,
  hours: number = 48
): PassPrediction[] {
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
  const now = new Date();
  const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
  
  const stepSeconds = 30;
  const passes: PassPrediction[] = [];
  
  let inPass = false;
  let currentPass: Partial<PassPrediction> = {};
  
  for (let t = now.getTime(); t <= endTime.getTime(); t += stepSeconds * 1000) {
    const time = new Date(t);
    const positionAndVelocity = satellite.propagate(satrec, time);
    const posEci = positionAndVelocity.position;
    
    if (!posEci || typeof posEci === 'boolean') continue;
    
    const gmst = satellite.gstime(time);
    const observerGd = {
      longitude: satellite.degreesToRadians(observerLon),
      latitude: satellite.degreesToRadians(observerLat),
      height: 0
    };
    
    const positionEcf = satellite.eciToEcf(posEci, gmst);
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
    
    const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation);
    const azimuthDeg = satellite.radiansToDegrees(lookAngles.azimuth);
    
    if (elevationDeg > 10) {
      if (!inPass) {
        // Pass starts
        inPass = true;
        currentPass = {
          rise: { time, azimuthDeg },
          peak: { time, azimuthDeg, elevationDeg }
        };
      } else {
        // Update peak
        if (currentPass.peak && elevationDeg > currentPass.peak.elevationDeg!) {
          currentPass.peak = { time, azimuthDeg, elevationDeg };
        }
      }
    } else {
      if (inPass) {
        // Pass ends
        inPass = false;
        currentPass.set = { time, azimuthDeg };
        
        // Finalize pass calculation
        if (currentPass.rise && currentPass.peak && currentPass.set) {
          const peakTime = currentPass.peak.time;
          const sunAlt = calculateObserverSunAltitude(peakTime, observerLat, observerLon);
          
          const duration = (currentPass.set.time.getTime() - currentPass.rise.time.getTime()) / 1000;
          
          const reasons: string[] = [];
          reasons.push(`Peak elevation is ${currentPass.peak.elevationDeg.toFixed(1)}° (> 10°)`);
          
          let visible = false;
          if (sunAlt < -6) {
            reasons.push(`Observer in civil darkness (Sun alt ${sunAlt.toFixed(1)}°)`);
            reasons.push(`Satellite estimated sunlit`);
            visible = true;
          } else {
            reasons.push(`Observer is in daylight (Sun alt ${sunAlt.toFixed(1)}°)`);
            visible = false;
          }
          
          currentPass.visible = visible;
          currentPass.explanation = {
            reasons,
            metrics: {
              observerSunAltitudeDeg: sunAlt,
              peakElevationDeg: currentPass.peak.elevationDeg,
              durationSeconds: duration
            }
          };
          
          passes.push(currentPass as PassPrediction);
        }
        currentPass = {};
      }
    }
  }
  
  return passes;
}
