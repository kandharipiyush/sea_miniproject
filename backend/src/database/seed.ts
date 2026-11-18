import bcrypt from 'bcryptjs';
import { getDatabase, initDatabaseSchema } from './index.js';

export interface SeedOptions {
  doctorCount: number;
  patientCount: number;
  appointmentCount: number;
}

export async function runSeed(options?: Partial<SeedOptions>) {
  console.log('🚀 Starting CareNex Database Seeding...');
  const startTime = Date.now();

  const isFull = process.argv.includes('--mode=full');
  const isSmall = process.argv.includes('--mode=small');

  // Configurable scale:
  // Default: 1,200 doctors, 5,000 patients, 220+ hospital branches
  // Full mode: 3,000 doctors, 8,000 patients
  // Small mode: 250 doctors, 500 patients (fast startup)
  let doctorTarget = 1200;
  let patientTarget = 5000;
  let appointmentTarget = 2500;

  if (isFull) {
    doctorTarget = 3000;
    patientTarget = 8000;
    appointmentTarget = 5000;
  } else if (isSmall) {
    doctorTarget = 250;
    patientTarget = 500;
    appointmentTarget = 600;
  }

  if (options?.doctorCount) doctorTarget = options.doctorCount;
  if (options?.patientCount) patientTarget = options.patientCount;
  if (options?.appointmentCount) appointmentTarget = options.appointmentCount;

  console.log(`📊 Target Configuration: ${doctorTarget} Doctors, ${patientTarget} Patients, ${appointmentTarget} Appointments`);

  await initDatabaseSchema();
  const db = await getDatabase();

  console.log('🧹 Clearing existing demo data...');
  await db.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM audit_logs;
    DELETE FROM reviews;
    DELETE FROM notifications;
    DELETE FROM emergency_facilities;
    DELETE FROM pharmacies;
    DELETE FROM diagnostic_bookings;
    DELETE FROM diagnostic_tests;
    DELETE FROM diagnostic_centres;
    DELETE FROM prescription_items;
    DELETE FROM prescriptions;
    DELETE FROM medical_records;
    DELETE FROM appointment_status_history;
    DELETE FROM appointments;
    DELETE FROM doctor_slots;
    DELETE FROM doctor_branches;
    DELETE FROM doctors;
    DELETE FROM hospital_departments;
    DELETE FROM hospital_branches;
    DELETE FROM hospitals;
    DELETE FROM specializations;
    DELETE FROM family_members;
    DELETE FROM patients;
    DELETE FROM users;
    DELETE FROM cities;
    DELETE FROM states;
    PRAGMA foreign_keys = ON;
  `);

  console.log('📍 Seeding Indian States & Cities...');
  await db.exec('BEGIN TRANSACTION;');

  const states = [
    { id: 1, name: 'Maharashtra', code: 'MH' },
    { id: 2, name: 'Delhi NCR', code: 'DL' },
    { id: 3, name: 'Karnataka', code: 'KA' },
    { id: 4, name: 'Telangana', code: 'TS' },
    { id: 5, name: 'Tamil Nadu', code: 'TN' },
    { id: 6, name: 'Gujarat', code: 'GJ' },
    { id: 7, name: 'West Bengal', code: 'WB' },
    { id: 8, name: 'Rajasthan', code: 'RJ' },
    { id: 9, name: 'Uttar Pradesh', code: 'UP' },
    { id: 10, name: 'Madhya Pradesh', code: 'MP' },
    { id: 11, name: 'Punjab & Haryana', code: 'CH' },
    { id: 12, name: 'Kerala', code: 'KL' },
  ];

  for (const st of states) {
    await db.run('INSERT INTO states (id, name, code) VALUES (?, ?, ?)', [st.id, st.name, st.code]);
  }

  const citiesData = [
    { id: 1, name: 'Mumbai', state_id: 1, lat: 19.0760, lon: 72.8777 },
    { id: 2, name: 'Kalyan', state_id: 1, lat: 19.2403, lon: 73.1305 },
    { id: 3, name: 'Dombivli', state_id: 1, lat: 19.2183, lon: 73.0867 },
    { id: 4, name: 'Thane', state_id: 1, lat: 19.2183, lon: 72.9781 },
    { id: 5, name: 'Navi Mumbai', state_id: 1, lat: 19.0330, lon: 73.0297 },
    { id: 6, name: 'Pune', state_id: 1, lat: 18.5204, lon: 73.8567 },
    { id: 7, name: 'Delhi', state_id: 2, lat: 28.6139, lon: 77.2090 },
    { id: 8, name: 'Bengaluru', state_id: 3, lat: 12.9716, lon: 77.5946 },
    { id: 9, name: 'Hyderabad', state_id: 4, lat: 17.3850, lon: 78.4867 },
    { id: 10, name: 'Chennai', state_id: 5, lat: 13.0827, lon: 80.2707 },
    { id: 11, name: 'Ahmedabad', state_id: 6, lat: 23.0225, lon: 72.5714 },
    { id: 12, name: 'Kolkata', state_id: 7, lat: 22.5726, lon: 88.3639 },
    { id: 13, name: 'Jaipur', state_id: 8, lat: 26.9124, lon: 75.7873 },
    { id: 14, name: 'Lucknow', state_id: 9, lat: 26.8467, lon: 80.9462 },
    { id: 15, name: 'Indore', state_id: 10, lat: 22.7196, lon: 75.8577 },
    { id: 16, name: 'Nagpur', state_id: 1, lat: 21.1458, lon: 79.0882 },
    { id: 17, name: 'Surat', state_id: 6, lat: 21.1702, lon: 72.8311 },
    { id: 18, name: 'Bhopal', state_id: 10, lat: 23.2599, lon: 77.4126 },
    { id: 19, name: 'Chandigarh', state_id: 11, lat: 30.7333, lon: 76.7794 },
    { id: 20, name: 'Kochi', state_id: 12, lat: 9.9312, lon: 76.2673 },
  ];

  for (const c of citiesData) {
    await db.run('INSERT INTO cities (id, name, state_id, latitude, longitude) VALUES (?, ?, ?, ?, ?)', [
      c.id,
      c.name,
      c.state_id,
      c.lat,
      c.lon,
    ]);
  }

  // 25+ Medical Specializations
  const specializations = [
    { id: 1, name: 'Cardiologist', slug: 'cardiologist', desc: 'Heart and cardiovascular system specialist', icon: 'HeartPulse' },
    { id: 2, name: 'Dermatologist', slug: 'dermatologist', desc: 'Skin, hair, nail conditions and cosmetology', icon: 'Sparkles' },
    { id: 3, name: 'Neurologist', slug: 'neurologist', desc: 'Brain, spinal cord, and nervous system disorders', icon: 'Brain' },
    { id: 4, name: 'Orthopedic', slug: 'orthopedic', desc: 'Bones, joints, ligaments and musculoskeletal surgery', icon: 'Activity' },
    { id: 5, name: 'Pediatrician', slug: 'pediatrician', desc: 'Infant, child, and adolescent medical care', icon: 'Baby' },
    { id: 6, name: 'Gynecologist', slug: 'gynecologist', desc: "Women's reproductive health, obstetrics and pregnancy", icon: 'UserCheck' },
    { id: 7, name: 'Ophthalmologist', slug: 'ophthalmologist', desc: 'Eye surgery, vision therapy, and ocular health', icon: 'Eye' },
    { id: 8, name: 'Dentist', slug: 'dentist', desc: 'Teeth, gums, oral surgery and aesthetic dentistry', icon: 'Smile' },
    { id: 9, name: 'ENT Specialist', slug: 'ent-specialist', desc: 'Ear, nose, throat and head-neck conditions', icon: 'Ear' },
    { id: 10, name: 'Psychiatrist', slug: 'psychiatrist', desc: 'Mental health, therapy and neuro-psychiatry', icon: 'SmilePlus' },
    { id: 11, name: 'General Physician', slug: 'general-physician', desc: 'Primary diagnosis, lifestyle care, fever, and internal medicine', icon: 'Stethoscope' },
    { id: 12, name: 'Gastroenterologist', slug: 'gastroenterologist', desc: 'Digestive system, liver, and endoscopy specialist', icon: 'Flame' },
    { id: 13, name: 'Oncologist', slug: 'oncologist', desc: 'Cancer diagnosis, chemotherapy, and surgical oncology', icon: 'ShieldAlert' },
    { id: 14, name: 'Endocrinologist', slug: 'endocrinologist', desc: 'Diabetes, thyroid, hormone and metabolism disorders', icon: 'Thermometer' },
    { id: 15, name: 'Urologist', slug: 'urologist', desc: 'Kidney stones, urinary tract and male reproductive health', icon: 'Filter' },
    { id: 16, name: 'Pulmonologist', slug: 'pulmonologist', desc: 'Lungs, asthma, allergy and respiratory critical care', icon: 'Wind' },
    { id: 17, name: 'Nephrologist', slug: 'nephrologist', desc: 'Kidney care, dialysis and renal medicine', icon: 'Droplet' },
    { id: 18, name: 'Rheumatologist', slug: 'rheumatologist', desc: 'Arthritis, autoimmune diseases and joint inflammation', icon: 'Zap' },
    { id: 19, name: 'Hematologist', slug: 'hematologist', desc: 'Blood disorders, anemia, and bone marrow diseases', icon: 'Droplets' },
    { id: 20, name: 'Radiologist', slug: 'radiologist', desc: 'Diagnostic imaging, ultrasound, CT and MRI scan reporting', icon: 'Radio' },
    { id: 21, name: 'Physiotherapist', slug: 'physiotherapist', desc: 'Physical rehab, stroke recovery, and sports injuries', icon: 'Dumbbell' },
    { id: 22, name: 'Nutritionist', slug: 'nutritionist', desc: 'Clinical dietetics, lifestyle nutrition, and weight wellness', icon: 'Apple' },
    { id: 23, name: 'Diabetologist', slug: 'diabetologist', desc: 'Specialized management of type 1 and type 2 diabetes', icon: 'Gauge' },
    { id: 24, name: 'General Surgeon', slug: 'general-surgeon', desc: 'Laparoscopic, hernia, abdominal and general surgery', icon: 'Scissors' },
    { id: 25, name: 'General Practitioner', slug: 'general-practitioner', desc: 'Routine checkups, immunizations, and family healthcare', icon: 'Cross' },
  ];

  for (const s of specializations) {
    await db.run('INSERT INTO specializations (id, name, slug, description, icon) VALUES (?, ?, ?, ?, ?)', [
      s.id,
      s.name,
      s.slug,
      s.desc,
      s.icon,
    ]);
  }

  await db.exec('COMMIT;');
  console.log('✅ States, Cities & Specializations seeded.');

  // Create Default Portal Users
  console.log('👥 Creating default demo role accounts...');
  const defaultPasswordHash = await bcrypt.hash('Password123!', 8);

  const defaultUsers = [
    {
      id: 'usr-patient-1',
      email: 'patient@carenex.demo',
      role: 'patient',
      full_name: 'Rahul Sharma',
      phone: '+91 98201 11223',
    },
    {
      id: 'usr-doctor-1',
      email: 'doctor@carenex.demo',
      role: 'doctor',
      full_name: 'Dr. Priya Desai (MD)',
      phone: '+91 98332 44556',
    },
    {
      id: 'usr-hospital-1',
      email: 'hospital@carenex.demo',
      role: 'hospital_admin',
      full_name: 'Apex Health Admin',
      phone: '+91 98110 77889',
    },
    {
      id: 'usr-diag-1',
      email: 'diagnostic@carenex.demo',
      role: 'diagnostic_admin',
      full_name: 'Metropolis Lab Director',
      phone: '+91 98450 99001',
    },
    {
      id: 'usr-admin-1',
      email: 'admin@carenex.demo',
      role: 'super_admin',
      full_name: 'Super Admin CareNex',
      phone: '+91 98200 00001',
    },
  ];

  await db.exec('BEGIN TRANSACTION;');
  for (const u of defaultUsers) {
    await db.run(
      'INSERT INTO users (id, email, password_hash, role, full_name, phone, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.id, u.email, defaultPasswordHash, u.role, u.full_name, u.phone, `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`]
    );
  }

  // Seed default patient profile
  await db.run(
    'INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address, city_id, pincode, emergency_contact, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['pat-1', 'usr-patient-1', '1992-05-14', 'Male', 'O+', 'Flat 402, Green Meadows, Chembur East', 1, '400071', '+91 98201 99999', 1]
  );

  // Seed family members for default patient
  const family = [
    { id: 'fam-1', name: 'Sunita Sharma', rel: 'Mother', age: 58, gender: 'Female', bg: 'B+', med: 'Hypertension, Type 2 Diabetes' },
    { id: 'fam-2', name: 'Ramesh Sharma', rel: 'Father', age: 63, gender: 'Male', bg: 'O+', med: 'Mild Osteoarthritis' },
    { id: 'fam-3', name: 'Aarav Sharma', rel: 'Son', age: 6, gender: 'Male', bg: 'O+', med: 'Seasonal dust allergy' },
  ];
  for (const f of family) {
    await db.run(
      'INSERT INTO family_members (id, patient_id, name, relationship, age, gender, blood_group, medical_conditions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [f.id, 'pat-1', f.name, f.rel, f.age, f.gender, f.bg, f.med]
    );
  }

  await db.exec('COMMIT;');
  console.log('✅ Default portal accounts ready.');

  // Seed Hospitals & Multi-Branches across Cities
  console.log('🏥 Seeding Hospitals and Multi-city Branches...');
  await db.exec('BEGIN TRANSACTION;');

  const hospitalOrgs = [
    { id: 'hosp-1', name: 'Apex Super Speciality Healthcare', org: 'Apex Hospitals Network', type: 'Multispeciality Hospital', rating: 4.8 },
    { id: 'hosp-2', name: 'Fortis Healthcare Group', org: 'Fortis Healthcare Ltd.', type: 'Multispeciality Hospital', rating: 4.7 },
    { id: 'hosp-3', name: 'Apollo Hospitals & Medical Centres', org: 'Apollo Hospitals Enterprise', type: 'Super Speciality Hospital', rating: 4.9 },
    { id: 'hosp-4', name: 'Lilavati Hospital & Research Trust', org: 'Lilavati Medical Trust', type: 'Private Multispeciality', rating: 4.8 },
    { id: 'hosp-5', name: 'Max Super Speciality Hospital', org: 'Max Healthcare Institute', type: 'Super Speciality Hospital', rating: 4.7 },
    { id: 'hosp-6', name: 'Manipal Hospitals Care Network', org: 'Manipal Health Enterprises', type: 'Multispeciality Hospital', rating: 4.8 },
    { id: 'hosp-7', name: 'Jupiter Lifeline Hospital', org: 'Jupiter Hospitals', type: 'Super Speciality Hospital', rating: 4.6 },
    { id: 'hosp-8', name: 'Kalyan Metro Multi-Care Hospital', org: 'Metro Healthcare Group', type: 'General & Trauma Hospital', rating: 4.5 },
    { id: 'hosp-9', name: 'Dombivli LifeCare Hospital', org: 'LifeCare Health Partners', type: 'Multispeciality Hospital', rating: 4.5 },
    { id: 'hosp-10', name: 'Kokilaben Dhirubhai Ambani Hospital', org: 'Mandke Foundation', type: 'Tertiary Care Hospital', rating: 4.9 },
    { id: 'hosp-11', name: 'CareNex Community Clinic Network', org: 'CareNex Health Services', type: 'Daycare & Polyclinic', rating: 4.6 },
    { id: 'hosp-12', name: 'Sancheti Orthopedic & Joint Institute', org: 'Sancheti Trust', type: 'Specialty Hospital', rating: 4.8 },
    { id: 'hosp-13', name: 'Narayana Health City', org: 'Narayana Hrudayalaya', type: 'Super Speciality Hospital', rating: 4.8 },
    { id: 'hosp-14', name: 'KIMS Hospitals', org: 'Krishna Institute of Medical Sciences', type: 'Multispeciality Hospital', rating: 4.7 },
    { id: 'hosp-15', name: 'MIOT International', org: 'MIOT Hospitals', type: 'Specialty & Orthopedic Hospital', rating: 4.7 },
  ];

  for (const h of hospitalOrgs) {
    await db.run(
      'INSERT INTO hospitals (id, name, organization_name, type, rating, review_count, is_verified, is_demo, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [h.id, h.name, h.org, h.type, h.rating, Math.floor(Math.random() * 200 + 40), 1, 0, `Comprehensive healthcare delivery across branches with accredited ICU and modern departments.`]
    );
  }

  // Realistic Localities & Branches for each city
  const cityLocalities: Record<number, { name: string; pincode: string; latOffset: number; lonOffset: number }[]> = {
    1: [ // Mumbai
      { name: 'Chembur', pincode: '400071', latOffset: -0.015, lonOffset: 0.021 },
      { name: 'Ghatkopar East', pincode: '400077', latOffset: 0.010, lonOffset: 0.035 },
      { name: 'Kurla West', pincode: '400070', latOffset: -0.005, lonOffset: 0.008 },
      { name: 'Bandra West', pincode: '400050', latOffset: -0.025, lonOffset: -0.045 },
      { name: 'Andheri East', pincode: '400069', latOffset: 0.042, lonOffset: -0.020 },
      { name: 'Dadar West', pincode: '400028', latOffset: -0.055, lonOffset: -0.040 },
      { name: 'Powai', pincode: '400076', latOffset: 0.048, lonOffset: 0.031 },
      { name: 'Borivali West', pincode: '400092', latOffset: 0.150, lonOffset: -0.025 },
      { name: 'Colaba', pincode: '400005', latOffset: -0.165, lonOffset: -0.060 },
      { name: 'Mulund West', pincode: '400080', latOffset: 0.098, lonOffset: 0.075 },
    ],
    2: [ // Kalyan
      { name: 'Kalyan West (Station Rd)', pincode: '421301', latOffset: 0.002, lonOffset: -0.005 },
      { name: 'Kalyan East (Chinchpada)', pincode: '421306', latOffset: -0.008, lonOffset: 0.012 },
      { name: 'Khadakpada', pincode: '421301', latOffset: 0.018, lonOffset: -0.002 },
      { name: 'Godrej Hill', pincode: '421301', latOffset: 0.025, lonOffset: 0.008 },
      { name: 'Gandhar Nagar', pincode: '421301', latOffset: 0.012, lonOffset: -0.015 },
    ],
    3: [ // Dombivli
      { name: 'Dombivli East (Manpada)', pincode: '421201', latOffset: 0.005, lonOffset: 0.008 },
      { name: 'Dombivli West (Vishnu Nagar)', pincode: '421202', latOffset: -0.004, lonOffset: -0.006 },
      { name: 'MIDC Phase 2', pincode: '421203', latOffset: 0.012, lonOffset: 0.015 },
      { name: 'Gopal Nagar', pincode: '421201', latOffset: -0.002, lonOffset: 0.004 },
    ],
    4: [ // Thane
      { name: 'Thane West (Majiwada)', pincode: '400601', latOffset: 0.008, lonOffset: 0.005 },
      { name: 'Ghodbunder Road', pincode: '400607', latOffset: 0.045, lonOffset: -0.012 },
      { name: 'Naupada', pincode: '400602', latOffset: -0.015, lonOffset: -0.008 },
      { name: 'Kolshet Road', pincode: '400607', latOffset: 0.022, lonOffset: 0.018 },
      { name: 'Vartak Nagar', pincode: '400606', latOffset: 0.005, lonOffset: -0.010 },
    ],
    5: [ // Navi Mumbai
      { name: 'Vashi Sector 17', pincode: '400703', latOffset: 0.005, lonOffset: -0.012 },
      { name: 'Nerul West', pincode: '400706', latOffset: -0.028, lonOffset: 0.002 },
      { name: 'Belapur CBD', pincode: '400614', latOffset: -0.052, lonOffset: 0.015 },
      { name: 'Kharghar Sector 20', pincode: '410210', latOffset: -0.042, lonOffset: 0.055 },
      { name: 'Koparkhairane', pincode: '400709', latOffset: 0.038, lonOffset: -0.008 },
    ],
    6: [ // Pune
      { name: 'Koregaon Park', pincode: '411001', latOffset: 0.018, lonOffset: 0.035 },
      { name: 'Shivajinagar', pincode: '411005', latOffset: 0.010, lonOffset: -0.010 },
      { name: 'Kothrud', pincode: '411038', latOffset: -0.015, lonOffset: -0.045 },
      { name: 'Hinjewadi Phase 1', pincode: '411057', latOffset: 0.065, lonOffset: -0.120 },
      { name: 'Viman Nagar', pincode: '411014', latOffset: 0.045, lonOffset: 0.065 },
    ],
    7: [ // Delhi
      { name: 'Connaught Place', pincode: '110001', latOffset: 0.012, lonOffset: 0.005 },
      { name: 'Saket (Max Healthcare)', pincode: '110017', latOffset: -0.095, lonOffset: 0.015 },
      { name: 'Dwarka Sector 12', pincode: '110075', latOffset: -0.025, lonOffset: -0.155 },
      { name: 'Rohini Sector 14', pincode: '110085', latOffset: 0.095, lonOffset: -0.095 },
      { name: 'Lajpat Nagar', pincode: '110024', latOffset: -0.045, lonOffset: 0.035 },
    ],
    8: [ // Bengaluru
      { name: 'Indiranagar 100ft Rd', pincode: '560038', latOffset: 0.008, lonOffset: 0.045 },
      { name: 'Koramangala 5th Block', pincode: '560095', latOffset: -0.038, lonOffset: 0.025 },
      { name: 'Whitefield Main Rd', pincode: '560066', latOffset: 0.002, lonOffset: 0.150 },
      { name: 'Jayanagar 4th Block', pincode: '560011', latOffset: -0.045, lonOffset: -0.015 },
      { name: 'Hebbal Flyover', pincode: '560024', latOffset: 0.075, lonOffset: -0.008 },
    ],
    9: [ // Hyderabad
      { name: 'Jubilee Hills Checkpost', pincode: '500033', latOffset: 0.035, lonOffset: -0.065 },
      { name: 'Banjara Hills Rd No 12', pincode: '500034', latOffset: 0.025, lonOffset: -0.045 },
      { name: 'Gachibowli IT Corridor', pincode: '500032', latOffset: 0.045, lonOffset: -0.125 },
      { name: 'Secunderabad Station', pincode: '500003', latOffset: 0.055, lonOffset: 0.035 },
    ],
    10: [ // Chennai
      { name: 'Greams Road (Apollo)', pincode: '600006', latOffset: -0.025, lonOffset: -0.015 },
      { name: 'Adyar Canal Bank', pincode: '600020', latOffset: -0.075, lonOffset: -0.010 },
      { name: 'T Nagar', pincode: '600017', latOffset: -0.042, lonOffset: -0.035 },
      { name: 'Anna Nagar West', pincode: '600040', latOffset: 0.015, lonOffset: -0.055 },
    ],
    11: [ // Ahmedabad
      { name: 'SG Highway', pincode: '380054', latOffset: 0.025, lonOffset: -0.045 },
      { name: 'Navrangpura', pincode: '380009', latOffset: 0.012, lonOffset: -0.015 },
      { name: 'Maninagar', pincode: '380008', latOffset: -0.035, lonOffset: 0.035 },
    ],
    12: [ // Kolkata
      { name: 'Salt Lake Sector 5', pincode: '700091', latOffset: 0.015, lonOffset: 0.065 },
      { name: 'Park Street', pincode: '700016', latOffset: -0.025, lonOffset: -0.010 },
      { name: 'Alipore', pincode: '700027', latOffset: -0.045, lonOffset: -0.035 },
    ],
    13: [ // Jaipur
      { name: 'Malviya Nagar', pincode: '302017', latOffset: -0.045, lonOffset: 0.025 },
      { name: 'Vaishali Nagar', pincode: '302021', latOffset: 0.015, lonOffset: -0.045 },
    ],
    14: [ // Lucknow
      { name: 'Gomti Nagar', pincode: '226010', latOffset: 0.015, lonOffset: 0.055 },
      { name: 'Hazratganj', pincode: '226001', latOffset: 0.005, lonOffset: -0.015 },
    ],
    15: [ // Indore
      { name: 'Vijay Nagar', pincode: '452010', latOffset: 0.045, lonOffset: 0.025 },
      { name: 'Old Palasia', pincode: '452001', latOffset: 0.010, lonOffset: 0.005 },
    ],
    16: [ // Nagpur
      { name: 'Dharampeth', pincode: '440010', latOffset: 0.012, lonOffset: -0.025 },
      { name: 'Ramdaspeth', pincode: '440010', latOffset: -0.008, lonOffset: -0.015 },
    ],
    17: [ // Surat
      { name: 'Athwa Lines', pincode: '395007', latOffset: -0.015, lonOffset: -0.025 },
      { name: 'Adajan', pincode: '395009', latOffset: 0.015, lonOffset: -0.035 },
    ],
    18: [ // Bhopal
      { name: 'MP Nagar Zone 1', pincode: '462011', latOffset: -0.015, lonOffset: 0.025 },
      { name: 'Arera Colony', pincode: '462016', latOffset: -0.045, lonOffset: 0.035 },
    ],
    19: [ // Chandigarh
      { name: 'Sector 34-A', pincode: '160022', latOffset: -0.015, lonOffset: 0.015 },
      { name: 'Sector 17 Plaza', pincode: '160017', latOffset: 0.010, lonOffset: -0.010 },
    ],
    20: [ // Kochi
      { name: 'Edappally', pincode: '682024', latOffset: 0.065, lonOffset: 0.035 },
      { name: 'Ernakulam South', pincode: '682016', latOffset: 0.015, lonOffset: 0.015 },
    ],
  };

  const departmentsList = [
    'Emergency & Trauma Care',
    'Cardiology & Cath Lab',
    'Orthopedics & Joint Replacement',
    'Neurology & Neuro Surgery',
    'General & Laparoscopic Surgery',
    'Pediatrics & Neonatology',
    'Obstetrics & Gynecology',
    'Dermatology & Cosmetology',
    'Diagnostic Radiology & MRI',
    'Oncology & Chemotherapy Unit',
    'Intensive Care Unit (ICU & NICU)',
    'Nephrology & Dialysis Center',
    'Pulmonology & Respiratory Care',
    'Physiotherapy & Rehabilitation',
    'Pathology & Central Laboratory',
  ];

  const createdBranches: { id: string; name: string; city_id: number; lat: number; lon: number }[] = [];
  let branchCount = 0;

  for (const city of citiesData) {
    const locs = cityLocalities[city.id] || [
      { name: 'Central Area', pincode: '400001', latOffset: 0, lonOffset: 0 },
      { name: 'Civil Lines', pincode: '400002', latOffset: 0.01, lonOffset: 0.01 },
    ];

    for (const loc of locs) {
      // Pick 2-4 hospital orgs for each locality to create realistic branches
      const branchHospCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < branchHospCount; i++) {
        branchCount++;
        const hosp = hospitalOrgs[(branchCount + i) % hospitalOrgs.length];
        const branchId = `br-${city.id}-${branchCount}`;
        const branchName = `${hosp.name} – ${loc.name} Branch`;
        const branchLat = city.lat + loc.latOffset + (Math.random() - 0.5) * 0.008;
        const branchLon = city.lon + loc.lonOffset + (Math.random() - 0.5) * 0.008;

        const facilities = ['24x7 Emergency', 'Modular Operation Theatres', 'Digital ICU & Ventilators', '24x7 Pharmacy', 'In-house Pathology', 'Ambulance GPS Tracking', 'Cafeteria', 'Valet Parking'].join(', ');

        await db.run(
          `INSERT INTO hospital_branches (
            id, hospital_id, branch_name, address, city_id, locality, pincode, latitude, longitude,
            phone, emergency_service, operating_hours, facilities, verification_status, data_source, is_demo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            branchId,
            hosp.id,
            branchName,
            `Plot ${Math.floor(Math.random() * 120 + 1)}, Near City Landmark, ${loc.name}`,
            city.id,
            loc.name,
            loc.pincode,
            branchLat,
            branchLon,
            `+91 ${city.id < 10 ? '0' + city.id : city.id} 27${Math.floor(Math.random() * 89999 + 10000)}`,
            1,
            '24x7',
            facilities,
            'VERIFIED',
            'CareNex Directory & OpenStreetMap',
            0,
          ]
        );

        createdBranches.push({ id: branchId, name: branchName, city_id: city.id, lat: branchLat, lon: branchLon });

        // Add 6-9 departments per branch
        const deptCount = Math.floor(Math.random() * 4) + 6;
        for (let d = 0; d < deptCount; d++) {
          await db.run('INSERT INTO hospital_departments (branch_id, department_name) VALUES (?, ?)', [
            branchId,
            departmentsList[d % departmentsList.length],
          ]);
        }
      }
    }
  }

  await db.exec('COMMIT;');
  console.log(`✅ Seeded ${createdBranches.length} hospital branches across 20 cities.`);

  // Seed Diagnostic Centres, Pharmacies & Emergency Facilities
  console.log('🧪 Seeding Diagnostic Labs, Pharmacies & Emergency Centers...');
  await db.exec('BEGIN TRANSACTION;');

  const labBrands = [
    { name: 'Metropolis Healthcare Diagnostic Lab', tests: 40 },
    { name: 'Dr Lal PathLabs Advanced Diagnostic Centre', tests: 45 },
    { name: 'SRL Diagnostics & Imaging Centre', tests: 35 },
    { name: 'Thyrocare Wellness Diagnostics', tests: 30 },
    { name: 'Apollo Diagnostics Laboratory', tests: 50 },
    { name: 'Suburban Diagnostics Center', tests: 38 },
  ];

  const standardTests = [
    { name: 'Complete Blood Count (CBC) with ESR', cat: 'Hematology', price: 380, time: 12, sample: 'Blood' },
    { name: 'Lipid Profile Comprehensive', cat: 'Biochemistry', price: 650, time: 18, sample: 'Blood Fasting' },
    { name: 'HbA1c & Fasting Blood Sugar', cat: 'Diabetes', price: 490, time: 12, sample: 'Blood' },
    { name: 'Thyroid Profile Total (T3, T4, TSH)', cat: 'Endocrinology', price: 550, time: 24, sample: 'Blood' },
    { name: 'Liver Function Test (LFT Complete)', cat: 'Biochemistry', price: 720, time: 18, sample: 'Blood' },
    { name: 'Kidney Function Test (KFT with Electrolytes)', cat: 'Nephrology', price: 750, time: 18, sample: 'Blood' },
    { name: 'Vitamin D3 (25-Hydroxy) & Vitamin B12', cat: 'Vitamins', price: 1200, time: 24, sample: 'Blood' },
    { name: 'Digital Chest X-Ray PA View', cat: 'Radiology', price: 450, time: 4, sample: 'Scan' },
    { name: 'Whole Abdomen & Pelvis Ultrasound (USG)', cat: 'Radiology', price: 1400, time: 6, sample: 'Scan' },
    { name: 'High Resolution Brain MRI (1.5 Tesla)', cat: 'Advanced Imaging', price: 5500, time: 24, sample: 'Scan' },
    { name: 'CT Scan Whole Abdomen Contrast Enhanced', cat: 'Advanced Imaging', price: 4800, time: 24, sample: 'Scan' },
    { name: 'Urine Routine & Microscopic Examination', cat: 'Pathology', price: 200, time: 8, sample: 'Urine' },
  ];

  const pharmacyBrands = ['Apollo Pharmacy 24x7', 'MedPlus Health Store', 'Wellness Forever Chemists 24x7', 'Noble Medical Chemists', 'Frank Ross Pharmacy', 'Guardian Pharmacy'];

  let labIdx = 0;
  let pharmIdx = 0;
  let emergIdx = 0;

  for (const b of createdBranches.slice(0, 120)) {
    labIdx++;
    const labBrand = labBrands[labIdx % labBrands.length];
    const labId = `lab-${labIdx}`;
    await db.run(
      `INSERT INTO diagnostic_centres (
        id, name, address, city_id, locality, pincode, latitude, longitude, phone, operating_hours, home_sample_collection, is_verified, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        labId,
        `${labBrand.name} (${b.name.split('–')[1] || 'Centre'})`,
        `Commercial Complex, 1st Floor, Near ${b.name.split('–')[0]}`,
        b.city_id,
        b.name.split('–')[1]?.trim() || 'Downtown',
        '400071',
        b.lat + 0.003,
        b.lon - 0.004,
        `+91 1800 2${Math.floor(Math.random() * 89999 + 10000)}`,
        '07:00 - 21:00',
        1,
        1,
        0,
      ]
    );

    // Add tests
    let tIdx = 0;
    for (const t of standardTests) {
      tIdx++;
      await db.run(
        'INSERT INTO diagnostic_tests (id, centre_id, test_name, category, price, turnaround_hours, sample_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`test-${labIdx}-${tIdx}`, labId, t.name, t.cat, t.price, t.time, t.sample]
      );
    }

    // Pharmacy
    pharmIdx++;
    const pBrand = pharmacyBrands[pharmIdx % pharmacyBrands.length];
    await db.run(
      `INSERT INTO pharmacies (
        id, name, address, city_id, locality, pincode, latitude, longitude, phone, operating_hours, is_24x7, is_verified, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `pharm-${pharmIdx}`,
        `${pBrand} – ${b.name.split('–')[1] || 'Main'}`,
        `Shop No ${Math.floor(Math.random() * 30 + 1)}, Beside ${b.name}`,
        b.city_id,
        b.name.split('–')[1]?.trim() || 'Central',
        '400071',
        b.lat - 0.002,
        b.lon + 0.003,
        `+91 99${Math.floor(Math.random() * 89999999 + 10000000)}`,
        '24x7',
        1,
        1,
        0,
      ]
    );

    // Emergency Facilities
    if (emergIdx < 60) {
      emergIdx++;
      await db.run(
        `INSERT INTO emergency_facilities (
          id, facility_name, facility_type, address, city_id, pincode, latitude, longitude,
          emergency_phone, ambulance_available, blood_bank_available, icu_beds, is_24x7, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `emrg-${emergIdx}`,
          `CareNex 24x7 Trauma & Emergency Center – ${b.name.split('–')[1] || 'Unit'}`,
          'Level-1 Trauma & Emergency Care',
          `Emergency Gate 2, ${b.name}`,
          b.city_id,
          '400071',
          b.lat + 0.001,
          b.lon + 0.001,
          `108 / +91 ${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
          1,
          1,
          Math.floor(Math.random() * 40 + 15),
          1,
          0,
        ]
      );
    }
  }

  await db.exec('COMMIT;');
  console.log(`✅ Seeded ${labIdx} Diagnostic Centers, ${pharmIdx} Pharmacies, and ${emergIdx} Emergency Trauma Centers.`);

  // Seed 1,000–3,000+ Fictional Doctors
  console.log(`👨‍⚕️ Generating and Seeding ${doctorTarget} Fictional Doctors across Cities & Branches...`);

  const firstNamesM = ['Dr. Rajesh', 'Dr. Amit', 'Dr. Vikram', 'Dr. Sandeep', 'Dr. Rohan', 'Dr. Nitin', 'Dr. Suresh', 'Dr. Manish', 'Dr. Alok', 'Dr. Deepak', 'Dr. Harish', 'Dr. Kunal', 'Dr. Abhinav', 'Dr. Arvind', 'Dr. Pradeep', 'Dr. Vivek', 'Dr. Siddharth', 'Dr. Gaurav', 'Dr. Tarun', 'Dr. Manoj'];
  const firstNamesF = ['Dr. Ananya', 'Dr. Sneha', 'Dr. Sunita', 'Dr. Pooja', 'Dr. Neha', 'Dr. Kavita', 'Dr. Ritu', 'Dr. Shweta', 'Dr. Meera', 'Dr. Shalini', 'Dr. Priyanka', 'Dr. Divya', 'Dr. Tanvi', 'Dr. Swati', 'Dr. Aarti', 'Dr. Rashmi', 'Dr. Jyoti', 'Dr. Rekha', 'Dr. Vandana', 'Dr. Shruti'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Deshmukh', 'Kulkarni', 'Joshi', 'Mehta', 'Gupta', 'Iyer', 'Reddy', 'Nair', 'Singh', 'Chopra', 'Bhattacharya', 'Mukherjee', 'Rao', 'Bansal', 'Agarwal', 'Chatterjee', 'Mishra', 'Choudhury', 'Patil', 'Pandey', 'Saxena', 'Kapoor'];

  const qualificationsMap: Record<number, string[]> = {
    1: ['MBBS, MD (Cardiology), DM', 'MBBS, DNB (Cardiology), FACC', 'MBBS, MS, MCh (Cardio-Thoracic)'],
    2: ['MBBS, MD (Dermatology, Venereology & Leprosy)', 'MBBS, DDVL (Cosmetology)'],
    3: ['MBBS, MD (Medicine), DM (Neurology)', 'MBBS, DNB (Neurology), FINR'],
    4: ['MBBS, MS (Orthopedics), MCh (Joint Replacement)', 'MBBS, DNB (Ortho), Fellowship in Arthroscopy'],
    5: ['MBBS, MD (Pediatrics), DCH', 'MBBS, DNB (Pediatrics), Fellowship in Neonatology'],
    6: ['MBBS, MS (OBGYN), DGO, FICOG', 'MBBS, DNB (Obstetrics & Gynecology)'],
    7: ['MBBS, MS (Ophthalmology), FICO (UK)', 'MBBS, DO, DNB (Ophthalmology)'],
    8: ['BDS, MDS (Oral & Maxillofacial Surgery)', 'BDS, MDS (Orthodontics & Dentofacial)'],
    9: ['MBBS, MS (ENT), DLO', 'MBBS, DNB (Otorhinolaryngology)'],
    10: ['MBBS, MD (Psychiatry), DPM', 'MBBS, DNB (Psychiatry)'],
    11: ['MBBS, MD (General Medicine)', 'MBBS, DNB (Internal Medicine), FACP'],
    12: ['MBBS, MD (Medicine), DM (Gastroenterology)', 'MBBS, DNB (Gastro)'],
    13: ['MBBS, MD, DM (Medical Oncology)', 'MBBS, MS, MCh (Surgical Oncology)'],
    14: ['MBBS, MD (Medicine), DM (Endocrinology)', 'MBBS, DNB (Endocrinology)'],
    15: ['MBBS, MS, MCh (Urology)', 'MBBS, DNB (Genito-Urinary Surgery)'],
    16: ['MBBS, MD (Pulmonary Medicine), FCCP', 'MBBS, DTCD, DNB (Respiratory)'],
    17: ['MBBS, MD, DM (Nephrology)', 'MBBS, DNB (Nephrology)'],
    18: ['MBBS, MD (Medicine), Fellowship in Rheumatology'],
    19: ['MBBS, MD (Pathology), DM (Clinical Hematology)'],
    20: ['MBBS, MD (Radio-Diagnosis), DMRD'],
    21: ['BPT, MPT (Musculoskeletal & Sports)', 'BPT, MPT (Neuro-Physiotherapy)'],
    22: ['M.Sc. Clinical Nutrition & Dietetics, RD'],
    23: ['MBBS, Post Graduate Diploma in Diabetology (PGDD)'],
    24: ['MBBS, MS (General Surgery), FMAS, FIAGES'],
    25: ['MBBS, Family Medicine Certification (MRCGP)'],
  };

  const fees = [500, 600, 700, 800, 900, 1000, 1200, 1500, 1800, 2000];
  const daysCombinations = [
    'Mon,Tue,Wed,Thu,Fri',
    'Mon,Wed,Fri',
    'Tue,Thu,Sat',
    'Mon,Tue,Wed,Thu,Fri,Sat',
    'Mon,Tue,Wed',
    'Thu,Fri,Sat',
  ];
  const hoursCombinations = [
    '09:00 - 13:00',
    '14:00 - 18:00',
    '10:00 - 16:00',
    '16:00 - 20:00',
    '09:00 - 17:00',
  ];

  const doctorList: { id: string; name: string; specId: number; fee: number; branchId: string }[] = [];

  // Seed default doctor first
  const defaultDocId = 'doc-1';
  await db.run(
    `INSERT INTO doctors (
      id, user_id, name, specialization_id, qualification, experience_years, consultation_fee,
      rating, review_count, bio, languages, is_verified, is_demo, verification_status, profile_photo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      defaultDocId,
      'usr-doctor-1',
      'Dr. Priya Desai (MD)',
      1, // Cardiologist
      'MBBS, MD (Cardiology), DM (Interventional Cardiology)',
      14,
      900,
      4.9,
      128,
      'Senior Interventional Cardiologist specializing in preventive cardiology, coronary angioplasty, and heart rhythm management. Over 14 years of clinical excellence.',
      'English, Hindi, Marathi',
      1,
      1,
      'DEMO_DATA',
      '/avatars/female-doctor.svg',
    ]
  );

  // Link default doctor to Chembur branch and Kalyan branch (multi-branch doctor)
  const defaultBranch1 = createdBranches[0]?.id || 'br-1-1';
  const defaultBranch2 = createdBranches[10]?.id || 'br-2-1';
  await db.run(
    'INSERT INTO doctor_branches (id, doctor_id, branch_id, consultation_fee, schedule_days, schedule_hours) VALUES (?, ?, ?, ?, ?, ?)',
    ['db-def-1', defaultDocId, defaultBranch1, 900, 'Mon,Wed,Fri', '09:00 - 13:00']
  );
  await db.run(
    'INSERT INTO doctor_branches (id, doctor_id, branch_id, consultation_fee, schedule_days, schedule_hours) VALUES (?, ?, ?, ?, ?, ?)',
    ['db-def-2', defaultDocId, defaultBranch2, 850, 'Tue,Thu,Sat', '14:00 - 18:00']
  );
  doctorList.push({ id: defaultDocId, name: 'Dr. Priya Desai (MD)', specId: 1, fee: 900, branchId: defaultBranch1 });

  // Generate batch of doctors in chunks of 250 with transactions
  const BATCH_SIZE = 250;
  for (let bStart = 1; bStart < doctorTarget; bStart += BATCH_SIZE) {
    const bEnd = Math.min(bStart + BATCH_SIZE, doctorTarget);
    await db.exec('BEGIN TRANSACTION;');

    for (let i = bStart; i < bEnd; i++) {
      const isFemale = i % 2 === 0;
      const fn = isFemale
        ? firstNamesF[i % firstNamesF.length]
        : firstNamesM[i % firstNamesM.length];
      const ln = lastNames[(i * 3 + 7) % lastNames.length];
      const docName = `${fn} ${ln}`;
      const specId = (i % 25) + 1; // Covers all 25 specializations evenly
      const quals = qualificationsMap[specId] || ['MBBS, MD'];
      const qual = quals[i % quals.length];
      const exp = Math.floor(Math.random() * 26) + 4; // 4 to 30 years
      const fee = fees[i % fees.length];
      const rating = Math.round((4.2 + (i % 8) * 0.1) * 10) / 10;
      const reviewCount = (i * 7) % 180 + 15;
      const docId = `doc-${i + 1}`;

      const avatar = isFemale
        ? '/avatars/female-doctor.svg'
        : '/avatars/male-doctor.svg';

      await db.run(
        `INSERT INTO doctors (
          id, user_id, name, specialization_id, qualification, experience_years, consultation_fee,
          rating, review_count, bio, languages, is_verified, is_demo, verification_status, profile_photo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          docId,
          null,
          docName,
          specId,
          qual,
          exp,
          fee,
          rating,
          reviewCount,
          `Dedicated specialist with ${exp} years of clinical expertise in treating complex medical conditions with patient-centric care.`,
          'English, Hindi' + (i % 3 === 0 ? ', Regional' : ''),
          1,
          1,
          'DEMO_DATA',
          avatar,
        ]
      );

      // Assign to 1 or 2 hospital branches (Multi-branch healthcare ecosystem)
      const primaryBranch = createdBranches[i % createdBranches.length];
      await db.run(
        'INSERT INTO doctor_branches (id, doctor_id, branch_id, consultation_fee, schedule_days, schedule_hours) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `db-${i + 1}-1`,
          docId,
          primaryBranch.id,
          fee,
          daysCombinations[i % daysCombinations.length],
          hoursCombinations[i % hoursCombinations.length],
        ]
      );
      doctorList.push({ id: docId, name: docName, specId, fee, branchId: primaryBranch.id });

      // 30% of doctors also practice at a secondary branch in nearby city or area
      if (i % 3 === 0 && createdBranches.length > 1) {
        const secondaryBranch = createdBranches[(i + 5) % createdBranches.length];
        if (secondaryBranch.id !== primaryBranch.id) {
          await db.run(
            'INSERT INTO doctor_branches (id, doctor_id, branch_id, consultation_fee, schedule_days, schedule_hours) VALUES (?, ?, ?, ?, ?, ?)',
            [
              `db-${i + 1}-2`,
              docId,
              secondaryBranch.id,
              fee + 50,
              'Tue,Thu,Sat',
              '14:00 - 18:00',
            ]
          );
        }
      }
    }

    await db.exec('COMMIT;');
  }
  console.log(`✅ Seeded ${doctorTarget} doctors with qualifications, specialties & multi-branch schedules.`);

  // Seed Realistic Appointment Slots for the upcoming 7 days
  console.log('⏰ Generating Real-Time Appointment Slots for doctors...');
  await db.exec('BEGIN TRANSACTION;');

  const slotTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const today = new Date();
  const createdSlots: { id: string; doctorId: string; branchId: string; date: string; time: string }[] = [];

  // Generate slots for the first 300 doctors across 7 days
  let slotCounter = 0;
  for (let d = 0; d < 7; d++) {
    const slotDateObj = new Date(today);
    slotDateObj.setDate(today.getDate() + d);
    const dateStr = slotDateObj.toISOString().split('T')[0];

    for (const doc of doctorList.slice(0, 250)) {
      // 4 to 8 slots per day per doctor
      const daySlots = slotTimes.slice(0, (doc.specId % 4) + 4);
      for (const timeStr of daySlots) {
        slotCounter++;
        const slotId = `slot-${slotCounter}`;
        const isBooked = (slotCounter % 5 === 0) ? 1 : 0; // 20% pre-booked

        await db.run(
          'INSERT INTO doctor_slots (id, doctor_id, branch_id, slot_date, slot_time, duration_minutes, is_booked, consultation_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [slotId, doc.id, doc.branchId, dateStr, timeStr, 30, isBooked, 'IN_PERSON']
        );

        createdSlots.push({ id: slotId, doctorId: doc.id, branchId: doc.branchId, date: dateStr, time: timeStr });
      }
    }
  }

  await db.exec('COMMIT;');
  console.log(`✅ Seeded ${slotCounter} real-time doctor appointment slots.`);

  // Seed 5,000+ Fictional Patient Records
  console.log(`🧑‍🤝‍🧑 Generating and Seeding ${patientTarget} Fictional Patients...`);
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  const patientFirstNames = [
    'Aarav', 'Vihaan', 'Aditya', 'Reyansh', 'Sai', 'Arjun', 'Kabir', 'Ananya', 'Diya', 'Isha',
    'Rohan', 'Tanvi', 'Kavya', 'Siddharth', 'Varun', 'Neha', 'Pooja', 'Deepak', 'Manish', 'Meera',
    'Vikas', 'Prakash', 'Sanjay', 'Sunil', 'Rajeev', 'Naveen', 'Swati', 'Preeti', 'Kiran', 'Anita'
  ];

  const createdPatientIds: string[] = ['pat-1'];

  for (let pStart = 1; pStart < patientTarget; pStart += BATCH_SIZE) {
    const pEnd = Math.min(pStart + BATCH_SIZE, patientTarget);
    await db.exec('BEGIN TRANSACTION;');

    for (let p = pStart; p < pEnd; p++) {
      const pId = `pat-${p + 1}`;
      const uId = `usr-pat-${p + 1}`;
      const fn = patientFirstNames[p % patientFirstNames.length];
      const ln = lastNames[(p * 5 + 3) % lastNames.length];
      const fullName = `${fn} ${ln}`;
      const cityId = (p % 20) + 1;
      const bg = bloodGroups[p % bloodGroups.length];
      const gender = genders[p % 2]; // mostly male/female
      const birthYear = 1955 + (p % 48); // age 23 to 71
      const dob = `${birthYear}-${String((p % 12) + 1).padStart(2, '0')}-${String((p % 28) + 1).padStart(2, '0')}`;

      // Insert User record
      await db.run(
        'INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uId, `patient_${p + 1}@example.com`, defaultPasswordHash, 'patient', fullName, `+91 ${9800000000 + p}`, 1]
      );

      // Insert Patient record
      await db.run(
        'INSERT INTO patients (id, user_id, date_of_birth, gender, blood_group, address, city_id, pincode, emergency_contact, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          pId,
          uId,
          dob,
          gender,
          bg,
          `House ${p * 3 + 12}, Block ${(p % 8) + 1}, Sector Road`,
          cityId,
          '400071',
          `+91 ${9700000000 + p}`,
          1,
        ]
      );

      createdPatientIds.push(pId);
    }

    await db.exec('COMMIT;');
  }
  console.log(`✅ Seeded ${patientTarget} fictional patient accounts.`);

  // Seed Appointments, EHR, Prescriptions, Status History
  console.log(`📋 Generating ${appointmentTarget} Realistic Appointments & EHR Medical Records...`);
  await db.exec('BEGIN TRANSACTION;');

  const reasons = [
    'Severe persistent headache and dizziness',
    'Routine annual cardiovascular checkup',
    'Follow up on blood pressure medications',
    'Chronic knee pain when climbing stairs',
    'Skin rash and allergic itching on arms',
    'Acid reflux, bloating and stomach discomfort',
    'Childhood vaccination and developmental milestone check',
    'Blurred vision and difficulty reading small print',
    'Persistent dry cough and throat irritation',
    'Diabetes management and HbA1c review',
  ];

  const statuses = ['CONFIRMED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED'];

  for (let a = 0; a < appointmentTarget; a++) {
    const aptId = `apt-${a + 1}`;
    const aptNum = `CNX-${today.getFullYear()}-${String(100000 + a)}`;
    const patientId = createdPatientIds[a % createdPatientIds.length];
    const doc = doctorList[a % Math.min(doctorList.length, 300)];
    const status = a < 200 ? 'CONFIRMED' : statuses[a % statuses.length];
    const reason = reasons[a % reasons.length];

    // Dates from -30 days ago to +7 days ahead
    const dayOffset = (a % 37) - 30;
    const aptDateObj = new Date(today);
    aptDateObj.setDate(today.getDate() + dayOffset);
    const dateStr = aptDateObj.toISOString().split('T')[0];
    const timeStr = slotTimes[a % slotTimes.length];

    await db.run(
      `INSERT INTO appointments (
        id, appointment_number, patient_id, doctor_id, branch_id, slot_id,
        appointment_date, appointment_time, consultation_type, status, reason, fee, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        aptId,
        aptNum,
        patientId,
        doc.id,
        doc.branchId,
        null,
        dateStr,
        timeStr,
        a % 4 === 0 ? 'ONLINE_VIDEO' : 'IN_PERSON',
        status,
        reason,
        doc.fee,
        'PAID',
      ]
    );

    // Appointment Status History
    await db.run(
      'INSERT INTO appointment_status_history (id, appointment_id, status, notes, changed_by) VALUES (?, ?, ?, ?, ?)',
      [`ash-${a + 1}`, aptId, status, `Appointment marked as ${status}`, 'System / Booking Engine']
    );

    // If completed or for default patient, create Digital Prescription & EHR record
    if (status === 'COMPLETED' || patientId === 'pat-1') {
      const rxId = `rx-${a + 1}`;
      await db.run(
        `INSERT INTO prescriptions (id, appointment_id, patient_id, doctor_id, diagnosis, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          rxId,
          aptId,
          patientId,
          doc.id,
          doc.specId === 1 ? 'Mild Essential Hypertension, Stage 1' : 'Acute Symptomatic Management',
          'Avoid excessive sodium intake. Maintain hydration and moderate walking for 30 minutes daily.',
          '2026-12-01',
        ]
      );

      // Prescription medicine items
      await db.run(
        'INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`rxi-${a + 1}-1`, rxId, 'Tab Telmisartan', '40 mg', 'Once daily (Morning)', '30 days', 'Take after breakfast']
      );
      await db.run(
        'INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`rxi-${a + 1}-2`, rxId, 'Tab Paracetamol', '650 mg', 'As needed (SOS)', '5 days', 'Take after food if fever or pain occurs']
      );

      // Medical Record (EHR)
      await db.run(
        `INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, record_type, title, description, file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `ehr-${a + 1}`,
          patientId,
          doc.id,
          aptId,
          'Clinical Consultation Summary',
          `Consultation with ${doc.name} – ${dateStr}`,
          `Patient presented with: ${reason}. Vitals recorded: BP 128/82 mmHg, Pulse 74 bpm, SpO2 99%. Prescribed medications and advised lifestyle monitoring.`,
          'https://carenex.demo/records/report_sample.pdf',
        ]
      );
    }
  }

  // Seed sample Notifications for default user
  const demoNotifications = [
    { title: 'Appointment Confirmed', msg: 'Your appointment with Dr. Priya Desai is confirmed for tomorrow at 10:00 AM.', type: 'APPOINTMENT' },
    { title: 'Digital Prescription Available', msg: 'Dr. Priya Desai has uploaded your digital prescription. You can view or download it anytime.', type: 'PRESCRIPTION' },
    { title: 'Diagnostic Report Ready', msg: 'Your Complete Blood Count (CBC) test report from Metropolis Healthcare is ready to download.', type: 'LAB_REPORT' },
    { title: 'Vaccination Reminder', msg: 'Childhood seasonal flu booster due this week for Aarav Sharma.', type: 'FAMILY' },
  ];

  for (let n = 0; n < demoNotifications.length; n++) {
    await db.run(
      'INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [`notif-${n + 1}`, 'usr-patient-1', demoNotifications[n].title, demoNotifications[n].msg, demoNotifications[n].type, 0]
    );
  }

  // Seed sample Reviews
  for (let r = 0; r < 20; r++) {
    const doc = doctorList[r % doctorList.length];
    await db.run(
      'INSERT INTO reviews (id, user_id, target_type, target_id, rating, comment, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        `rev-${r + 1}`,
        'usr-patient-1',
        'DOCTOR',
        doc.id,
        5,
        'Extremely attentive and thorough diagnosis. Explained the medication plan clearly and patiently.',
        1,
      ]
    );
  }

  await db.exec('COMMIT;');
  console.log(`✅ Seeded ${appointmentTarget} Appointments, Prescriptions, EHR files, and Notifications.`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 CARENEX DATABASE SEEDING COMPLETED IN ${elapsed}s!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Summary:');
  console.log(`   - 20 Major Indian Cities with GPS coordinates`);
  console.log(`   - 25 Medical Specializations`);
  console.log(`   - ${createdBranches.length} Verified Hospital Branches`);
  console.log(`   - ${labIdx} Diagnostic Centers with Test Catalogues`);
  console.log(`   - ${pharmIdx} Pharmacies`);
  console.log(`   - ${emergIdx} Emergency Trauma & Ambulance Centers`);
  console.log(`   - ${doctorTarget} Fictional Doctors (Multi-Branch, Real Schedules)`);
  console.log(`   - ${slotCounter} Live Appointment Slots`);
  console.log(`   - ${patientTarget} Patient Accounts & Family Profiles`);
  console.log(`   - ${appointmentTarget} Appointments & Digital Prescriptions`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Demo Login Accounts:');
  console.log('   👤 Patient:          patient@carenex.demo    / Password123!');
  console.log('   👨‍⚕️ Doctor:           doctor@carenex.demo     / Password123!');
  console.log('   🏥 Hospital Admin:   hospital@carenex.demo   / Password123!');
  console.log('   🧪 Diagnostic Admin: diagnostic@carenex.demo / Password123!');
  console.log('   👑 Super Admin:      admin@carenex.demo      / Password123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].includes('seed')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
