import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, UserCheck, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api, Doctor, HospitalBranch, DoctorSlot } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { getDoctorPhoto, handleImageError } from '../utils/doctorImages.js';

interface BookingModalProps {
  doctor: Doctor | null;
  branch: HospitalBranch | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ doctor, branch, onClose, onSuccess }) => {
  const { user, setShowLoginModal } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DoctorSlot | null>(null);
  const [consultationType, setConsultationType] = useState<'IN_PERSON' | 'ONLINE_VIDEO'>('IN_PERSON');
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Generate next 7 dates
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  useEffect(() => {
    if (!doctor) return;
    async function loadSlots() {
      setLoadingSlots(true);
      setError('');
      try {
        const docId = doctor?.doctor_id || doctor?.id;
        const branchId = branch?.id || doctor?.branch_id;
        const res = await api.getDoctorSlots(docId!, selectedDate, branchId);
        if (res.success) {
          setSlots(res.data);
          setSelectedSlot(null);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [doctor, branch, selectedDate]);

  if (!doctor) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedSlot && slots.length > 0) {
      setError('Please select an available time slot.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const docId = doctor.doctor_id || doctor.id;
      const branchId = branch?.id || doctor.branch_id;
      const slotTime = selectedSlot ? selectedSlot.slot_time : '10:00';

      const res = await api.bookAppointment({
        doctor_id: docId,
        branch_id: branchId,
        slot_id: selectedSlot?.id,
        appointment_date: selectedDate,
        appointment_time: slotTime,
        consultation_type: consultationType,
        reason: reason || 'Routine healthcare consultation',
      });

      if (res.success) {
        setConfirmedBooking(res.data);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
              Book Appointment
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Consultation with {doctor.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation Success Screen */
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Appointment Confirmed!</h3>
            <p className="text-xs text-slate-500 mb-6">
              Your consultation booking ID is{' '}
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                {confirmedBooking.appointment_number}
              </span>
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-900">{doctor.name} ({doctor.specialization_name})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.date} at {confirmedBooking.time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Hospital Branch:</span>
                <span className="font-bold text-slate-900">{branch?.branch_name || doctor.branch_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Consultation Fee:</span>
                <span className="font-bold text-emerald-700">₹{confirmedBooking.fee} (Paid)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
            >
              Done & View in My Appointments
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBooking} className="p-6 space-y-5">
            {/* Doctor Info Card */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <img
                src={getDoctorPhoto(doctor)}
                onError={(e) => handleImageError(e, doctor.name)}
                alt={doctor.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-emerald-50"
              />
              <div className="flex-1 min-w-0 text-xs">
                <h4 className="font-bold text-slate-900 truncate">{doctor.name}</h4>
                <p className="text-emerald-700 font-semibold">{doctor.specialization_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{branch?.branch_name || doctor.branch_name}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900">₹{doctor.consultation_fee}</span>
                <p className="text-[10px] text-slate-400">Consultation</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Consultation Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Consultation Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConsultationType('IN_PERSON')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    consultationType === 'IN_PERSON'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>In-Person Hospital Visit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsultationType('ONLINE_VIDEO')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    consultationType === 'ONLINE_VIDEO'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Online Telehealth Video</span>
                </button>
              </div>
            </div>

            {/* Date Selector (Next 7 days) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Date</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {next7Days.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`flex-shrink-0 w-16 py-2 px-1 rounded-xl border text-center transition-all ${
                      selectedDate === d.dateStr
                        ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block text-[10px] uppercase font-semibold">{d.dayName}</span>
                    <span className="block text-base font-extrabold">{d.dayNumber}</span>
                    <span className="block text-[9px] opacity-80">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Available Time Slots ({selectedDate})
              </label>

              {loadingSlots ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading available slots...</div>
              ) : slots.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  Doctor has no pre-scheduled slots for this date. Default appointment time will be scheduled for 10:00 AM.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={s.is_booked === 1}
                      onClick={() => setSelectedSlot(s)}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold border text-center transition-all ${
                        s.is_booked === 1
                          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                          : selectedSlot?.id === s.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                          : 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {s.slot_time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reason for Visit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Consultation (Optional)</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for visit..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Trust Assurance */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Instant slot reservation. Guaranteed no double-booking via database transaction lock.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{submitting ? 'Confirming Reservation...' : `Confirm Booking • ₹${doctor.consultation_fee}`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
