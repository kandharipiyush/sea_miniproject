import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import locationRoutes from './modules/locations/locations.routes.js';
import specializationRoutes from './modules/specializations/specializations.routes.js';
import hospitalRoutes from './modules/hospitals/hospitals.routes.js';
import doctorRoutes from './modules/doctors/doctors.routes.js';
import appointmentRoutes from './modules/appointments/appointments.routes.js';
import recordRoutes from './modules/medical-records/records.routes.js';
import diagnosticRoutes from './modules/diagnostics/diagnostics.routes.js';
import pharmacyRoutes from './modules/pharmacies/pharmacies.routes.js';
import emergencyRoutes from './modules/emergency/emergency.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger in dev
  app.use((req, _res, next) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.url}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'CareNex – Smart Healthcare Appointment & Patient Management System',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/specializations', specializationRoutes);
  app.use('/api/hospitals', hospitalRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/medical-records', recordRoutes);
  app.use('/api/prescriptions', recordRoutes); // Also accessible under prescriptions
  app.use('/api/diagnostics', diagnosticRoutes);
  app.use('/api/pharmacies', pharmacyRoutes);
  app.use('/api/emergency', emergencyRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  });

  return app;
}
