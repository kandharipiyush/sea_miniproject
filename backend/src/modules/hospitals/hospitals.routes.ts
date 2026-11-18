import { Router, Request, Response } from 'express';
import { getDatabase, calculateHaversineDistance } from '../../database/index.js';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/hospitals - Search and filter branches with distance calculation
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      city_id,
      search,
      locality,
      type,
      emergency_only,
      lat,
      lon,
      radius_km = '50',
      sort_by = 'distance', // 'distance', 'rating', 'name'
      page = '1',
      limit = '30',
    } = req.query;

    const db = await getDatabase();
    let query = `
      SELECT 
        hb.*,
        h.name as hospital_name,
        h.type as hospital_type,
        h.rating as hospital_rating,
        h.review_count as hospital_reviews,
        h.logo_url,
        c.name as city_name,
        (SELECT COUNT(*) FROM doctor_branches db_sub WHERE db_sub.branch_id = hb.id) as doctor_count,
        (SELECT GROUP_CONCAT(department_name, ', ') FROM (
          SELECT department_name FROM hospital_departments WHERE branch_id = hb.id LIMIT 6
        )) as departments
      FROM hospital_branches hb
      JOIN hospitals h ON hb.hospital_id = h.id
      JOIN cities c ON hb.city_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (city_id) {
      query += ' AND hb.city_id = ?';
      params.push(city_id);
    }

    if (locality) {
      query += ' AND hb.locality LIKE ?';
      params.push(`%${locality}%`);
    }

    if (type) {
      query += ' AND h.type LIKE ?';
      params.push(`%${type}%`);
    }

    if (emergency_only === 'true' || emergency_only === '1') {
      query += ' AND hb.emergency_service = 1';
    }

    if (search) {
      query += ' AND (h.name LIKE ? OR hb.branch_name LIKE ? OR hb.locality LIKE ? OR hb.pincode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const rows = await db.all(query, params);

    // Compute distance if lat/lon provided
    const userLat = lat ? parseFloat(lat as string) : null;
    const userLon = lon ? parseFloat(lon as string) : null;
    const radius = parseFloat(radius_km as string);

    let enriched = rows.map((r: any) => {
      let dist = 0;
      if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
        dist = calculateHaversineDistance(userLat, userLon, r.latitude, r.longitude);
      }
      return {
        ...r,
        distance_km: dist,
        departments: r.departments ? r.departments.split(', ') : [],
      };
    });

    // Filter by radius if GPS coordinates given
    if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
      enriched = enriched.filter((r: any) => r.distance_km <= radius);
    }

    // Sort
    if (sort_by === 'distance' && userLat !== null && userLon !== null) {
      enriched.sort((a: any, b: any) => a.distance_km - b.distance_km);
    } else if (sort_by === 'rating') {
      enriched.sort((a: any, b: any) => b.hospital_rating - a.hospital_rating);
    } else {
      enriched.sort((a: any, b: any) => a.hospital_name.localeCompare(b.hospital_name));
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;
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

// GET /api/hospitals/compare - Compare up to 3 hospital branches side-by-side
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { branch_ids, lat, lon } = req.query;
    if (!branch_ids) {
      res.status(400).json({ success: false, error: 'Provide branch_ids (comma-separated, max 3)' });
      return;
    }

    const ids = (branch_ids as string).split(',').slice(0, 3);
    const db = await getDatabase();

    const placeholders = ids.map(() => '?').join(',');
    const branches = await db.all(
      `SELECT 
        hb.*,
        h.name as hospital_name,
        h.type as hospital_type,
        h.rating as hospital_rating,
        h.review_count as hospital_reviews,
        c.name as city_name,
        (SELECT COUNT(*) FROM doctor_branches WHERE branch_id = hb.id) as doctor_count
      FROM hospital_branches hb
      JOIN hospitals h ON hb.hospital_id = h.id
      JOIN cities c ON hb.city_id = c.id
      WHERE hb.id IN (${placeholders})`,
      ids
    );

    const userLat = lat ? parseFloat(lat as string) : null;
    const userLon = lon ? parseFloat(lon as string) : null;

    const result = await Promise.all(
      branches.map(async (b: any) => {
        let dist = 0;
        if (userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon)) {
          dist = calculateHaversineDistance(userLat, userLon, b.latitude, b.longitude);
        }

        const depts = await db.all(
          'SELECT department_name FROM hospital_departments WHERE branch_id = ?',
          [b.id]
        );

        const feeRow = await db.get(
          'SELECT MIN(consultation_fee) as min_fee, MAX(consultation_fee) as max_fee FROM doctor_branches WHERE branch_id = ?',
          [b.id]
        );

        return {
          ...b,
          distance_km: dist,
          departments: depts.map((d: any) => d.department_name),
          fee_range: feeRow?.min_fee ? `₹${feeRow.min_fee} - ₹${feeRow.max_fee}` : '₹500 - ₹1200',
        };
      })
    );

    res.json({ success: true, count: result.length, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/hospitals/branches/:branchId - Single branch details with associated doctors
router.get('/branches/:branchId', async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const db = await getDatabase();

    const branch = await db.get(
      `SELECT 
        hb.*,
        h.name as hospital_name,
        h.organization_name,
        h.type as hospital_type,
        h.rating as hospital_rating,
        h.review_count as hospital_reviews,
        h.logo_url,
        h.description as hospital_desc,
        c.name as city_name
      FROM hospital_branches hb
      JOIN hospitals h ON hb.hospital_id = h.id
      JOIN cities c ON hb.city_id = c.id
      WHERE hb.id = ?`,
      [branchId]
    );

    if (!branch) {
      res.status(404).json({ success: false, error: 'Hospital branch not found' });
      return;
    }

    const departments = await db.all(
      'SELECT department_name FROM hospital_departments WHERE branch_id = ?',
      [branchId]
    );

    // Associated Doctors at this hospital branch
    const doctors = await db.all(
      `SELECT 
        d.id as doctor_id,
        d.name,
        d.qualification,
        d.experience_years,
        d.rating,
        d.review_count,
        d.profile_photo,
        d.verification_status,
        s.id as specialization_id,
        s.name as specialization_name,
        s.icon as specialization_icon,
        db.consultation_fee,
        db.schedule_days,
        db.schedule_hours
      FROM doctor_branches db
      JOIN doctors d ON db.doctor_id = d.id
      JOIN specializations s ON d.specialization_id = s.id
      WHERE db.branch_id = ? AND db.is_active = 1
      ORDER BY d.rating DESC, d.experience_years DESC`,
      [branchId]
    );

    res.json({
      success: true,
      data: {
        ...branch,
        departments: departments.map((d: any) => d.department_name),
        doctors,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/hospitals/:id - Hospital organization and all its branches
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const hospital = await db.get('SELECT * FROM hospitals WHERE id = ?', [id]);
    if (!hospital) {
      res.status(404).json({ success: false, error: 'Hospital not found' });
      return;
    }

    const branches = await db.all(
      `SELECT hb.*, c.name as city_name,
        (SELECT COUNT(*) FROM doctor_branches WHERE branch_id = hb.id) as doctor_count
       FROM hospital_branches hb
       JOIN cities c ON hb.city_id = c.id
       WHERE hb.hospital_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...hospital,
        branches,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/hospitals/branches - Create new branch (hospital_admin / super_admin)
router.post('/branches', requireAuth, requireRole(['hospital_admin', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { hospital_id, branch_name, address, city_id, locality, pincode, latitude, longitude, phone, emergency_service, operating_hours, facilities } = req.body;

    if (!hospital_id || !branch_name || !address || !city_id || !locality || !latitude || !longitude) {
      res.status(400).json({ success: false, error: 'Missing required branch fields' });
      return;
    }

    const db = await getDatabase();
    const branchId = `br-custom-${Date.now()}`;

    await db.run(
      `INSERT INTO hospital_branches (
        id, hospital_id, branch_name, address, city_id, locality, pincode,
        latitude, longitude, phone, emergency_service, operating_hours, facilities, verification_status, data_source, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branchId,
        hospital_id,
        branch_name,
        address,
        city_id,
        locality,
        pincode || '400001',
        latitude,
        longitude,
        phone || '+91 22 12345678',
        emergency_service ? 1 : 0,
        operating_hours || '24x7',
        facilities || 'Emergency, ICU, Pharmacy',
        'VERIFIED',
        'Admin Portal Entry',
        0,
      ]
    );

    res.status(201).json({ success: true, branchId, message: 'Branch created successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
