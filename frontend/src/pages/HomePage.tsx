import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Heart,
  ShieldAlert,
  ArrowRight,
  Building2,
  Stethoscope,
  Clock,
  Sparkles,
  PhoneCall,
  Activity,
  Award,
  Video,
  FileText,
  Navigation,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext.js';
import { api, Specialization, HospitalBranch, Doctor } from '../services/api.js';
import { InteractiveMap } from '../components/InteractiveMap.js';
import { BookingModal } from '../components/BookingModal.js';

export const HomePage: React.FC = () => {
  const { selectedCity, cities, selectCityById, coordinates, locality } = useLocation();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalBranch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingBranch, setBookingBranch] = useState<HospitalBranch | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [specRes, hospRes] = await Promise.all([
          api.getSpecializations(),
          api.getHospitals({
            city_id: selectedCity?.id || 1,
            lat: coordinates?.lat,
            lon: coordinates?.lon,
            radius_km: 25,
            limit: 6,
          }),
        ]);
        if (specRes.success) setSpecializations(specRes.data);
        if (hospRes.success) setNearbyHospitals(hospRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [selectedCity, coordinates]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/doctors?search=${encodeURIComponent(searchQuery)}&specialization=${encodeURIComponent(selectedSpec)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 pt-10 pb-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-4 border border-emerald-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Unified Multi-City Healthcare Platform
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Smart Healthcare Discovery, Appointments & Medical Records
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Connect seamlessly with verified doctors, multi-branch hospitals, 24x7 trauma centers, diagnostic labs, and pharmacies in{' '}
              <span className="font-bold text-slate-900">{selectedCity?.name || 'your city'}</span> and across India.
            </p>
          </div>

          {/* Unified Search Box */}
          <div className="max-w-4xl mx-auto bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-200">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Doctor / Symptom Input */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Doctor name, condition, or hospital..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Specialization Select */}
              <div className="md:col-span-4 relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={selectedSpec}
                  onChange={(e) => setSelectedSpec(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium bg-white"
                >
                  <option value="">All 25 Specializations</option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Healthcare</span>
                </button>
              </div>
            </form>

            {/* Quick Filter Tags */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Popular Searches:</span>
              {['Cardiologist near me', 'Dermatologist in Kalyan', 'Dentist', 'Orthopedic Hospital', 'Pediatrician'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    navigate(`/doctors?search=${encodeURIComponent(tag)}`);
                  }}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-600 text-[11px] font-medium transition-colors border border-slate-200/60"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="max-w-4xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">1,200+</div>
              <div className="text-xs text-slate-500 font-medium">Verified Doctors</div>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">200+</div>
              <div className="text-xs text-slate-500 font-medium">Hospital Branches</div>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">20+</div>
              <div className="text-xs text-slate-500 font-medium">Supported Cities</div>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
              <div className="text-xl sm:text-2xl font-extrabold text-rose-600">24x7</div>
              <div className="text-xs text-slate-500 font-medium">Emergency Trauma Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Callout Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-gradient-to-r from-rose-900 to-rose-800 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-7 h-7 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Medical Emergency in {selectedCity?.name}?</h3>
              <p className="text-xs text-rose-200">
                Instantly discover nearby 24x7 emergency trauma departments, blood banks, and ambulance hotlines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="tel:108"
              className="flex-1 sm:flex-initial py-2 px-4 bg-white text-rose-800 hover:bg-rose-50 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Call 108 Ambulance</span>
            </a>
            <Link
              to="/emergency"
              className="flex-1 sm:flex-initial py-2 px-4 bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl transition-colors text-center border border-rose-500"
            >
              Find Emergency Centers
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Medical Specializations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Browse by Care</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Medical Specializations</h2>
          </div>
          <Link
            to="/doctors"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View all 25 Specializations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {specializations.slice(0, 12).map((s) => (
            <Link
              key={s.id}
              to={`/doctors?specialization=${s.slug}`}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">{s.name}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.doctor_count} Doctors</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive Map Healthcare Discovery (Mandatory Add-on Section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Map Intelligence</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Explore Nearby Hospitals in {selectedCity?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any hospital pin to view details, distance in km, operating hours, and associated practicing doctors.
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Full-Screen Map View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <InteractiveMap
          heightClass="h-[520px]"
          onSelectDoctorForBooking={(doc, branch) => {
            setBookingDoctor(doc);
            setBookingBranch(branch);
          }}
        />
      </section>

      {/* Featured Hospital Branches */}
      <section className="bg-slate-100/60 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Verified Network</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Top Healthcare Facilities in {selectedCity?.name}
              </h2>
            </div>
            <Link
              to="/hospitals"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Explore all branches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyHospitals.map((branch) => (
              <div
                key={branch.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      {branch.hospital_type}
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                      ⭐ {branch.hospital_rating} ({branch.hospital_reviews})
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">{branch.branch_name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{branch.address}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Proximity:</span>
                      <span className="font-bold text-emerald-700">{branch.distance_km} km away</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Emergency Care:</span>
                      <span className="font-semibold text-slate-800">
                        {branch.emergency_service === 1 ? '✅ 24x7 ICU Available' : 'Daycare Service'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Specialists:</span>
                      <span className="font-semibold text-slate-800">{branch.doctor_count} Doctors on duty</span>
                    </div>
                  </div>

                  {/* Departments preview */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {branch.departments?.slice(0, 3).map((dept) => (
                      <span key={dept} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/doctors?branch_id=${branch.id}`}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-2xs"
                  >
                    View Doctors & Book
                  </Link>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-xl"
                    title="Directions"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How CareNex Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Streamlined Experience</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How CareNex Works</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">End-to-end digital healthcare delivery in 4 simple steps.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 font-extrabold rounded-2xl flex items-center justify-center mx-auto mb-4 text-base">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Detect Location</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use GPS or manually select your city and locality to find closest verified hospitals.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 font-extrabold rounded-2xl flex items-center justify-center mx-auto mb-4 text-base">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Compare & Select</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Filter by 25+ specializations, compare hospital branches, check consultation fees and ratings.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 font-extrabold rounded-2xl flex items-center justify-center mx-auto mb-4 text-base">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Instant Slot Booking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Reserve real-time slots with double-booking prevention. Choose in-person visit or video call.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 font-extrabold rounded-2xl flex items-center justify-center mx-auto mb-4 text-base">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">EHR & Prescriptions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Receive digital prescriptions with QR signature and store health records permanently in your vault.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          branch={bookingBranch}
          onClose={() => {
            setBookingDoctor(null);
            setBookingBranch(null);
          }}
        />
      )}
    </div>
  );
};
