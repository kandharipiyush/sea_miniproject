import { Router, Request, Response } from 'express';
import { getDatabase, calculateHaversineDistance } from '../../database/index.js';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/doctors - Smart doctor discovery with filters, spatial distance, and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      specialization_id,
      specialization_slug,
      city_id,
      branch_id,
      search,
      locality,
      lat,
      lon,
      radius_km = '50',
      min_rating,
      max_fee,
      min_experience,
      sort_by = 'rating', // 'rating', 'fee_low', 'experience', 'nearest'
      page = '1',
      limit = '20',
    } = req.query;

    const db = await getDatabase();

    // Query doctors linked with their primary branch
    let query = `
      SELECT 
        d.*,
        s.name as specialization_name,
        s.slug as specialization_slug,
        s.icon as specialization_icon,
        hb.id as branch_id,
        hb.branch_name,
        hb.address as branch_address,
        hb.locality as branch_locality,
        hb.city_id,
        hb.latitude as branch_lat,
        hb.longitude as branch_lon,
        c.name as city_name,
        h.name as hospital_name,
        h.type as hospital_type,
        db_rel.consultation_fee as branch_fee,
        db_rel.schedule_days,
        db_rel.schedule_hours
      FROM doctors d
      JOIN specializations s ON d.specialization_id = s.id
      JOIN doctor_branches db_rel ON d.id = db_rel.doctor_id
      JOIN hospital_branches hb ON db_rel.branch_id = hb.id
      JOIN hospitals h ON hb.hospital_id = h.id
      JOIN cities c ON hb.city_id = c.id
      WHERE db_rel.is_active = 1
    `;

    const params: any[] = [];

    if (specialization_id) {
      query += ' AND d.specialization_id = ?';
      params.push(specialization_id);
    }

    if (specialization_slug) {
      query += ' AND s.slug = ?';
      params.push(specialization_slug);
    }

    if (city_id) {
      query += ' AND hb.city_id = ?';
      params.push(city_id);
    }

    if (branch_id) {
      query += ' AND hb.id = ?';
      params.push(branch_id);
    }

    if (locality) {
      query += ' AND (hb.locality LIKE ? OR hb.address LIKE ?)';
      params.push(`%${locality}%`, `%${locality}%`);
    }

    if (min_rating) {
      query += ' AND d.rating >= ?';
      params.push(parseFloat(min_rating as string));
    }

    if (max_fee) {
      query += ' AND d.consultation_fee <= ?';
      params.push(parseFloat(max_fee as string));
    }

    if (min_experience) {
      query += ' AND d.experience_years >= ?';
      params.push(parseInt(min_experience as string, 10));
    }

    if (search) {
      const q = `%${search}%`;
      query += ' AND (d.name LIKE ? OR s.name LIKE ? OR hb.branch_name LIKE ? OR hb.locality LIKE ? OR hb.pincode LIKE ?)';
      params.push(q, q, q, q, q);
    }

    const rows = await db.all(query, params);

    // Calculate distance if coordinates provided
    const userLat = lat ? parseFloat(lat as string) : null;
    const userLon = lon ? parseFloat(lon as string) : null;
    const radius = parseFloat(radius_km as string);

    let enriched = rows.map((r: any) => {
      let dist = 0;
      if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
        dist = calculateHaversineDistance(userLat, userLon, r.branch_lat, r.branch_lon);
      }
      return {
        ...r,
        distance_km: dist,
        consultation_fee: r.branch_fee || r.consultation_fee,
      };
    });

    if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
      enriched = enriched.filter((r: any) => r.distance_km <= radius);
    }

    // Sort
    if (sort_by === 'nearest' && userLat !== null && userLon !== null) {
      enriched.sort((a: any, b: any) => a.distance_km - b.distance_km);
    } else if (sort_by === 'fee_low') {
      enriched.sort((a: any, b: any) => a.consultation_fee - b.consultation_fee);
    } else if (sort_by === 'experience') {
      enriched.sort((a: any, b: any) => b.experience_years - a.experience_years);
    } else {
      enriched.sort((a: any, b: any) => b.rating - a.rating);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const total = enriched.length;
    const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: paginated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/doctors/:id - Single Doctor details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const doctor = await db.get(
      `SELECT 
        d.*,
        s.name as specialization_name,
        s.slug as specialization_slug,
        s.description as specialization_desc,
        s.icon as specialization_icon
      FROM doctors d
      JOIN specializations s ON d.specialization_id = s.id
      WHERE d.id = ?`,
      [id]
    );

    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor not found' });
      return;
    }

    // Get all affiliated branches for this doctor (Multi-branch hospital network)
    const branches = await db.all(
      `SELECT 
        db.id as doctor_branch_id,
        db.consultation_fee,
        db.schedule_days,
        db.schedule_hours,
        hb.id as branch_id,
        hb.branch_name,
        hb.address,
        hb.locality,
        hb.pincode,
        hb.latitude,
        hb.longitude,
        hb.phone,
        h.name as hospital_name,
        c.name as city_name
      FROM doctor_branches db
      JOIN hospital_branches hb ON db.branch_id = hb.id
      JOIN hospitals h ON hb.hospital_id = h.id
      JOIN cities c ON hb.city_id = c.id
      WHERE db.doctor_id = ? AND db.is_active = 1`,
      [id]
    );

    // Get reviews
    const reviews = await db.all(
      `SELECT r.*, u.full_name as reviewer_name, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.target_id = ? 
       ORDER BY r.created_at DESC LIMIT 5`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...doctor,
        branches,
        reviews,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/doctors/:id/slots - Available appointment slots by date and branch
router.get('/:id/slots', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, branch_id } = req.query;

    const db = await getDatabase();
    let query = 'SELECT * FROM doctor_slots WHERE doctor_id = ? AND is_booked = 0';
    const params: any[] = [id];

    if (date) {
      query += ' AND slot_date = ?';
      params.push(date);
    } else {
      // Default: today or later
      const todayStr = new Date().toISOString().split('T')[0];
      query += ' AND slot_date >= ?';
      params.push(todayStr);
    }

    if (branch_id) {
      query += ' AND branch_id = ?';
      params.push(branch_id);
    }

    query += ' ORDER BY slot_date ASC, slot_time ASC LIMIT 50';

    const slots = await db.all(query, params);

    res.json({ success: true, count: slots.length, data: slots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/doctors/:id/slots - Doctor adds slots (Doctor Portal)
router.post('/:id/slots', requireAuth, requireRole(['doctor', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { branch_id, slot_date, slot_times, duration_minutes = 30, consultation_type = 'IN_PERSON' } = req.body;

    if (!branch_id || !slot_date || !Array.isArray(slot_times) || slot_times.length === 0) {
      res.status(400).json({ success: false, error: 'Provide branch_id, slot_date and array of slot_times' });
      return;
    }

    const db = await getDatabase();
    let createdCount = 0;

    for (const time of slot_times) {
      const slotId = `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      try {
        await db.run(
          `INSERT OR IGNORE INTO doctor_slots (id, doctor_id, branch_id, slot_date, slot_time, duration_minutes, is_booked, consultation_type)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
          [slotId, id, branch_id, slot_date, time, duration_minutes, consultation_type]
        );
        createdCount++;
      } catch {
        // Skip duplicate slots
      }
    }

    res.json({ success: true, message: `Created ${createdCount} slots successfully` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
