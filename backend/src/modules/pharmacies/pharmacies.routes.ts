import { Router, Request, Response } from 'express';
import { getDatabase, calculateHaversineDistance } from '../../database/index.js';

const router = Router();

// GET /api/pharmacies - Search pharmacies with distance calculation
router.get('/', async (req: Request, res: Response) => {
  try {
    const { city_id, search, lat, lon, radius_km = '50', is_24x7 } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT p.*, c.name as city_name 
      FROM pharmacies p 
      JOIN cities c ON p.city_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (city_id) {
      query += ' AND p.city_id = ?';
      params.push(city_id);
    }
    if (is_24x7 === 'true' || is_24x7 === '1') {
      query += ' AND p.is_24x7 = 1';
    }
    if (search) {
      query += ' AND (p.name LIKE ? OR p.locality LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
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

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
