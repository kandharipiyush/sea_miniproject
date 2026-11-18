# CareNex – Smart Healthcare Appointment & Patient Management System

CareNex is a production-grade, multi-city healthcare discovery, appointment booking, and patient management platform designed to connect patients, doctors, multi-branch hospitals, diagnostic pathology centres, and pharmacies into one unified digital healthcare ecosystem.

---

## 🌟 Key Capabilities

1. **Multi-City Healthcare Discovery Engine**
   - Active coverage across **20+ Indian Cities**: Mumbai, Kalyan, Dombivli, Thane, Navi Mumbai, Pune, Delhi NCR, Bengaluru, Hyderabad, Chennai, Ahmedabad, Kolkata, Jaipur, Lucknow, Indore, Nagpur, Surat, Bhopal, Chandigarh, and Kochi.
   - GPS-based proximity calculation (Haversine formula in development, PostGIS in production) with configurable radius filters (2 km, 5 km, 10 km, 25 km, 50 km).
   - Real-time reverse geocoding from device coordinates to closest city, locality, and PIN code.
   - Capability to dynamically add new cities via the Super Admin portal without code changes or database restructuring.

2. **Interactive Healthcare Map Integration (Leaflet + OpenStreetMap)**
   - Color-coded interactive pins:
     - 🏥 **Hospitals & Clinics** (Blue)
     - 🚨 **24x7 Emergency Trauma Centers** (Red pulse)
     - 🧪 **Diagnostic Pathology Labs** (Purple)
     - 💊 **Verified Pharmacies** (Emerald Green)
     - 📍 **Patient Location Radar** (Cyan ring)
   - Clickable map markers displaying: hospital name, verified distance in km, operating hours, emergency status, key departments, and available specialists.
   - **"View Doctors at this Hospital"**: Opens an embedded side drawer allowing direct consultation slot booking right from the map without navigating away.
   - **"Get Directions"**: Instant 1-click turn-by-turn navigation via mapping providers.

3. **5 Dedicated Role-Based Portals**
   - 👤 **Patient Portal**: Doctor search by specialization, hospital comparison (up to 3 side-by-side), slot booking, EHR vault, digital prescriptions, family dependants management, notifications.
   - 👨‍⚕️ **Doctor Portal**: Patient queue, real-time Telehealth consultation room, electronic prescription pad (medication, dosage, frequency, instructions, digital sign), multi-branch schedule & slot manager.
   - 🏥 **Hospital Admin Portal**: Multi-branch management, branch registration with GPS coordinates, doctor assignment, department management.
   - 🧪 **Diagnostic Centre Portal**: Pathology test catalogue (CBC, Lipid, Thyroid, MRI, CT Scan), sample collection requests, test booking management.
   - 👑 **Super Admin Portal**: Complete platform analytics (total patients, doctors, branches, appointments, revenue), doctor verification approval queue, city management, user accounts.

4. **Guaranteed Double-Booking Prevention & Atomic Transactions**
   - Slot availability checked and locked within database transactions (`BEGIN TRANSACTION` / `COMMIT`).
   - Hard constraints prevent multiple patients from reserving the same doctor slot.

5. **Integrated WebRTC Telehealth Video Consultations**
   - Real-time audio/video signaling mounted at `/ws/telehealth`.
   - Microphone/camera toggles, waiting room status, in-call clinical notes drawer.

6. **Large-Scale Realistic Seed Dataset**
   - **1,200+ Fictional Doctors** (configurable up to 5,000) with realistic Indian names, medical degrees, specializations, ratings, and multi-branch affiliations.
   - **5,000+ Fictional Patients** with blood groups, addresses, and family profiles.
   - **200+ Verified Hospital Branches** across 20 cities.
   - **9,500+ Live Appointment Slots** across the next 7 days.
   - **2,500+ Appointments, EHR Records, and Digital Prescriptions**.
   - Clear labelling of demo data (`DEMO_DATA` / `is_demo: 1`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide React, Leaflet, React-Leaflet, Recharts |
| **Backend** | Node.js, Express.js, TypeScript, WebRTC WebSocket Signaling (`ws`), JWT, Bcrypt |
| **Database** | SQLite with WAL mode & Haversine spatial functions (Local Dev/Testing); PostgreSQL + PostGIS schema included for Production |
| **Security** | Role-Based Access Control (RBAC), JWT Bearer authentication, encrypted password hashing, DPDP Act & HIPAA data segregation compliance |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v20 and v24)
- **npm**: v9+

### 2. Installation
Clone the repository and install dependencies:

```bash
# Clone or navigate to the repository
cd CareNex

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### 3. Database Seeding
Seed the database with realistic demo records:

```bash
# Standard seed (1,200 doctors, 5,000 patients, 200+ hospital branches):
npm run db:seed

# Or quick small seed (for rapid testing):
npm run db:seed:small

# Or full maximum scale (3,000 doctors, 8,000 patients):
npm run db:seed:full
```

### 4. Run Automated Acceptance Tests
Verify all 11 test suites (Health check, multi-city detection, doctor search, double-booking prevention, EHR, emergency discovery, and analytics):

```bash
npm test
```

### 5. Start Development Servers
Run the backend and frontend simultaneously:

```bash
# In Terminal 1 (Backend - Port 5000):
npm run dev:backend

