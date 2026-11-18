// CareNex API Client

const API_BASE = '/api';

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'hospital_admin' | 'diagnostic_admin' | 'super_admin';
  full_name: string;
  phone?: string;
  avatar_url?: string;
  patient_id?: string;
  doctor_id?: string;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
  state_name: string;
  state_code: string;
  latitude: number;
  longitude: number;
  branch_count: number;
  doctor_count: number;
}

export interface Specialization {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  doctor_count: number;
}

export interface HospitalBranch {
  id: string;
  hospital_id: string;
  hospital_name: string;
  hospital_type: string;
  hospital_rating: number;
  hospital_reviews: number;
  logo_url?: string;
  branch_name: string;
  address: string;
  city_id: number;
  city_name: string;
  locality: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergency_service: number;
  operating_hours: string;
  facilities: string;
  verification_status: string;
  distance_km: number;
  doctor_count: number;
  departments: string[];
}

export interface Doctor {
  id: string;
  doctor_id?: string;
  name: string;
  specialization_id: number;
  specialization_name: string;
  specialization_slug: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  rating: number;
  review_count: number;
  bio: string;
  languages: string;
  verification_status: string;
  profile_photo: string;
  branch_id: string;
  branch_name: string;
  branch_address: string;
  branch_locality: string;
  city_name: string;
  hospital_name: string;
  schedule_days: string;
  schedule_hours: string;
  distance_km?: number;
}

export interface DoctorSlot {
  id: string;
  doctor_id: string;
  branch_id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  is_booked: number;
  consultation_type: string;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_qualification: string;
  doctor_photo: string;
  specialization_name: string;
  branch_id: string;
  branch_name: string;
  branch_address: string;
  branch_locality: string;
  branch_phone: string;
  hospital_name: string;
  city_name: string;
  patient_name: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  status: 'PENDING' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  reason: string;
  fee: number;
  payment_status: string;
}

export interface Prescription {
  id: string;
  appointment_id?: string;
  appointment_number?: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  doctor_qualification: string;
  specialization_name: string;
  diagnosis: string;
  notes: string;
  follow_up_date?: string;
  created_at: string;
  hospital_name?: string;
  branch_name?: string;
  hospital_address?: string;
  digital_signature?: string;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
  doctor_name?: string;
  doctor_specialization?: string;
}

export interface DiagnosticCentre {
  id: string;
  name: string;
  address: string;
  city_id: number;
  city_name: string;
  locality: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  operating_hours: string;
  home_sample_collection: number;
  distance_km: number;
  test_count: number;
}

export interface DiagnosticTest {
  id: string;
  centre_id: string;
  centre_name: string;
  locality: string;
  city_name: string;
  test_name: string;
  category: string;
  price: number;
  turnaround_hours: number;
  sample_type: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city_id: number;
  city_name: string;
  locality: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  operating_hours: string;
  is_24x7: number;
  distance_km: number;
}

export interface EmergencyFacility {
  id: string;
  facility_name: string;
  facility_type: string;
  address: string;
  city_id: number;
  city_name: string;
  latitude: number;
  longitude: number;
  emergency_phone: string;
  ambulance_available: number;
  blood_bank_available: number;
  icu_beds: number;
  is_24x7: number;
  distance_km: number;
}

