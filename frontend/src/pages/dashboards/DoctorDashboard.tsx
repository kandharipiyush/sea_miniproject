import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Sparkles,
} from 'lucide-react';
import { api, Appointment } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { TelehealthRoom } from '../../components/TelehealthRoom.js';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Video Call
  const [activeCallApt, setActiveCallApt] = useState<Appointment | null>(null);

  // Digital Prescription Creation Modal
  const [selectedAptForRx, setSelectedAptForRx] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([
    { medicine_name: 'Tab Paracetamol', dosage: '650 mg', frequency: 'Twice daily after food', duration: '5 days', instructions: 'SOS if fever exceeds 100 F' },
    { medicine_name: 'Tab Cetirizine', dosage: '10 mg', frequency: 'Once daily at bedtime', duration: '7 days', instructions: 'Take with warm water' },
  ]);
  const [submittingRx, setSubmittingRx] = useState(false);

  // Slot Management Modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTimes, setSlotTimes] = useState<string[]>(['09:00', '09:30', '10:00', '10:30', '11:00']);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.getMyAppointments();
      if (res.success) setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCompleteApt = async (aptId: string) => {
    try {
      await api.completeAppointment(aptId);
      loadAppointments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { medicine_name: '', dosage: '', frequency: 'Once daily', duration: '5 days', instructions: '' }]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptForRx) return;
    setSubmittingRx(true);

    try {
      await api.createPrescription({
        appointment_id: selectedAptForRx.id,
        patient_id: selectedAptForRx.patient_id,
        diagnosis,
        notes: clinicalNotes,
        follow_up_date: followUpDate || undefined,
        items: medicines.filter((m) => m.medicine_name.trim() !== ''),
      });

      alert('Digital prescription issued and encrypted in patient health vault!');
      setSelectedAptForRx(null);
      setDiagnosis('');
      setClinicalNotes('');
      loadAppointments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingRx(false);
    }
  };

  const handleAddSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = user?.doctor_id || 'doc-1';
      const branchId = appointments[0]?.branch_id || 'br-1-1';
      await api.addDoctorSlots(docId, {
        branch_id: branchId,
        slot_date: slotDate,
        slot_times: slotTimes,
      });
      alert(`Created slots for ${slotDate}!`);
      setShowSlotModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Doctor Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-2xl flex items-center justify-center border border-emerald-200 flex-shrink-0">
              👨‍⚕️
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                Doctor Consultation Console
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                {user?.full_name || 'Dr. Priya Desai (MD)'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                CareNex Verified Practitioner • Multi-Branch Schedule Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSlotModal(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Manage Availability Slots</span>
            </button>
          </div>
        </div>

        {/* Patient Appointments Queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Today's Patient Consultations ({appointments.length})
              </h2>
              <p className="text-xs text-slate-500">Live queue across affiliated branches</p>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading doctor schedule...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-base text-slate-800">No appointments scheduled today</h3>
              <p className="text-slate-400 mt-1">New patient bookings will appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Patient: {apt.patient_name}
                      </h4>
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
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {apt.consultation_type === 'ONLINE_VIDEO' ? '🎥 Video' : '🏥 In-Person'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      Reason: <span className="font-semibold">{apt.reason || 'Routine consultation'}</span>
                    </p>

                    <div className="flex items-center gap-4 text-slate-500 pt-1 text-[11px]">
                      <span className="font-semibold text-slate-700">{apt.branch_name}</span>
                      <span>•</span>
                      <span>{apt.appointment_date} at {apt.appointment_time}</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700">Fee: ₹{apt.fee}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">ID: {apt.appointment_number}</span>
                    </div>
                  </div>

                  {/* Doctor Actions */}
                  <div className="flex items-center gap-2">
                    {apt.consultation_type === 'ONLINE_VIDEO' && apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setActiveCallApt(apt)}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Start Video Call</span>
                      </button>
                    )}

                    {apt.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setSelectedAptForRx(apt);
                          setDiagnosis(apt.reason || 'Acute Clinical Episode');
                        }}
                        className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Issue Prescription</span>
                      </button>
                    )}

                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCompleteApt(apt.id)}
                        className="py-2 px-3 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-emerald-50 rounded-xl font-semibold transition-colors"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Telehealth Video Call Screen */}
      {activeCallApt && (
        <TelehealthRoom
          roomId={activeCallApt.appointment_number}
          patientName={activeCallApt.patient_name}
          doctorName={user?.full_name || 'Dr. Priya Desai'}
          isDoctorView={true}
          onEndCall={() => setActiveCallApt(null)}
        />
      )}

      {/* Prescription Creation Modal */}
      {selectedAptForRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto text-xs animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                  Electronic Prescription Pad
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  Issue Digital Prescription for {selectedAptForRx.patient_name}
                </h3>
                <p className="text-slate-500 text-[11px]">Appointment: {selectedAptForRx.appointment_number}</p>
              </div>
              <button onClick={() => setSelectedAptForRx(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bronchitis, Stage-1 Hypertension..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Medicines Builder */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-slate-700">Prescription Medicines (Rx)</label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="text-emerald-700 font-bold text-[11px] flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {medicines.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          required
                          value={m.medicine_name}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].medicine_name = e.target.value;
                            setMedicines(updated);
                          }}
                          placeholder="Medicine name (e.g. Tab Amoxicillin)"
                          className="col-span-6 p-2 bg-white border border-slate-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={m.dosage}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].dosage = e.target.value;
                            setMedicines(updated);
                          }}
                          placeholder="Dosage (500mg)"
                          className="col-span-3 p-2 bg-white border border-slate-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={m.duration}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].duration = e.target.value;
                            setMedicines(updated);
                          }}
                          placeholder="5 days"
                          className="col-span-2 p-2 bg-white border border-slate-200 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="col-span-1 p-2 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={m.frequency}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].frequency = e.target.value;
                            setMedicines(updated);
                          }}
                          placeholder="Frequency (Twice daily)"
                          className="col-span-6 p-2 bg-white border border-slate-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={m.instructions}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].instructions = e.target.value;
                            setMedicines(updated);
                          }}
                          placeholder="Special instructions (Take after food)"
                          className="col-span-6 p-2 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Diet & Lifestyle Advice</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Low salt diet, hydrate with 3 liters of water, avoid physical exertion..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAptForRx(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRx}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  {submittingRx ? 'Signing...' : 'Sign & Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Slots Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-900">Manage Availability Slots</h3>
              <button onClick={() => setShowSlotModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddSlots} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Select Slots to Open</label>
                <div className="grid grid-cols-3 gap-2">
                  {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map((time) => {
                    const isSelected = slotTimes.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSlotTimes(slotTimes.filter((t) => t !== time));
                          } else {
                            setSlotTimes([...slotTimes, time]);
                          }
                        }}
                        className={`p-2 rounded-lg border text-center font-semibold ${
                          isSelected ? 'bg-emerald-600 text-white border-emerald-600 font-bold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                Open {slotTimes.length} Slots
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
