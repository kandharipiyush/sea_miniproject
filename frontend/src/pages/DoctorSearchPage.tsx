import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Stethoscope,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { api, Doctor, Specialization, HospitalBranch } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';
import { BookingModal } from '../components/BookingModal.js';
import { getDoctorPhoto, handleImageError } from '../utils/doctorImages.js';

export const DoctorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity, coordinates } = useLocation();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [specializationSlug, setSpecializationSlug] = useState(searchParams.get('specialization') || '');
  const [maxFee, setMaxFee] = useState<number>(2500);
  const [minRating, setMinRating] = useState<number>(0);
  const [minExp, setMinExp] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [page, setPage] = useState<number>(1);

  // Booking Modal
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    async function loadSpecs() {
      try {
        const res = await api.getSpecializations();
        if (res.success) setSpecializations(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadSpecs();
  }, []);

  useEffect(() => {
    async function searchDoctors() {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page,
          limit: 15,
          sort_by: sortBy,
        };

        if (searchQuery) params.search = searchQuery;
        if (specializationSlug) params.specialization_slug = specializationSlug;
        if (selectedCity?.id) params.city_id = selectedCity.id;
        if (coordinates?.lat && coordinates?.lon) {
          params.lat = coordinates.lat;
          params.lon = coordinates.lon;
          params.radius_km = 50;
        }
        if (maxFee < 2500) params.max_fee = maxFee;
        if (minRating > 0) params.min_rating = minRating;
        if (minExp > 0) params.min_experience = minExp;

        const branchId = searchParams.get('branch_id');
        if (branchId) params.branch_id = branchId;

        const res = await api.getDoctors(params);
        if (res.success) {
          setDoctors(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to search doctors:', err);
      } finally {
        setLoading(false);
      }
    }
    searchDoctors();
  }, [searchQuery, specializationSlug, selectedCity, coordinates, maxFee, minRating, minExp, sortBy, page, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Stats */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Doctor Search & Discovery
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing {total} verified specialists in {selectedCity?.name || 'All Cities'}
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="rating">Highest Rated</option>
              <option value="nearest">Nearest to Me</option>
              <option value="fee_low">Lowest Consultation Fee</option>
              <option value="experience">Most Experienced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Filter Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  Filter Doctors
                </span>
                {(searchQuery || specializationSlug || maxFee < 2500 || minRating > 0 || minExp > 0) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSpecializationSlug('');
                      setMaxFee(2500);
                      setMinRating(0);
                      setMinExp(0);
                      setPage(1);
                    }}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold text-[11px]"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Keyword Search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Doctor name, area, symptom..."
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Specialization Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Specialization</label>
                <select
                  value={specializationSlug}
                  onChange={(e) => {
                    setSpecializationSlug(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name} ({s.doctor_count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Consultation Fee Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Max Fee</label>
                  <span className="font-bold text-emerald-700">₹{maxFee}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  step="100"
                  value={maxFee}
                  onChange={(e) => {
                    setMaxFee(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Minimum Rating</label>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 4.5, 4.8].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setMinRating(r);
                        setPage(1);
                      }}
                      className={`py-1.5 rounded-lg border text-center font-semibold transition-all ${
                        minRating === r
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r === 0 ? 'Any' : `⭐ ${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Experience</label>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 10, 15].map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => {
                        setMinExp(exp);
                        setPage(1);
                      }}
                      className={`py-1.5 rounded-lg border text-center font-semibold transition-all ${
                        minExp === exp
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {exp === 0 ? 'Any' : `${exp}+ yrs`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Doctor Cards Grid */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
                <p>Searching database for practicing specialists...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-base text-slate-800">No doctors match your query</h3>
                <p className="text-slate-400 mt-1">Try broadening your search filters or selecting another city.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={getDoctorPhoto(doc)}
                        onError={(e) => handleImageError(e, doc.name)}
                        alt={doc.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-emerald-50 border border-slate-200 flex-shrink-0 shadow-xs"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">{doc.name}</h3>
                          <span title="CareNex Verified Doctor"><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /></span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                            {doc.specialization_name}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium">{doc.qualification}</p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="font-bold text-slate-800">⭐ {doc.rating} ({doc.review_count} patient reviews)</span>
                          <span>•</span>
                          <span>{doc.experience_years} years medical experience</span>
                          <span>•</span>
                          <span>Languages: {doc.languages || 'English, Hindi'}</span>
                        </div>

                        <div className="pt-2 text-xs text-slate-600 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-900">{doc.branch_name}</span>
                          <span className="text-slate-400">({doc.branch_locality}, {doc.city_name})</span>
                          {doc.distance_km !== undefined && (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                              {doc.distance_km} km away
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Booking / Fee Action */}
                    <div className="sm:border-l sm:border-slate-100 sm:pl-6 w-full sm:w-44 flex flex-col justify-between items-start sm:items-end gap-3 flex-shrink-0">
                      <div className="sm:text-right">
                        <span className="text-xs text-slate-400 block font-medium">Consultation Fee</span>
                        <span className="text-xl font-extrabold text-slate-900">₹{doc.consultation_fee}</span>
                        <span className="text-[10px] text-emerald-600 block font-semibold">Available Today</span>
                      </div>

                      <button
                        onClick={() => setBookingDoctor(doc)}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Slot</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-4 flex items-center justify-between text-xs">
                    <p className="text-slate-500">
                      Page {page} of {totalPages} ({total} specialists)
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="p-2 border border-slate-200 bg-white rounded-lg disabled:opacity-50 hover:bg-slate-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="font-bold text-slate-800 px-2">{page}</span>

                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="p-2 border border-slate-200 bg-white rounded-lg disabled:opacity-50 hover:bg-slate-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          branch={null}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </div>
  );
};
