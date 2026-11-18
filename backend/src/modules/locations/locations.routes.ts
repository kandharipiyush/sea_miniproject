import { Router, Request, Response } from 'express';
import { getDatabase, calculateHaversineDistance } from '../../database/index.js';

const router = Router();

// GET /api/locations/cities
router.get('/cities', async (_req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const cities = await db.all(`
      SELECT 
        c.*, 
        s.name as state_name,
        s.code as state_code,
        (SELECT COUNT(*) FROM hospital_branches WHERE city_id = c.id) as branch_count,
        (SELECT COUNT(DISTINCT db.doctor_id) 
         FROM doctor_branches db 
         JOIN hospital_branches hb ON db.branch_id = hb.id 
         WHERE hb.city_id = c.id) as doctor_count
      FROM cities c
      JOIN states s ON c.state_id = s.id
      WHERE c.is_active = 1
      ORDER BY c.id ASC
    `);

    res.json({ success: true, count: cities.length, data: cities });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/locations/detect
router.get('/detect', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ success: false, error: 'Valid latitude and longitude are required' });
      return;
    }

    const db = await getDatabase();
    const cities = await db.all('SELECT c.*, s.name as state_name FROM cities c JOIN states s ON c.state_id = s.id WHERE c.is_active = 1');

    let closestCity = cities[0];
    let minDistance = calculateHaversineDistance(lat, lon, closestCity.latitude, closestCity.longitude);

    for (const city of cities) {
      const dist = calculateHaversineDistance(lat, lon, city.latitude, city.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = city;
      }
    }

    // Find closest locality branch in this city
    const closestBranch = await db.get(
      'SELECT locality, pincode FROM hospital_branches WHERE city_id = ? LIMIT 1',
      [closestCity.id]
    );

    res.json({
      success: true,
      data: {
        detectedCity: closestCity,
        distance_km: minDistance,
        suggestedLocality: closestBranch?.locality || 'Central Area',
        pincode: closestBranch?.pincode || '400001',
        coordinates: { lat, lon },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