# In Terminal 2 (Frontend - Port 5173):
npm run dev:frontend
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Pre-Configured Demo Accounts (1-Click Switcher Available in UI)

The top navigation bar features a **"Portal Quick Switch"** pill that lets you switch between all 5 roles instantly with 1 click:

| Role | Email | Password |
| :--- | :--- | :--- |
| 👤 **Patient** | `patient@carenex.demo` | `Password123!` |
| 👨‍⚕️ **Doctor** | `doctor@carenex.demo` | `Password123!` |
| 🏥 **Hospital Admin** | `hospital@carenex.demo` | `Password123!` |
| 🧪 **Diagnostic Admin** | `diagnostic@carenex.demo` | `Password123!` |
| 👑 **Super Admin** | `admin@carenex.demo` | `Password123!` |

---

## 🗺️ Project Structure

```text
CareNex/
├── frontend/                     # React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/           # Navbar, Footer, InteractiveMap, BookingModal, CompareModal, Telehealth
│   │   ├── context/              # AuthContext, LocationContext
│   │   ├── pages/                # HomePage, DoctorSearch, HospitalSearch, Map, Emergency, Diagnostics, Pharmacies
│   │   │   └── dashboards/       # PatientDashboard, DoctorDashboard, HospitalAdmin, DiagnosticAdmin, SuperAdmin
│   │   ├── services/             # Api client with TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
│
├── backend/                      # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── database/             # SQLite / spatial DB connection & seed script
│   │   ├── middleware/           # Auth & Role verification (RBAC)
│   │   ├── modules/              # Auth, Locations, Hospitals, Doctors, Appointments, EHR, Diagnostics, Pharmacies, Emergency, Admin
│   │   │   └── telehealth/       # WebRTC signaling server
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Server entry point
│   └── package.json
│
├── database/
│   └── schema_postgres_postgis.sql  # Production PostgreSQL + PostGIS schema
├── docs/                         # Architecture, ER diagrams, and API guides
├── tests/
│   └── api.test.ts               # End-to-end automated API & business logic test suite
├── package.json                  # Root monorepo workspace scripts
└── README.md
```

---

## 📡 REST API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Public | Health status & version check |
| `/api/auth/login` | POST | Public | User authentication with JWT token |
| `/api/auth/quick-switch` | POST | Public | Instant 1-click role switcher for demo testing |
| `/api/locations/cities` | GET | Public | List all 20+ active Indian cities with coordinates |
| `/api/locations/detect` | GET | Public | Reverse geocode coordinates to closest city/locality |
| `/api/specializations` | GET | Public | List all 25 medical specializations with doctor count |
| `/api/hospitals` | GET | Public | Search hospitals with Haversine distance & filters |
| `/api/hospitals/compare` | GET | Public | Compare up to 3 hospitals side-by-side |
| `/api/hospitals/branches/:id` | GET | Public | Branch details with affiliated doctors & departments |
| `/api/doctors` | GET | Public | Search doctors by query, specialization, city, fee, rating |
| `/api/doctors/:id/slots` | GET | Public | Get real-time available appointment slots |
| `/api/appointments` | POST | Patient | Book appointment with double-booking prevention |
| `/api/appointments/my` | GET | Authenticated | Retrieve patient or doctor appointment queue |
| `/api/appointments/:id/cancel`| PATCH | Authenticated | Cancel appointment & release slot |
| `/api/medical-records` | GET/POST | Patient | Patient EHR vault (history, scans, lab reports) |
| `/api/prescriptions` | GET | Authenticated | List digital prescriptions |
| `/api/prescriptions/prescriptions` | POST | Doctor | Issue and digitally sign prescription |
| `/api/emergency` | GET | Public | Nearby 24x7 trauma centers, ICU beds, blood banks, hotlines |
| `/api/diagnostics/tests` | GET | Public | Lab test catalogue with pricing and turnaround |
| `/api/diagnostics/bookings` | POST | Patient | Book diagnostic test (Lab visit or Home collection) |
| `/api/pharmacies` | GET | Public | Search 24x7 pharmacies & verified chemists |
| `/api/admin/analytics` | GET | Admin | Platform-wide analytics, revenue, and charts |
| `/api/admin/doctors/:id/verify` | PATCH | Super Admin | Approve or reject doctor verification |
| `/api/admin/cities` | POST | Super Admin | Dynamically register new city coverage |

---

## 🔒 Security & Privacy Compliance

- **Indian Digital Personal Data Protection (DPDP) Act Compliance**: Medical records are isolated by user ID; access requires explicit patient or treating doctor authorization.
- **Strict Separation of Data Sources**: Verified open data (OpenStreetMap) is strictly tagged and separated from fictional development records (`is_demo: 1`).
- **No Double-Booking Guarantee**: Atomic transactions lock slots during reservation to prevent concurrency conflicts.
- **Data Retention & Audit Trail**: Sensitive medical operations log to `audit_logs` table.

---

## 📄 License
CareNex Healthcare Project. All demo records are synthetic and created strictly for academic and demonstration purposes.
