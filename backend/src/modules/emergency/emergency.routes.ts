import { Router, Request, Response } from 'express';
import { getDatabase, calculateHaversineDistance } from '../../database/index.js';

const router = Router();

// GET /api/emergency - Emergency trauma facilities, blood banks, ambulances
router.get('/', async (req: Request, res: Response) => {
  try {
    const { city_id, lat, lon, radius_km = '50' } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT ef.*, c.name as city_name 
      FROM emergency_facilities ef 
      JOIN cities c ON ef.city_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (city_id) {
      query += ' AND ef.city_id = ?';
      params.push(city_id);
    }

    const rows = await db.all(query, params);

    const userLat = lat ? parseFloat(lat as string) : null;
    const userLon = lon ? parseFloat(lon as string) : null;
    const radius = parseFloat(radius_km as string);

    let enriched = rows.map((r: any) => {
      let dist = 0;
      if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
        dist = calculateHaversineDistance(userLat, userLon, r.latitude, r.longitude);
      }
      return { ...r, distance_km: dist };
    });

    if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
      enriched = enriched.filter((r: any) => r.distance_km <= radius);
      enriched.sort((a: any, b: any) => a.distance_km - b.distance_km);
    }

    // Emergency Helpline directory
    const helplines = [
      { name: 'National Emergency Ambulance Service', number: '108', available: '24x7 Free Service' },
      { name: 'Police & Emergency Medical Dispatch', number: '112', available: '24x7 Immediate Response' },
      { name: 'Disaster Management Support Services', number: '1077', available: '24x7 Emergency Help' },
      { name: 'National Poison Information Helpline (AIIMS)', number: '1800 116 117', available: '24x7 Clinical Support' },
      { name: 'Blood Bank Central Coordination (eRaktKosh)', number: '104', available: '24x7 Blood Availability' },
    ];

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
      helplines,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
