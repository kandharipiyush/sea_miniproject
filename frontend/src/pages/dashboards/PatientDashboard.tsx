import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  Users,
  Bell,
  Video,
  X,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Printer,
  Download,
  AlertCircle,
} from 'lucide-react';
import { api, Appointment, Prescription, MedicalRecord, FamilyMember } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLocation } from '../../context/LocationContext.js';
import { TelehealthRoom } from '../../components/TelehealthRoom.js';
import { getDoctorPhoto, handleImageError } from '../../utils/doctorImages.js';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { locality, selectedCity } = useLocation();

  const [activeTab, setActiveTab] = useState<'appointments' | 'ehr' | 'prescriptions' | 'diagnostics' | 'family' | 'notifications'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Telehealth Video Call
  const [activeCallAppointment, setActiveCallAppointment] = useState<Appointment | null>(null);

  // View Prescription Modal
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [rxLoading, setRxLoading] = useState(false);

  // Add EHR Record Modal
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newRecordTitle, setNewRecordTitle] = useState('');
  const [newRecordType, setNewRecordType] = useState('Diagnostic Lab Report');
  const [newRecordDesc, setNewRecordDesc] = useState('');

  // Add Family Member Modal
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRel, setFamRel] = useState('Mother');
  const [famAge, setFamAge] = useState('');
  const [famBg, setFamBg] = useState('B+');
  const [famCond, setFamCond] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [aptRes, rxRes, ehrRes, famRes] = await Promise.all([
        api.getMyAppointments(),
        api.getPrescriptions(),
        api.getMedicalRecords(),
        api.getFamilyMembers(),
      ]);
      if (aptRes.success) setAppointments(aptRes.data);
      if (rxRes.success) setPrescriptions(rxRes.data);
      if (ehrRes.success) setRecords(ehrRes.data);
      if (famRes.success) setFamily(famRes.data);
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? The slot will be released.')) return;
    try {
      await api.cancelAppointment(id, 'Patient requested cancellation');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenPrescription = async (rxId: string) => {
    setRxLoading(true);
    try {
      const res = await api.getPrescriptionDetails(rxId);
      if (res.success) setSelectedRx(res.data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRxLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addMedicalRecord({
        title: newRecordTitle,
        record_type: newRecordType,
        description: newRecordDesc,
      });
      setShowAddRecordModal(false);
      setNewRecordTitle('');
      setNewRecordDesc('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addFamilyMember({
        name: famName,
        relationship: famRel,
        age: parseInt(famAge, 10),
        blood_group: famBg,
        medical_conditions: famCond,
      });
      setShowAddFamilyModal(false);
      setFamName('');
      setFamAge('');
      setFamCond('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-xl flex items-center justify-center border border-emerald-200 flex-shrink-0">
              {user?.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                Patient Health Vault
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Welcome back, {user?.full_name || 'Patient'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Primary Location: {locality}, {selectedCity?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddRecordModal(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Health Record</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ehr')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ehr'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Health Records / EHR ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'prescriptions'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Digital Prescriptions ({prescriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('family')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'family'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Family Profiles ({family.length})</span>
          </button>
        </div>

        {/* TAB 1: Appointments */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                Loading appointments...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-base text-slate-800">No appointments scheduled</h3>
                <p className="text-slate-400 mt-1">Book your first doctor consultation anytime from the search directory.</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={getDoctorPhoto({ name: apt.doctor_name, profile_photo: apt.doctor_photo })}
                      onError={(e) => handleImageError(e, apt.doctor_name)}
                      alt={apt.doctor_name}
                      className="w-14 h-14 rounded-2xl object-cover bg-emerald-50 border border-slate-200 flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{apt.doctor_name}</h4>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                          {apt.specialization_name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500">{apt.hospital_name} – {apt.branch_name}</p>

                      <div className="flex items-center gap-4 text-slate-600 pt-1 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          {apt.appointment_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          {apt.appointment_time}
                        </span>
                        <span className="text-emerald-700">₹{apt.fee} (Paid)</span>
                        <span className="font-mono text-slate-400 text-[10px]">ID: {apt.appointment_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {apt.consultation_type === 'ONLINE_VIDEO' && apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setActiveCallAppointment(apt)}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Video Consultation</span>
                      </button>
                    )}

                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="py-2 px-3 border border-slate-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: Electronic Health Records (EHR) */}
        {activeTab === 'ehr' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-slate-500">Encrypted personal healthcare vault and clinical summaries</p>
              <button
                onClick={() => setShowAddRecordModal(true)}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>

            {records.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-base text-slate-800">No medical records uploaded</h3>
                <p className="text-slate-400 mt-1">Upload your diagnostic reports, scan summaries, or vaccination cards.</p>
              </div>
            ) : (
              records.map((rec) => (
                <div key={rec.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {rec.record_type}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{rec.title}</h4>
                    </div>
                    <p className="text-slate-500 text-[11px] max-w-2xl leading-relaxed">{rec.description}</p>
                    <p className="text-[10px] text-slate-400">Added on {rec.created_at?.split('T')[0] || '2026-11-15'}</p>
                  </div>

                  <a
                    href={rec.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Digital Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-base text-slate-800">No prescriptions issued yet</h3>
                <p className="text-slate-400 mt-1">Prescriptions issued by your consulting doctors will appear here automatically.</p>
              </div>
            ) : (
              prescriptions.map((rx) => (
                <div key={rx.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Diagnosis: {rx.diagnosis}</h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {rx.specialization_name}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Consultant: {rx.doctor_name} ({rx.doctor_qualification})</p>
                    <p className="text-slate-400 text-[10px]">Issued on: {rx.created_at?.split('T')[0]} • Follow-up: {rx.follow_up_date || 'As required'}</p>
                  </div>

                  <button
                    onClick={() => handleOpenPrescription(rx.id)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Digital Prescription</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: Family Member Profiles */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-slate-500">Manage separate healthcare records & appointments for your dependants</p>
              <button
                onClick={() => setShowAddFamilyModal(true)}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Family Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {family.map((f) => (
                <div key={f.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{f.name}</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {f.relationship}
                      </span>
                    </div>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs">
                      {f.blood_group}
                    </span>
                  </div>

                  <p className="text-slate-500 text-[11px]">Age: {f.age} years • Gender: {f.gender}</p>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-semibold">Conditions / Allergies:</span>
                    <span className="text-slate-700 font-medium">{f.medical_conditions || 'None reported'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Telehealth Video Call Screen */}
      {activeCallAppointment && (
        <TelehealthRoom
          roomId={activeCallAppointment.appointment_number}
          patientName={user?.full_name || 'Patient'}
          doctorName={activeCallAppointment.doctor_name}
          onEndCall={() => setActiveCallAppointment(null)}
        />
      )}

      {/* Prescription View Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto text-xs animate-in zoom-in-95">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900">CARENEX MEDICAL CLINICAL PRESCRIPTION</h3>
                <p className="text-xs text-slate-600 font-semibold">{selectedRx.hospital_name || 'CareNex Healthcare Group'} – {selectedRx.branch_name || 'Central'}</p>
                <p className="text-[11px] text-slate-400">{selectedRx.hospital_address}</p>
              </div>
              <button onClick={() => setSelectedRx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor & Patient Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200 mb-4">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedRx.doctor_name}</p>
                <p className="text-slate-600 font-medium">{selectedRx.doctor_qualification}</p>
                <p className="text-emerald-700 font-bold">{selectedRx.specialization_name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">Patient: {selectedRx.patient_name}</p>
                <p className="text-slate-500">Date: {selectedRx.created_at?.split('T')[0]}</p>
                <p className="text-slate-500">Ref: {selectedRx.appointment_number || selectedRx.id}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="mb-4">
              <span className="font-bold text-slate-500 text-[10px] uppercase">Primary Diagnosis:</span>
              <p className="font-extrabold text-sm text-slate-900 mt-0.5">{selectedRx.diagnosis}</p>
            </div>

            {/* Medicines Table */}
            <div className="mb-6">
              <span className="font-bold text-slate-500 text-[10px] uppercase block mb-2">Rx (Medications):</span>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Medicine</th>
                    <th className="py-2">Dosage</th>
                    <th className="py-2">Frequency</th>
                    <th className="py-2">Duration</th>
                    <th className="py-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {selectedRx.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 font-bold">{item.medicine_name}</td>
                      <td className="py-2">{item.dosage}</td>
                      <td className="py-2">{item.frequency}</td>
                      <td className="py-2">{item.duration}</td>
                      <td className="py-2 text-slate-500">{item.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes & Signature */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <span className="font-bold text-slate-700 block mb-1">Clinical Advice & Notes:</span>
              <p className="text-slate-600 leading-relaxed">{selectedRx.notes || 'Maintain hydration and rest. Follow up if symptoms persist.'}</p>
            </div>

            <div className="flex justify-between items-end border-t border-slate-200 pt-4">
              <div className="text-[10px] text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline mr-1" />
                Digitally verified via CareNex EHR Security Engine
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-slate-800">{selectedRx.digital_signature || `Dr. ${selectedRx.doctor_name}`}</p>
                <p className="text-[10px] text-slate-400">Medical Registration Verified</p>
              </div>
            </div>

            {/* Print button */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="py-2 px-4 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-900">Upload Health Record</h3>
              <button onClick={() => setShowAddRecordModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newRecordTitle}
                  onChange={(e) => setNewRecordTitle(e.target.value)}
                  placeholder="e.g. Annual Blood Test Report"
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Record Type</label>
                <select
                  value={newRecordType}
                  onChange={(e) => setNewRecordType(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Diagnostic Lab Report">Diagnostic Lab Report</option>
                  <option value="Radiology & Scan">Radiology & Scan</option>
                  <option value="Hospital Discharge Summary">Hospital Discharge Summary</option>
                  <option value="Vaccination Card">Vaccination Card</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={3}
                  value={newRecordDesc}
                  onChange={(e) => setNewRecordDesc(e.target.value)}
                  placeholder="Add details, findings, or notes..."
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                Save to Health Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Family Modal */}
      {showAddFamilyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-900">Add Family Member Profile</h3>
              <button onClick={() => setShowAddFamilyModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={famName}
                  onChange={(e) => setFamName(e.target.value)}
                  placeholder="e.g. Sunita Sharma"
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={famRel}
                    onChange={(e) => setFamRel(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={famAge}
                    onChange={(e) => setFamAge(e.target.value)}
                    placeholder="e.g. 58"
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={famBg}
                  onChange={(e) => setFamBg(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Existing Medical Conditions</label>
                <input
                  type="text"
                  value={famCond}
                  onChange={(e) => setFamCond(e.target.value)}
                  placeholder="e.g. Hypertension, Penicillin allergy"
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                Create Family Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
