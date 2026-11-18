import { Router, Request, Response } from 'express';
import { getDatabase, calculateHaversineDistance } from '../../database/index.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/diagnostics/centres - List diagnostic centres with distance & tests
router.get('/centres', async (req: Request, res: Response) => {
  try {
    const { city_id, search, lat, lon, radius_km = '50' } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT 
        dc.*, 
        c.name as city_name,
        (SELECT COUNT(*) FROM diagnostic_tests WHERE centre_id = dc.id) as test_count
      FROM diagnostic_centres dc
      JOIN cities c ON dc.city_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (city_id) {
      query += ' AND dc.city_id = ?';
      params.push(city_id);
    }

    if (search) {
      query += ' AND (dc.name LIKE ? OR dc.locality LIKE ?)';
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

// GET /api/diagnostics/tests - Test catalogue
router.get('/tests', async (req: Request, res: Response) => {
  try {
    const { centre_id, category, search } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT dt.*, dc.name as centre_name, dc.locality, c.name as city_name
      FROM diagnostic_tests dt
      JOIN diagnostic_centres dc ON dt.centre_id = dc.id
      JOIN cities c ON dc.city_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (centre_id) {
      query += ' AND dt.centre_id = ?';
      params.push(centre_id);
    }
    if (category) {
      query += ' AND dt.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND dt.test_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' LIMIT 60';
    const tests = await db.all(query, params);

    res.json({ success: true, count: tests.length, data: tests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/diagnostics/bookings - Book diagnostic test
router.post('/bookings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { centre_id, test_id, booking_date, booking_time, sample_collection_type = 'LAB_VISIT' } = req.body;

    if (!centre_id || !test_id || !booking_date || !booking_time) {
      res.status(400).json({ success: false, error: 'Centre ID, Test ID, date, and time are required' });
      return;
    }

    const db = await getDatabase();
    const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
    const patientId = pat?.id || req.user!.patient_id || 'pat-1';

    const bookingId = `diag-bk-${Date.now()}`;
    await db.run(
      `INSERT INTO diagnostic_bookings (
        id, patient_id, centre_id, test_id, booking_date, booking_time, sample_collection_type, status, payment_status, report_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'PAID', 'https://carenex.demo/reports/lab_test_report.pdf')`,
      [bookingId, patientId, centre_id, test_id, booking_date, booking_time, sample_collection_type]
    );

    res.status(201).json({ success: true, bookingId, message: 'Diagnostic test booked successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/diagnostics/my-bookings
router.get('/my-bookings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
    const patientId = pat?.id || req.user!.patient_id || 'pat-1';

    const bookings = await db.all(
      `SELECT dbk.*, dt.test_name, dt.category, dt.price, dc.name as centre_name, dc.address as centre_address
       FROM diagnostic_bookings dbk
       JOIN diagnostic_tests dt ON dbk.test_id = dt.id
       JOIN diagnostic_centres dc ON dbk.centre_id = dc.id
       WHERE dbk.patient_id = ?
       ORDER BY dbk.booking_date DESC`,
      [patientId]
    );

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
