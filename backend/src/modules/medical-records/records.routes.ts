import { Router, Request, Response } from 'express';
import { getDatabase } from '../../database/index.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/medical-records - Patient EHR records
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id } = req.query;
    const db = await getDatabase();

    let targetPatientId = patient_id as string;
    if (!targetPatientId) {
      const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
      targetPatientId = pat?.id || req.user!.patient_id || 'pat-1';
    }

    const records = await db.all(
      `SELECT mr.*, d.name as doctor_name, s.name as doctor_specialization
       FROM medical_records mr
       LEFT JOIN doctors d ON mr.doctor_id = d.id
       LEFT JOIN specializations s ON d.specialization_id = s.id
       WHERE mr.patient_id = ?
       ORDER BY mr.created_at DESC`,
      [targetPatientId]
    );

    res.json({ success: true, count: records.length, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/medical-records - Add EHR record
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id, record_type, title, description, file_url, doctor_id, appointment_id } = req.body;

    if (!title || !record_type) {
      res.status(400).json({ success: false, error: 'Title and record_type are required' });
      return;
    }

    const db = await getDatabase();
    let targetPatientId = patient_id;
    if (!targetPatientId) {
      const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
      targetPatientId = pat?.id || req.user!.patient_id || 'pat-1';
    }

    const recordId = `ehr-${Date.now()}`;
    await db.run(
      `INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, record_type, title, description, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        targetPatientId,
        doctor_id || null,
        appointment_id || null,
        record_type,
        title,
        description || '',
        file_url || 'https://carenex.demo/records/report_sample.pdf',
      ]
    );

    res.status(201).json({ success: true, recordId, message: 'Medical record added successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/prescriptions - List prescriptions
router.get('/prescriptions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const isDoctor = req.user!.role === 'doctor';

    let query = `
      SELECT 
        pr.*,
        d.name as doctor_name,
        d.qualification as doctor_qualification,
        s.name as specialization_name,
        u.full_name as patient_name,
        a.appointment_number,
        (SELECT COUNT(*) FROM prescription_items WHERE prescription_id = pr.id) as item_count
      FROM prescriptions pr
      JOIN doctors d ON pr.doctor_id = d.id
      JOIN specializations s ON d.specialization_id = s.id
      JOIN patients p ON pr.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN appointments a ON pr.appointment_id = a.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (isDoctor) {
      const doc = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user!.id]);
      query += ' AND pr.doctor_id = ?';
      params.push(doc?.id || 'doc-1');
    } else {
      const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
      query += ' AND pr.patient_id = ?';
      params.push(pat?.id || 'pat-1');
    }

    query += ' ORDER BY pr.created_at DESC LIMIT 50';

    const prescriptions = await db.all(query, params);

    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/prescriptions/:id - Single prescription details with medicines
router.get('/prescriptions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const rx = await db.get(
      `SELECT 
        pr.*,
        d.name as doctor_name,
        d.qualification as doctor_qualification,
        d.languages as doctor_languages,
        s.name as specialization_name,
        u.full_name as patient_name,
        u.phone as patient_phone,
        p.gender as patient_gender,
        p.date_of_birth as patient_dob,
        p.blood_group as patient_blood_group,
        a.appointment_number,
        hb.branch_name,
        hb.address as hospital_address,
        h.name as hospital_name
      FROM prescriptions pr
      JOIN doctors d ON pr.doctor_id = d.id
      JOIN specializations s ON d.specialization_id = s.id
      JOIN patients p ON pr.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN appointments a ON pr.appointment_id = a.id
      LEFT JOIN hospital_branches hb ON a.branch_id = hb.id
      LEFT JOIN hospitals h ON hb.hospital_id = h.id
      WHERE pr.id = ?`,
      [id]
    );

    if (!rx) {
      res.status(404).json({ success: false, error: 'Prescription not found' });
      return;
    }

    const items = await db.all('SELECT * FROM prescription_items WHERE prescription_id = ?', [id]);

    res.json({
      success: true,
      data: {
        ...rx,
        items,
        digital_signature: `Authenticated by ${rx.doctor_name} [CareNex Medical System]`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/prescriptions - Doctor creates digital prescription
router.post('/prescriptions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { appointment_id, patient_id, diagnosis, notes, follow_up_date, items } = req.body;

    if (!patient_id || !diagnosis || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Patient ID, diagnosis, and medicine items are required' });
      return;
    }

    const db = await getDatabase();
    const doc = await db.get('SELECT id, name FROM doctors WHERE user_id = ?', [req.user!.id]);
    const doctorId = doc?.id || req.user!.doctor_id || 'doc-1';

    await db.exec('BEGIN TRANSACTION;');

    const rxId = `rx-${Date.now()}`;
    await db.run(
      `INSERT INTO prescriptions (id, appointment_id, patient_id, doctor_id, diagnosis, notes, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [rxId, appointment_id || null, patient_id, doctorId, diagnosis, notes || '', follow_up_date || null]
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await db.run(
        `INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `rxi-${Date.now()}-${i}`,
          rxId,
          item.medicine_name,
          item.dosage,
          item.frequency,
          item.duration,
          item.instructions || 'Take as prescribed',
        ]
      );
    }

    // Auto mark appointment completed if appointment_id given
    if (appointment_id) {
      await db.run("UPDATE appointments SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [appointment_id]);
    }

    await db.exec('COMMIT;');

    res.status(201).json({ success: true, prescriptionId: rxId, message: 'Digital prescription issued successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/medical-records/family - Family profiles
router.get('/family', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
    const patientId = pat?.id || req.user!.patient_id || 'pat-1';

    const family = await db.all('SELECT * FROM family_members WHERE patient_id = ?', [patientId]);
    res.json({ success: true, count: family.length, data: family });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/medical-records/family - Add family profile
router.post('/family', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, relationship, age, gender, blood_group, medical_conditions } = req.body;
    if (!name || !relationship) {
      res.status(400).json({ success: false, error: 'Name and relationship are required' });
      return;
    }

    const db = await getDatabase();
    const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
    const patientId = pat?.id || req.user!.patient_id || 'pat-1';

    const famId = `fam-${Date.now()}`;
    await db.run(
      `INSERT INTO family_members (id, patient_id, name, relationship, age, gender, blood_group, medical_conditions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [famId, patientId, name, relationship, age || null, gender || null, blood_group || null, medical_conditions || 'None']
    );

    res.status(201).json({ success: true, id: famId, message: 'Family member profile created' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
