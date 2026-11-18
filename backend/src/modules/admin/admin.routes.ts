import { Router, Response } from 'express';
import { getDatabase } from '../../database/index.js';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/admin/analytics - Real dynamic database statistics
router.get('/analytics', requireAuth, requireRole(['super_admin', 'hospital_admin']), async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();

    const [
      patientsCount,
      doctorsCount,
      hospitalsCount,
      branchesCount,
      diagnosticCount,
      pharmaciesCount,
      totalAppointments,
      activeAppointments,
      cancelledAppointments,
      completedAppointments,
      revenueRow,
    ] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM patients'),
      db.get('SELECT COUNT(*) as count FROM doctors'),
      db.get('SELECT COUNT(*) as count FROM hospitals'),
      db.get('SELECT COUNT(*) as count FROM hospital_branches'),
      db.get('SELECT COUNT(*) as count FROM diagnostic_centres'),
      db.get('SELECT COUNT(*) as count FROM pharmacies'),
      db.get('SELECT COUNT(*) as count FROM appointments'),
      db.get("SELECT COUNT(*) as count FROM appointments WHERE status IN ('CONFIRMED', 'PENDING', 'RESCHEDULED')"),
      db.get("SELECT COUNT(*) as count FROM appointments WHERE status = 'CANCELLED'"),
      db.get("SELECT COUNT(*) as count FROM appointments WHERE status = 'COMPLETED'"),
      db.get('SELECT SUM(fee) as total_rev FROM appointments WHERE payment_status = "PAID"'),
    ]);

    // City-wise distribution of hospitals and patients
    const cityDistribution = await db.all(`
      SELECT 
        c.name as city_name,
        (SELECT COUNT(*) FROM hospital_branches WHERE city_id = c.id) as branch_count,
        (SELECT COUNT(*) FROM patients WHERE city_id = c.id) as patient_count
      FROM cities c
      WHERE c.is_active = 1
      ORDER BY branch_count DESC
      LIMIT 10
    `);

    // Specialization distribution
    const specDistribution = await db.all(`
      SELECT s.name, COUNT(d.id) as count
      FROM specializations s
      JOIN doctors d ON s.id = d.specialization_id
      GROUP BY s.id
      ORDER BY count DESC
      LIMIT 8
    `);

    // Recent 10 Appointments
    const recentAppointments = await db.all(`
      SELECT 
        a.id, a.appointment_number, a.appointment_date, a.appointment_time, a.status, a.fee,
        d.name as doctor_name, u.full_name as patient_name, hb.branch_name, c.name as city_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN hospital_branches hb ON a.branch_id = hb.id
      JOIN cities c ON hb.city_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        totals: {
          patients: patientsCount?.count || 0,
          doctors: doctorsCount?.count || 0,
          hospitals: hospitalsCount?.count || 0,
          branches: branchesCount?.count || 0,
          diagnosticCentres: diagnosticCount?.count || 0,
          pharmacies: pharmaciesCount?.count || 0,
          totalAppointments: totalAppointments?.count || 0,
          activeAppointments: activeAppointments?.count || 0,
          cancelledAppointments: cancelledAppointments?.count || 0,
          completedAppointments: completedAppointments?.count || 0,
          totalRevenue: Math.round(revenueRow?.total_rev || 0),
        },
        cityDistribution,
        specDistribution,
        recentAppointments,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/doctors - List & verify doctors
router.get('/doctors', requireAuth, requireRole(['super_admin', 'hospital_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT d.*, s.name as specialization_name, u.email as account_email
      FROM doctors d
      JOIN specializations s ON d.specialization_id = s.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND d.verification_status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (d.name LIKE ? OR s.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY d.created_at DESC';

    const rows = await db.all(query, params);
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    res.json({
      success: true,
      total: rows.length,
      page: pageNum,
      totalPages: Math.ceil(rows.length / limitNum),
      data: rows.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/doctors/:id/verify
router.patch('/doctors/:id/verify', requireAuth, requireRole(['super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status = 'VERIFIED' } = req.body; // 'VERIFIED', 'REJECTED', 'PENDING'
    const db = await getDatabase();

    await db.run('UPDATE doctors SET verification_status = ?, is_verified = ? WHERE id = ?', [
      status,
      status === 'VERIFIED' ? 1 : 0,
      id,
    ]);

    res.json({ success: true, message: `Doctor status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/hospitals - List hospitals for management
router.get('/hospitals', requireAuth, requireRole(['super_admin', 'hospital_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT h.*, 
        (SELECT COUNT(*) FROM hospital_branches WHERE hospital_id = h.id) as branch_count,
        (SELECT COUNT(DISTINCT db_sub.doctor_id) 
         FROM doctor_branches db_sub 
         JOIN hospital_branches hb ON db_sub.branch_id = hb.id 
         WHERE hb.hospital_id = h.id) as doctor_count
      FROM hospitals h
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (h.name LIKE ? OR h.organization_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const rows = await db.all(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/cities - Add new city dynamically without code changes
router.post('/cities', requireAuth, requireRole(['super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, state_id, latitude, longitude } = req.body;

    if (!name || !state_id || !latitude || !longitude) {
      res.status(400).json({ success: false, error: 'Name, state_id, latitude, and longitude are required' });
      return;
    }

    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO cities (name, state_id, latitude, longitude, is_active) VALUES (?, ?, ?, ?, 1)',
      [name, state_id, latitude, longitude]
    );

    res.status(201).json({
      success: true,
      city_id: result.lastID,
      message: `City '${name}' added to CareNex multi-city coverage network`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/users - User management
router.get('/users', requireAuth, requireRole(['super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = '1', limit = '25' } = req.query;
    const db = await getDatabase();

    let query = 'SELECT id, email, role, full_name, phone, is_active, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const rows = await db.all(query, params);
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;

    res.json({
      success: true,
      total: rows.length,
      page: pageNum,
      totalPages: Math.ceil(rows.length / limitNum),
      data: rows.slice((pageNum - 1) * limitNum, pageNum * limitNum),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
