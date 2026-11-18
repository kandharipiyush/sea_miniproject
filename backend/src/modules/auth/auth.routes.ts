import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../../database/index.js';
import { generateToken, requireAuth, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const db = await getDatabase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Attach patient_id or doctor_id if applicable
    let patientId: string | undefined;
    let doctorId: string | undefined;

    if (user.role === 'patient') {
      const patient = await db.get('SELECT id FROM patients WHERE user_id = ?', [user.id]);
      patientId = patient?.id;
    } else if (user.role === 'doctor') {
      const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      doctorId = doctor?.id;
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      patient_id: patientId,
      doctor_id: doctorId,
    };

    const token = generateToken(authUser);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        patient_id: patientId,
        doctor_id: doctorId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const { email, password, full_name, role = 'patient', phone, city_id, date_of_birth, gender, blood_group, address } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    const db = await getDatabase();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      res.status(400).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 8);
    const userId = `usr-${Date.now()}`;

    await db.run(
      'INSERT INTO users (id, email, password_hash, role, full_name, phone, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email.toLowerCase().trim(), password_hash, role, full_name, phone || null, `https://api.dicebear.com/7.x/avataaars/svg?seed=${full_name}`]
    );

    let patientId: string | undefined;
    if (role === 'patient') {
      patientId = `pat-${Date.now()}`;
      await db.run(
        'INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address, city_id, pincode, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [patientId, userId, date_of_birth || null, gender || null, blood_group || null, address || null, city_id || 1, '400001', 0]
      );
    }

    const authUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      role,
      full_name,
      patient_id: patientId,
    };

    const token = generateToken(authUser);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        role,
        full_name,
        phone,
        patient_id: patientId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const user = await db.get('SELECT id, email, role, full_name, phone, avatar_url FROM users WHERE id = ?', [req.user!.id]);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    let extra: any = {};
    if (user.role === 'patient') {
      const patient = await db.get('SELECT * FROM patients WHERE user_id = ?', [user.id]);
      const family = await db.all('SELECT * FROM family_members WHERE patient_id = ?', [patient?.id]);
      extra = { patient, family };
    } else if (user.role === 'doctor') {
      const doctor = await db.get('SELECT d.*, s.name as specialization_name FROM doctors d JOIN specializations s ON d.specialization_id = s.id WHERE d.user_id = ?', [user.id]);
      const branches = doctor ? await db.all('SELECT db.*, hb.branch_name, hb.locality, hb.address FROM doctor_branches db JOIN hospital_branches hb ON db.branch_id = hb.id WHERE db.doctor_id = ?', [doctor.id]) : [];
      extra = { doctor, branches };
    }

    res.json({
      success: true,
      user: {
        ...user,
        patient_id: req.user!.patient_id,
        doctor_id: req.user!.doctor_id,
        ...extra,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/quick-switch
// Allows one-click switching among demo accounts for testing all 5 portals
router.post('/quick-switch', async (req, res: Response) => {
  try {
    const { targetRole } = req.body;
    const roleEmails: Record<string, string> = {
      patient: 'patient@carenex.demo',
      doctor: 'doctor@carenex.demo',
      hospital_admin: 'hospital@carenex.demo',
      diagnostic_admin: 'diagnostic@carenex.demo',
      super_admin: 'admin@carenex.demo',
    };

    const email = roleEmails[targetRole] || roleEmails.patient;
    const db = await getDatabase();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      res.status(404).json({ success: false, error: 'Demo user not found' });
      return;
    }

    let patientId: string | undefined;
    let doctorId: string | undefined;

    if (user.role === 'patient') {
      const patient = await db.get('SELECT id FROM patients WHERE user_id = ?', [user.id]);
      patientId = patient?.id;
    } else if (user.role === 'doctor') {
      const doctor = await db.get('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      doctorId = doctor?.id;
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      patient_id: patientId,
      doctor_id: doctorId,
    };

    const token = generateToken(authUser);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        patient_id: patientId,
        doctor_id: doctorId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
