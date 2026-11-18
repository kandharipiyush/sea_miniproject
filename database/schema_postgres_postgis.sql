-- CareNex - Production PostgreSQL + PostGIS Schema
-- Enables spatial indexes and geographic calculations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. States and Cities
CREATE TABLE states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT REFERENCES states(id),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users and Roles
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'hospital_admin', 'diagnostic_admin', 'super_admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Specializations
CREATE TABLE specializations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50)
);

-- 4. Hospitals & Branches
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255),
    type VARCHAR(100) DEFAULT 'Multispeciality Hospital',
    rating NUMERIC(3, 2) DEFAULT 4.5,
    review_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT TRUE,
    is_demo BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE hospital_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city_id INT REFERENCES cities(id),
    locality VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    phone VARCHAR(50),
    emergency_service BOOLEAN DEFAULT TRUE,
    operating_hours VARCHAR(100) DEFAULT '24x7',
    facilities TEXT, -- Comma-separated or JSON
    verification_status VARCHAR(50) DEFAULT 'VERIFIED',
    data_source VARCHAR(100) DEFAULT 'OpenStreetMap/Directory',
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hospital_branches_location ON hospital_branches USING GIST(location);

-- 5. Doctors & Doctor Branches
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    specialization_id INT REFERENCES specializations(id),
    qualification VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    consultation_fee NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    review_count INT DEFAULT 0,
    bio TEXT,
    languages VARCHAR(255) DEFAULT 'English, Hindi',
    is_verified BOOLEAN DEFAULT TRUE,
    is_demo BOOLEAN DEFAULT TRUE,
    verification_status VARCHAR(50) DEFAULT 'DEMO_DATA',
    profile_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE doctor_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE CASCADE,
    consultation_fee NUMERIC(10, 2),
    schedule_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    schedule_hours VARCHAR(100) DEFAULT '09:00 - 17:00',
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(doctor_id, branch_id)
);

CREATE TABLE doctor_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(10) NOT NULL,
    duration_minutes INT DEFAULT 30,
    is_booked BOOLEAN DEFAULT FALSE,
    consultation_type VARCHAR(20) DEFAULT 'IN_PERSON',
    UNIQUE(doctor_id, branch_id, slot_date, slot_time)
);

-- 6. Patients & Family
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    city_id INT REFERENCES cities(id),
    pincode VARCHAR(20),
    emergency_contact VARCHAR(50),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    age INT,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    medical_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Appointments & Booking
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES doctor_slots(id),
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    consultation_type VARCHAR(20) DEFAULT 'IN_PERSON',
    status appointment_status DEFAULT 'CONFIRMED',
    reason TEXT,
    fee NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PAID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Electronic Health Records & Prescriptions
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    record_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    diagnosis TEXT NOT NULL,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT
);

-- 9. Diagnostics & Pharmacies & Emergency
CREATE TABLE diagnostic_centres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city_id INT REFERENCES cities(id),
    locality VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    phone VARCHAR(50),
    operating_hours VARCHAR(100) DEFAULT '07:00 - 21:00',
    home_sample_collection BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    is_demo BOOLEAN DEFAULT FALSE
);

CREATE TABLE diagnostic_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centre_id UUID REFERENCES diagnostic_centres(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    turnaround_hours INT DEFAULT 24,
    sample_type VARCHAR(100) DEFAULT 'Blood'
);

CREATE TABLE diagnostic_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    centre_id UUID REFERENCES diagnostic_centres(id) ON DELETE CASCADE,
    test_id UUID REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(10) NOT NULL,
    sample_collection_type VARCHAR(20) DEFAULT 'LAB_VISIT',
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    payment_status VARCHAR(20) DEFAULT 'PAID',
    report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city_id INT REFERENCES cities(id),
    locality VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    phone VARCHAR(50),
    operating_hours VARCHAR(100) DEFAULT '24x7',
    is_24x7 BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    is_demo BOOLEAN DEFAULT FALSE
);

CREATE TABLE emergency_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100) DEFAULT 'Emergency Trauma Center',
    address TEXT NOT NULL,
    city_id INT REFERENCES cities(id),
    pincode VARCHAR(20),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    emergency_phone VARCHAR(50) NOT NULL,
    ambulance_available BOOLEAN DEFAULT TRUE,
    blood_bank_available BOOLEAN DEFAULT TRUE,
    icu_beds INT DEFAULT 20,
    is_24x7 BOOLEAN DEFAULT TRUE,
    is_demo BOOLEAN DEFAULT FALSE
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'HOSPITAL' or 'DOCTOR'
    target_id UUID NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
