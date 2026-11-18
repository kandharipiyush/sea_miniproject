import React, { useState, useEffect } from 'react';
import { FlaskConical, Search, MapPin, Clock, Calendar, CheckCircle2, Home, X } from 'lucide-react';
import { api, DiagnosticCentre, DiagnosticTest } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';
import { useAuth } from '../context/AuthContext.js';

export const DiagnosticsPage: React.FC = () => {
  const { selectedCity, coordinates } = useLocation();
  const { user, setShowLoginModal } = useAuth();
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [centres, setCentres] = useState<DiagnosticCentre[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [bookingTest, setBookingTest] = useState<DiagnosticTest | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('08:30');
  const [sampleType, setSampleType] = useState<'HOME_COLLECTION' | 'LAB_VISIT'>('LAB_VISIT');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function loadDiagnostics() {
      setLoading(true);
      try {
        const [testsRes, centresRes] = await Promise.all([
          api.getDiagnosticTests({ category: selectedCategory, search: searchQuery }),
          api.getDiagnosticCentres({
            city_id: selectedCity?.id || 1,
            lat: coordinates?.lat,
            lon: coordinates?.lon,
          }),
        ]);
        if (testsRes.success) setTests(testsRes.data);
        if (centresRes.success) setCentres(res => centresRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDiagnostics();
  }, [selectedCity, coordinates, selectedCategory, searchQuery]);

  const handleBookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!bookingTest) return;

    try {
      const res = await api.bookDiagnosticTest({
        centre_id: bookingTest.centre_id,
        test_id: bookingTest.id,
        booking_date: bookingDate,
        booking_time: bookingTime,
        sample_collection_type: sampleType,
      });
      if (res.success) {
        setBookingSuccess(true);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Diagnostic & Pathology Services
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Book Lab Tests & Health Checkup Packages
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified pathology laboratories, digital reports, and doorstep home sample collection across {selectedCity?.name}.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center gap-4 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests (e.g. CBC, Lipid Profile, Vitamin D, MRI)..."
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {['', 'Hematology', 'Biochemistry', 'Diabetes', 'Endocrinology', 'Radiology', 'Advanced Imaging'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex-shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat || 'All Tests'}
              </button>
            ))}
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading lab test catalogue...</div>
          ) : tests.map((t) => (
            <div
              key={t.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                    {t.category}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">₹{t.price}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{t.test_name}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Sample Required: {t.sample_type}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-slate-600 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>Turnaround Time:</span>
                    <span className="font-semibold text-slate-800">{t.turnaround_hours} Hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Diagnostic Centre:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[160px]">{t.centre_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Location:</span>
                    <span className="text-slate-500">{t.locality}, {t.city_name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    setBookingTest(t);
                    setBookingSuccess(false);
                  }}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Book Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic Centres in City */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Partner Pathology Laboratories in {selectedCity?.name} ({centres.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {centres.map((c) => (
              <div key={c.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <h4 className="font-bold text-slate-900">{c.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{c.address}</span>
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-bold text-emerald-700">{c.distance_km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Home Collection:</span>
                    <span className="font-semibold text-emerald-800">✅ Available</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Test Modal */}
      {bookingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                  Lab Test Booking
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{bookingTest.test_name}</h3>
              </div>
              <button onClick={() => setBookingTest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-base text-slate-900">Test Booked Successfully!</h4>
                <p className="text-slate-500 text-xs mt-1">
                  Confirmation sent to your email. Results will be uploaded to your Health Vault within {bookingTest.turnaround_hours} hours.
                </p>
                <button
                  onClick={() => setBookingTest(null)}
                  className="mt-5 w-full py-2 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookTest} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Collection Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSampleType('LAB_VISIT')}
                      className={`p-2 rounded-xl border text-center font-semibold ${
                        sampleType === 'LAB_VISIT'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Visit Lab Centre
                    </button>
                    <button
                      type="button"
                      onClick={() => setSampleType('HOME_COLLECTION')}
                      className={`p-2 rounded-xl border text-center font-semibold ${
                        sampleType === 'HOME_COLLECTION'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Home Collection
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="07:30">07:30 AM (Fasting Sample)</option>
                    <option value="08:30">08:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between font-bold">
                  <span>Total Amount (Paid at Collection):</span>
                  <span className="text-emerald-700 text-sm">₹{bookingTest.price}</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Confirm Test Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
