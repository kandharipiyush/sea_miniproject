import { Router, Request, Response } from 'express';
import { getDatabase } from '../../database/index.js';

const router = Router();

// GET /api/specializations
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const specializations = await db.all(`
      SELECT 
        s.*,
        COUNT(d.id) as doctor_count
      FROM specializations s
      LEFT JOIN doctors d ON s.id = d.specialization_id
      GROUP BY s.id
      ORDER BY s.id ASC
    `);

    res.json({ success: true, count: specializations.length, data: specializations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
