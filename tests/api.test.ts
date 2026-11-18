import http from 'http';
import { createApp } from '../backend/src/app.js';
import { initDatabaseSchema } from '../backend/src/database/index.js';

let server: http.Server;
const TEST_PORT = 5099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting CareNex Automated Acceptance Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    await initDatabaseSchema();
    const app = createApp();
    server = app.listen(TEST_PORT, '127.0.0.1');
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test 1: Health Check
    console.log('▶ Test 1: System Health Check');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Health check returns 200 healthy');

    // Test 2: Cities and Location Intelligence
    console.log('\n▶ Test 2: Multi-City Coverage & GPS Reverse Geocoding');
    const cities = await request('/api/locations/cities');
    assert(cities.status === 200 && cities.data.data.length >= 20, `Loaded ${cities.data.data?.length} cities across India`);

    const detect = await request('/api/locations/detect?lat=19.2403&lon=73.1305');
    assert(detect.status === 200 && detect.data.data.detectedCity.name === 'Kalyan', 'GPS detection accurately resolves Kalyan coordinates (19.24, 73.13)');

    // Test 3: Specializations
    console.log('\n▶ Test 3: Medical Specializations');
    const specs = await request('/api/specializations');
    assert(specs.status === 200 && specs.data.data.length >= 25, `Loaded ${specs.data.data?.length} medical specializations`);

    // Test 4: Hospital Discovery & Proximity
    console.log('\n▶ Test 4: Hospital Discovery with Haversine Proximity');
    const hospitals = await request('/api/hospitals?city_id=1&lat=19.0760&lon=72.8777&radius_km=25');
    assert(hospitals.status === 200 && hospitals.data.data.length > 0, `Discovered ${hospitals.data.data?.length} nearby hospitals in Mumbai within 25km`);
    assert(hospitals.data.data[0].distance_km !== undefined, `Calculated straight-line distance (${hospitals.data.data[0].distance_km} km)`);

    // Test 5: Hospital Comparison
    console.log('\n▶ Test 5: Hospital Comparison Feature');
    const hospA = hospitals.data.data[0]?.id;
    const hospB = hospitals.data.data[1]?.id;
    const compare = await request(`/api/hospitals/compare?branch_ids=${hospA},${hospB}&lat=19.0760&lon=72.8777`);
    assert(compare.status === 200 && compare.data.data.length === 2, 'Side-by-side hospital comparison returns valid department and distance matrices');

    // Test 6: Doctor Search by Specialization
    console.log('\n▶ Test 6: Doctor Discovery Engine');
    const docs = await request('/api/doctors?specialization_slug=cardiologist&city_id=1');
    assert(docs.status === 200 && docs.data.data.length > 0, `Found ${docs.data.data?.length} Cardiologists practicing in Mumbai`);

    // Test 7: Authentication & Role Quick-Switch
    console.log('\n▶ Test 7: Authentication & Role Switching');
    const patientLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'patient@carenex.demo', password: 'Password123!' }),
    });
    assert(patientLogin.status === 200 && patientLogin.data.user.role === 'patient', 'Patient login successful with JWT');
    const patientToken = patientLogin.data.token;

    const doctorSwitch = await request('/api/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ targetRole: 'doctor' }),
    });
    assert(doctorSwitch.status === 200 && doctorSwitch.data.user.role === 'doctor', 'Quick switch to Doctor portal account works');

    // Test 8: Appointment Booking & Double-Booking Prevention
    console.log('\n▶ Test 8: Appointment Booking Engine & Double-Booking Guard');
    const testDoc = docs.data.data[0];
    const testDate = '2026-11-25';
    const testTime = '11:00';

    const book1 = await request('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        doctor_id: testDoc.id,
        branch_id: testDoc.branch_id,
        appointment_date: testDate,
        appointment_time: testTime,
        consultation_type: 'IN_PERSON',
        reason: 'Automated test appointment',
      }),
    });
    assert(book1.status === 201 && book1.data.data.appointment_number, `Appointment booked successfully: ${book1.data.data?.appointment_number}`);

    // Attempt second booking for SAME slot/doctor/time
    const book2 = await request('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({
        doctor_id: testDoc.id,
        branch_id: testDoc.branch_id,
        appointment_date: testDate,
        appointment_time: testTime,
        consultation_type: 'IN_PERSON',
        reason: 'Attempt duplicate booking',
      }),
    });
    assert(book2.status === 409, 'Double-booking correctly rejected with HTTP 409 Conflict!');

    // Test 9: EHR & Prescriptions
    console.log('\n▶ Test 9: Centralized EHR & Digital Prescriptions');
    const ehr = await request('/api/medical-records', {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(ehr.status === 200 && ehr.data.data.length > 0, `Patient has ${ehr.data.data.length} electronic health records in vault`);

    // Test 10: Emergency Discovery
    console.log('\n▶ Test 10: Emergency Facility & Ambulance Discovery');
    const emergency = await request('/api/emergency?city_id=1&lat=19.0760&lon=72.8777');
    assert(emergency.status === 200 && emergency.data.data.length > 0, `Located ${emergency.data.data.length} 24x7 Emergency Trauma & Ambulance centers`);

    // Test 11: Super Admin Analytics
    console.log('\n▶ Test 11: Super Admin Analytics');
    const adminSwitch = await request('/api/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ targetRole: 'super_admin' }),
    });
    const adminToken = adminSwitch.data.token;
    const analytics = await request('/api/admin/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      analytics.status === 200 &&
      analytics.data.data.totals.doctors >= 1000 &&
      analytics.data.data.totals.patients >= 5000,
      `Super Admin Analytics verified: ${analytics.data.data.totals.doctors} Doctors, ${analytics.data.data.totals.patients} Patients`
    );

    console.log(`\n=============================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=============================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
