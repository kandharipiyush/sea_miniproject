import { Router, Response } from 'express';
import { getDatabase } from '../../database/index.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// POST /api/appointments - Book appointment with strict double-booking prevention & transaction
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { doctor_id, branch_id, slot_id, appointment_date, appointment_time, consultation_type = 'IN_PERSON', reason } = req.body;

    if (!doctor_id || !branch_id || !appointment_date || !appointment_time) {
      res.status(400).json({ success: false, error: 'Doctor, hospital branch, date, and time are required' });
      return;
    }

    const db = await getDatabase();

    // Get patient id from authenticated user or body
    let patientId = req.user?.patient_id;
    if (!patientId) {
      const patient = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
      patientId = patient?.id;
    }

    if (!patientId) {
      res.status(400).json({ success: false, error: 'Patient profile not found for this account' });
      return;
    }

    // Begin database transaction for safe atomic booking
    await db.exec('BEGIN TRANSACTION;');

    try {
      // 1. Strict check: Has this slot already been booked?
      if (slot_id) {
        const slot = await db.get('SELECT is_booked FROM doctor_slots WHERE id = ?', [slot_id]);
        if (slot && slot.is_booked === 1) {
          await db.exec('ROLLBACK;');
          res.status(409).json({ success: false, error: 'This time slot has already been reserved by another patient. Please pick another slot.' });
          return;
        }
      }

      // 2. Strict check: Prevent double booking of doctor at same branch, date, time
      const existing = await db.get(
        `SELECT id FROM appointments 
         WHERE doctor_id = ? AND branch_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('CANCELLED')`,
        [doctor_id, branch_id, appointment_date, appointment_time]
      );

      if (existing) {
        await db.exec('ROLLBACK;');
        res.status(409).json({ success: false, error: 'Doctor already has a confirmed consultation at this time.' });
        return;
      }

      // 3. Get doctor fee
      const doc = await db.get('SELECT consultation_fee, name FROM doctors WHERE id = ?', [doctor_id]);
      const branchRel = await db.get('SELECT consultation_fee FROM doctor_branches WHERE doctor_id = ? AND branch_id = ?', [doctor_id, branch_id]);
      const fee = branchRel?.consultation_fee || doc?.consultation_fee || 700;

      const aptId = `apt-${Date.now()}`;
      const year = new Date().getFullYear();
      const aptNumber = `CNX-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

      // 4. Insert appointment record
      await db.run(
        `INSERT INTO appointments (
          id, appointment_number, patient_id, doctor_id, branch_id, slot_id,
          appointment_date, appointment_time, consultation_type, status, reason, fee, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, 'PAID')`,
        [
          aptId,
          aptNumber,
          patientId,
          doctor_id,
          branch_id,
          slot_id || null,
          appointment_date,
          appointment_time,
          consultation_type,
          reason || 'Routine consultation',
          fee,
        ]
      );

      // 5. Mark slot as booked if slot_id provided
      if (slot_id) {
        await db.run('UPDATE doctor_slots SET is_booked = 1 WHERE id = ?', [slot_id]);
      }

      // 6. Record status history
      await db.run(
        'INSERT INTO appointment_status_history (id, appointment_id, status, notes, changed_by) VALUES (?, ?, ?, ?, ?)',
        [`ash-${Date.now()}`, aptId, 'CONFIRMED', 'Initial booking confirmed', req.user!.email]
      );

      // 7. Create notification for patient
      await db.run(
        'INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
        [
          `notif-${Date.now()}`,
          req.user!.id,
          'Appointment Confirmed',
          `Your appointment with ${doc?.name || 'Doctor'} is confirmed for ${appointment_date} at ${appointment_time}. Booking ID: ${aptNumber}`,
          'APPOINTMENT',
        ]
      );

      await db.exec('COMMIT;');

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointment_id: aptId,
          appointment_number: aptNumber,
          doctor_name: doc?.name,
          date: appointment_date,
          time: appointment_time,
          fee,
          status: 'CONFIRMED',
        },
      });
    } catch (err: any) {
      await db.exec('ROLLBACK;');
      throw err;
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/appointments/my - Get user appointments (patient or doctor)
router.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, filter } = req.query; // 'UPCOMING', 'PAST', 'ALL'
    const db = await getDatabase();
    const isDoctor = req.user!.role === 'doctor';

    let query = `
      SELECT 
        a.*,
        d.name as doctor_name,
        d.qualification as doctor_qualification,
        d.profile_photo as doctor_photo,
        s.name as specialization_name,
        hb.branch_name,
        hb.address as branch_address,
        hb.locality as branch_locality,
        hb.phone as branch_phone,
        h.name as hospital_name,
        c.name as city_name,
        p.gender as patient_gender,
        p.blood_group as patient_blood_group,
        p.date_of_birth as patient_dob,
        u.full_name as patient_name,
        u.phone as patient_phone,
        u.email as patient_email
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN specializations s ON d.specialization_id = s.id
      JOIN hospital_branches hb ON a.branch_id = hb.id
      JOIN hospitals h ON hb.hospital_id = h.id
      JOIN cities c ON hb.city_id = c.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (isDoctor) {
      // Find doctor record for this user
      const doc = await db.get('SELECT id FROM doctors WHERE user_id = ?', [req.user!.id]);
      const docId = doc?.id || req.user!.doctor_id || 'doc-1';
      query += ' AND a.doctor_id = ?';
      params.push(docId);
    } else {
      // Find patient record
      const pat = await db.get('SELECT id FROM patients WHERE user_id = ?', [req.user!.id]);
      const patId = pat?.id || req.user!.patient_id || 'pat-1';
      query += ' AND a.patient_id = ?';
      params.push(patId);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (filter === 'UPCOMING') {
      query += ` AND a.appointment_date >= ? AND a.status IN ('CONFIRMED', 'PENDING', 'RESCHEDULED')`;
      params.push(todayStr);
    } else if (filter === 'PAST') {
      query += ` AND (a.appointment_date < ? OR a.status IN ('COMPLETED', 'CANCELLED'))`;
      params.push(todayStr);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 100';

    const appointments = await db.all(query, params);

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/appointments/:id - Single appointment details
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const apt = await db.get(
      `SELECT 
        a.*,
        d.name as doctor_name,
        d.qualification as doctor_qualification,
        d.profile_photo as doctor_photo,
        s.name as specialization_name,
        hb.branch_name,
        hb.address as branch_address,
        hb.locality as branch_locality,
        hb.phone as branch_phone,
        h.name as hospital_name,
        c.name as city_name,
        u.full_name as patient_name,
        u.phone as patient_phone,
        u.email as patient_email
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN specializations s ON d.specialization_id = s.id
      JOIN hospital_branches hb ON a.branch_id = hb.id
      JOIN hospitals h ON hb.hospital_id = h.id
      JOIN cities c ON hb.city_id = c.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    if (!apt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    const history = await db.all('SELECT * FROM appointment_status_history WHERE appointment_id = ? ORDER BY created_at ASC', [id]);
    const prescription = await db.get('SELECT * FROM prescriptions WHERE appointment_id = ?', [id]);
    let prescriptionItems = [];
    if (prescription) {
      prescriptionItems = await db.all('SELECT * FROM prescription_items WHERE prescription_id = ?', [prescription.id]);
    }

    res.json({
      success: true,
      data: {
        ...apt,
        history,
        prescription: prescription ? { ...prescription, items: prescriptionItems } : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/appointments/:id/cancel - Cancel appointment
router.patch('/:id/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by user' } = req.body;
    const db = await getDatabase();

    const apt = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!apt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    if (apt.status === 'CANCELLED') {
      res.status(400).json({ success: false, error: 'Appointment is already cancelled' });
      return;
    }

    await db.exec('BEGIN TRANSACTION;');
    await db.run("UPDATE appointments SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    // Release slot if was linked
    if (apt.slot_id) {
      await db.run('UPDATE doctor_slots SET is_booked = 0 WHERE id = ?', [apt.slot_id]);
    }

    await db.run(
      'INSERT INTO appointment_status_history (id, appointment_id, status, notes, changed_by) VALUES (?, ?, ?, ?, ?)',
      [`ash-${Date.now()}`, id, 'CANCELLED', reason, req.user!.email]
    );

    await db.exec('COMMIT;');
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/appointments/:id/reschedule - Reschedule appointment
router.patch('/:id/reschedule', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { new_date, new_time, new_slot_id } = req.body;

    if (!new_date || !new_time) {
      res.status(400).json({ success: false, error: 'New date and time are required' });
      return;
    }

    const db = await getDatabase();
    const apt = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!apt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    await db.exec('BEGIN TRANSACTION;');

    // Release previous slot
    if (apt.slot_id) {
      await db.run('UPDATE doctor_slots SET is_booked = 0 WHERE id = ?', [apt.slot_id]);
    }

    // Reserve new slot if provided
    if (new_slot_id) {
      await db.run('UPDATE doctor_slots SET is_booked = 1 WHERE id = ?', [new_slot_id]);
    }

    await db.run(
      `UPDATE appointments SET 
        appointment_date = ?, 
        appointment_time = ?, 
        slot_id = ?, 
        status = 'RESCHEDULED', 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [new_date, new_time, new_slot_id || null, id]
    );

    await db.run(
      'INSERT INTO appointment_status_history (id, appointment_id, status, notes, changed_by) VALUES (?, ?, ?, ?, ?)',
      [`ash-${Date.now()}`, id, 'RESCHEDULED', `Rescheduled to ${new_date} at ${new_time}`, req.user!.email]
    );

    await db.exec('COMMIT;');
    res.json({ success: true, message: 'Appointment rescheduled successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/appointments/:id/complete - Mark appointment completed by Doctor
router.patch('/:id/complete', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    await db.run("UPDATE appointments SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    await db.run(
      'INSERT INTO appointment_status_history (id, appointment_id, status, notes, changed_by) VALUES (?, ?, ?, ?, ?)',
      [`ash-${Date.now()}`, id, 'COMPLETED', 'Consultation marked completed by Doctor', req.user!.email]
    );

    res.json({ success: true, message: 'Appointment marked as completed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
