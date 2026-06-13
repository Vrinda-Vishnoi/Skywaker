import { Router } from 'express';
import Satellite from '../models/Satellite';
import PassCache from '../models/PassCache';
import { predictPasses } from '../services/passPredictor';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const noradId = parseInt(req.query.noradId as string, 10);
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const hours = parseInt(req.query.hours as string, 10) || 48;
    
    if (isNaN(noradId) || isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Missing or invalid parameters: noradId, lat, lon are required.' });
    }
    
    const sat = await Satellite.findOne({ noradId });
    if (!sat) {
      return res.status(404).json({ error: 'Satellite not found' });
    }
    
    // Bucket location to ~11km resolution for caching (1 decimal place)
    const roundedLat = Math.round(lat * 10) / 10;
    const roundedLon = Math.round(lon * 10) / 10;
    const cacheKey = `${noradId}_${roundedLat}_${roundedLon}_${hours}`;
    
    // Check Cache
    const cached = await PassCache.findOne({ cacheKey });
    if (cached) {
      return res.json({
        noradId,
        observer: { lat, lon, bucketLat: roundedLat, bucketLon: roundedLon },
        cache: { status: 'hit', key: cacheKey, ttl_seconds: 3600 },
        passes: cached.passes
      });
    }

    // Compute passes dynamically (CPU intensive)
    const passes = predictPasses(sat.tleLine1, sat.tleLine2, lat, lon, hours);
    
    // Store in cache (asynchronously, no need to block)
    PassCache.create({ cacheKey, passes }).catch(err => console.error('Cache write failed', err));
    
    res.json({
      noradId,
      observer: { lat, lon, bucketLat: roundedLat, bucketLon: roundedLon },
      cache: { status: 'miss', key: cacheKey, ttl_seconds: 3600 },
      passes
    });
  } catch (error) {
    console.error('Error predicting passes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