export interface FamilyMember {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  blood_group: string;
  medical_conditions: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('carenex_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('carenex_token', token);
    } else {
      localStorage.removeItem('carenex_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async quickSwitch(targetRole: string) {
    const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    });
    this.setToken(res.token);
    return res;
  }

  async register(data: any) {
    const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async getMe() {
    return this.request<{ success: boolean; user: User & { patient?: any; doctor?: any; family?: FamilyMember[] } }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Locations & GPS
  async getCities() {
    return this.request<{ success: boolean; count: number; data: City[] }>('/locations/cities');
  }

  async detectLocation(lat: number, lon: number) {
    return this.request<{
      success: boolean;
      data: {
        detectedCity: City;
        distance_km: number;
        suggestedLocality: string;
        pincode: string;
        coordinates: { lat: number; lon: number };
      };
    }>(`/locations/detect?lat=${lat}&lon=${lon}`);
  }

  // Specializations
  async getSpecializations() {
    return this.request<{ success: boolean; count: number; data: Specialization[] }>('/specializations');
  }

  // Hospitals & Branches
  async getHospitals(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      data: HospitalBranch[];
    }>(`/hospitals?${query}`);
  }

  async getBranchDetails(branchId: string) {
    return this.request<{
      success: boolean;
      data: HospitalBranch & {
        doctors: Doctor[];
        hospital_desc: string;
      };
    }>(`/hospitals/branches/${branchId}`);
  }

  async compareHospitals(branchIds: string[], lat?: number, lon?: number) {
    let q = `branch_ids=${branchIds.join(',')}`;
    if (lat && lon) q += `&lat=${lat}&lon=${lon}`;
    return this.request<{ success: boolean; count: number; data: any[] }>(`/hospitals/compare?${q}`);
  }

  async createBranch(data: any) {
    return this.request<{ success: boolean; branchId: string; message: string }>('/hospitals/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Doctors
  async getDoctors(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      data: Doctor[];
    }>(`/doctors?${query}`);
  }

  async getDoctorDetails(doctorId: string) {
    return this.request<{
      success: boolean;
      data: Doctor & {
        branches: any[];
        reviews: any[];
      };
    }>(`/doctors/${doctorId}`);
  }

  async getDoctorSlots(doctorId: string, date?: string, branchId?: string) {
    let q = '';
    if (date) q += `date=${date}&`;
    if (branchId) q += `branch_id=${branchId}`;
    return this.request<{ success: boolean; count: number; data: DoctorSlot[] }>(`/doctors/${doctorId}/slots?${q}`);
  }

  async addDoctorSlots(doctorId: string, data: any) {
    return this.request<{ success: boolean; message: string }>(`/doctors/${doctorId}/slots`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Appointments
  async bookAppointment(data: {
    doctor_id: string;
    branch_id: string;
    slot_id?: string;
    appointment_date: string;
    appointment_time: string;
    consultation_type?: string;
    reason?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        appointment_id: string;
        appointment_number: string;
        doctor_name: string;
        date: string;
        time: string;
        fee: number;
        status: string;
      };
    }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyAppointments(filter?: 'UPCOMING' | 'PAST' | 'ALL') {
    const q = filter ? `?filter=${filter}` : '';
    return this.request<{ success: boolean; count: number; data: Appointment[] }>(`/appointments/my${q}`);
  }

  async getAppointmentDetails(id: string) {
    return this.request<{ success: boolean; data: Appointment & { history: any[]; prescription: any } }>(`/appointments/${id}`);
  }

  async cancelAppointment(id: string, reason?: string) {
    return this.request<{ success: boolean; message: string }>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async completeAppointment(id: string) {
    return this.request<{ success: boolean; message: string }>(`/appointments/${id}/complete`, {
      method: 'PATCH',
    });
  }

  // EHR & Prescriptions
  async getMedicalRecords(patientId?: string) {
    const q = patientId ? `?patient_id=${patientId}` : '';
    return this.request<{ success: boolean; count: number; data: MedicalRecord[] }>(`/medical-records${q}`);
  }

  async addMedicalRecord(data: any) {
    return this.request<{ success: boolean; recordId: string; message: string }>('/medical-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPrescriptions() {
    return this.request<{ success: boolean; count: number; data: Prescription[] }>('/prescriptions/prescriptions');
  }

  async getPrescriptionDetails(id: string) {
    return this.request<{ success: boolean; data: Prescription & { digital_signature: string; hospital_name: string; hospital_address: string; branch_name: string } }>(`/prescriptions/prescriptions/${id}`);
  }

  async createPrescription(data: {
    appointment_id?: string;
    patient_id: string;
    diagnosis: string;
    notes?: string;
    follow_up_date?: string;
    items: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  }) {
    return this.request<{ success: boolean; prescriptionId: string; message: string }>('/prescriptions/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFamilyMembers() {
    return this.request<{ success: boolean; count: number; data: FamilyMember[] }>('/medical-records/family');
  }

  async addFamilyMember(data: any) {
    return this.request<{ success: boolean; id: string; message: string }>('/medical-records/family', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Diagnostics
  async getDiagnosticCentres(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; count: number; data: DiagnosticCentre[] }>(`/diagnostics/centres?${query}`);
  }

  async getDiagnosticTests(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; count: number; data: DiagnosticTest[] }>(`/diagnostics/tests?${query}`);
  }

  async bookDiagnosticTest(data: any) {
    return this.request<{ success: boolean; bookingId: string; message: string }>('/diagnostics/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyDiagnosticBookings() {
    return this.request<{ success: boolean; count: number; data: any[] }>('/diagnostics/my-bookings');
  }

  // Pharmacies
  async getPharmacies(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; count: number; data: Pharmacy[] }>(`/pharmacies?${query}`);
  }

  // Emergency
  async getEmergencyFacilities(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{
      success: boolean;
      count: number;
      data: EmergencyFacility[];
      helplines: Array<{ name: string; number: string; available: string }>;
    }>(`/emergency?${query}`);
  }

  // Admin
  async getAdminAnalytics() {
    return this.request<{ success: boolean; data: any }>('/admin/analytics');
  }

  async getAdminDoctors(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; total: number; data: any[] }>(`/admin/doctors?${query}`);
  }

  async verifyDoctor(id: string, status: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/doctors/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getAdminHospitals() {
    return this.request<{ success: boolean; count: number; data: any[] }>('/admin/hospitals');
  }

  async addCity(data: { name: string; state_id: number; latitude: number; longitude: number }) {
    return this.request<{ success: boolean; city_id: number; message: string }>('/admin/cities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdminUsers(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; total: number; data: any[] }>(`/admin/users?${query}`);
  }
}

export const api = new ApiService();
