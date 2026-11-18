import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let dbInstance: Database | null = null;

// Haversine formula to compute great-circle distance in kilometers between two lat/lon pairs
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'carenex.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable WAL mode for high concurrency & performance
  await db.run('PRAGMA journal_mode = WAL;');
  await db.run('PRAGMA foreign_keys = ON;');

  dbInstance = db;
  return db;
}

export async function initDatabaseSchema(): Promise<void> {
  const db = await getDatabase();

  await db.exec(`
    -- States and Cities
    CREATE TABLE IF NOT EXISTS states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state_id INTEGER,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY(state_id) REFERENCES states(id)
    );

    -- Users and Roles
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'patient', 'doctor', 'hospital_admin', 'diagnostic_admin', 'super_admin'
      full_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Specializations
    CREATE TABLE IF NOT EXISTS specializations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT
    );

    -- Hospitals & Branches
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      organization_name TEXT,
      type TEXT DEFAULT 'Multispeciality Hospital',
      rating REAL DEFAULT 4.5,
      review_count INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      logo_url TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hospital_branches (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city_id INTEGER NOT NULL,
      locality TEXT NOT NULL,
      pincode TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      phone TEXT,
      emergency_service INTEGER DEFAULT 1,
      operating_hours TEXT DEFAULT '24x7',
      facilities TEXT,
      verification_status TEXT DEFAULT 'VERIFIED',
      data_source TEXT DEFAULT 'OpenStreetMap/Directory',
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
      FOREIGN KEY(city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS hospital_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id TEXT NOT NULL,
      department_name TEXT NOT NULL,
      FOREIGN KEY(branch_id) REFERENCES hospital_branches(id) ON DELETE CASCADE
    );

    -- Doctors & Doctor Branches
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      specialization_id INTEGER NOT NULL,
      qualification TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      consultation_fee REAL NOT NULL,
      rating REAL DEFAULT 4.8,
      review_count INTEGER DEFAULT 0,
      bio TEXT,
      languages TEXT DEFAULT 'English, Hindi',
      is_verified INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 1,
      verification_status TEXT DEFAULT 'DEMO_DATA',
      profile_photo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(specialization_id) REFERENCES specializations(id)
    );

    CREATE TABLE IF NOT EXISTS doctor_branches (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      consultation_fee REAL,
      schedule_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri',
      schedule_hours TEXT DEFAULT '09:00 - 17:00',
      is_active INTEGER DEFAULT 1,
      UNIQUE(doctor_id, branch_id),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY(branch_id) REFERENCES hospital_branches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS doctor_slots (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      slot_date TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      is_booked INTEGER DEFAULT 0,
      consultation_type TEXT DEFAULT 'IN_PERSON',
      UNIQUE(doctor_id, branch_id, slot_date, slot_time),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY(branch_id) REFERENCES hospital_branches(id) ON DELETE CASCADE
    );

    -- Patients & Family
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date_of_birth TEXT,
      gender TEXT,
      blood_group TEXT,
      address TEXT,
      city_id INTEGER,
      pincode TEXT,
      emergency_contact TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      blood_group TEXT,
      medical_conditions TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- Appointments & Booking
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_number TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      slot_id TEXT,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      consultation_type TEXT DEFAULT 'IN_PERSON',
      status TEXT DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'
      reason TEXT,
      fee REAL NOT NULL,
      payment_status TEXT DEFAULT 'PAID',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY(branch_id) REFERENCES hospital_branches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointment_status_history (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      changed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    );

    -- EHR & Prescriptions
    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT,
      appointment_id TEXT,
      record_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      appointment_id TEXT,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      notes TEXT,
      follow_up_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prescription_items (
      id TEXT PRIMARY KEY,
      prescription_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructions TEXT,
      FOREIGN KEY(prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
    );

    -- Diagnostic Centres & Tests
    CREATE TABLE IF NOT EXISTS diagnostic_centres (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city_id INTEGER NOT NULL,
      locality TEXT NOT NULL,
      pincode TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      phone TEXT,
      operating_hours TEXT DEFAULT '07:00 - 21:00',
      home_sample_collection INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      FOREIGN KEY(city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS diagnostic_tests (
      id TEXT PRIMARY KEY,
      centre_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      turnaround_hours INTEGER DEFAULT 24,
      sample_type TEXT DEFAULT 'Blood',
      FOREIGN KEY(centre_id) REFERENCES diagnostic_centres(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diagnostic_bookings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      centre_id TEXT NOT NULL,
      test_id TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      sample_collection_type TEXT DEFAULT 'LAB_VISIT',
      status TEXT DEFAULT 'CONFIRMED',
      payment_status TEXT DEFAULT 'PAID',
      report_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(centre_id) REFERENCES diagnostic_centres(id) ON DELETE CASCADE,
      FOREIGN KEY(test_id) REFERENCES diagnostic_tests(id) ON DELETE CASCADE
    );

    -- Pharmacies
    CREATE TABLE IF NOT EXISTS pharmacies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city_id INTEGER NOT NULL,
      locality TEXT NOT NULL,
      pincode TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      phone TEXT,
      operating_hours TEXT DEFAULT '24x7',
      is_24x7 INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      FOREIGN KEY(city_id) REFERENCES cities(id)
    );

    -- Emergency Facilities & Ambulances
    CREATE TABLE IF NOT EXISTS emergency_facilities (
      id TEXT PRIMARY KEY,
      facility_name TEXT NOT NULL,
      facility_type TEXT DEFAULT 'Emergency Trauma Center',
      address TEXT NOT NULL,
      city_id INTEGER NOT NULL,
      pincode TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      emergency_phone TEXT NOT NULL,
      ambulance_available INTEGER DEFAULT 1,
      blood_bank_available INTEGER DEFAULT 1,
      icu_beds INTEGER DEFAULT 20,
      is_24x7 INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      FOREIGN KEY(city_id) REFERENCES cities(id)
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Reviews & Ratings
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL, -- 'HOSPITAL' or 'DOCTOR'
      target_id TEXT NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high-speed lookups
    CREATE INDEX IF NOT EXISTS idx_hospital_branches_city ON hospital_branches(city_id);
    CREATE INDEX IF NOT EXISTS idx_hospital_branches_coords ON hospital_branches(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization_id);
    CREATE INDEX IF NOT EXISTS idx_doctor_branches_doctor ON doctor_branches(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_doctor_branches_branch ON doctor_branches(branch_id);
    CREATE INDEX IF NOT EXISTS idx_doctor_slots_booking ON doctor_slots(doctor_id, branch_id, slot_date, is_booked);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_branch ON appointments(branch_id);
  `);
}
