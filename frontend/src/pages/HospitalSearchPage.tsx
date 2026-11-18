import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Navigation,
  Check,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api, HospitalBranch } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';
import { HospitalCompareModal } from '../components/HospitalCompareModal.js';

export const HospitalSearchPage: React.FC = () => {
  const { selectedCity, coordinates, radiusKm, setRadiusKm } = useLocation();
  const [hospitals, setHospitals] = useState<HospitalBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  // Hospital Comparison List (up to 3)
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  useEffect(() => {
    async function fetchHospitals() {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page,
          limit: 12,
        };

        if (selectedCity?.id) params.city_id = selectedCity.id;
        if (coordinates?.lat && coordinates?.lon) {
          params.lat = coordinates.lat;
          params.lon = coordinates.lon;
          params.radius_km = radiusKm;
        }
        if (searchQuery) params.search = searchQuery;
        if (emergencyOnly) params.emergency_only = true;
        if (selectedType) params.type = selectedType;

        const res = await api.getHospitals(params);
        if (res.success) {
          setHospitals(res.data);
          setTotal(res.total);
        }
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHospitals();
  }, [selectedCity, coordinates, radiusKm, searchQuery, emergencyOnly, selectedType, page]);

  const toggleCompare = (branchId: string) => {
    if (compareList.includes(branchId)) {
      setCompareList(compareList.filter((id) => id !== branchId));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare a maximum of 3 hospitals side-by-side.');
        return;
      }
      setCompareList([...compareList, branchId]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Hospital & Branch Discovery
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing {total} verified facilities in {selectedCity?.name || 'All Cities'}
            </p>
          </div>

          {/* Quick Radius Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Search Radius:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              {[5, 10, 25, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRadiusKm(r);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    radiusKm === r
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by hospital name or area..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Hospital Type */}
          <div className="md:col-span-4">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">All Hospital Categories</option>
              <option value="Multispeciality">Multispeciality Hospital</option>
              <option value="Super Speciality">Super Speciality Hospital</option>
              <option value="General">General & Trauma Hospital</option>
              <option value="Private">Private Healthcare Trust</option>
            </select>
          </div>

          {/* Emergency Filter Toggle */}
          <div className="md:col-span-3 flex items-center justify-end">
            <button
              onClick={() => {
                setEmergencyOnly(!emergencyOnly);
                setPage(1);
              }}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                emergencyOnly
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{emergencyOnly ? 'Showing 24x7 Emergency Only' : 'Filter 24x7 Emergency'}</span>
            </button>
          </div>
        </div>

        {/* Hospital Cards Grid */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
            <p>Querying nearby hospitals and branches...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800">No hospitals found matching current criteria</h3>
            <p className="text-slate-400 mt-1">Try expanding your search radius to 25km or 50km.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hosp) => {
              const isComparing = compareList.includes(hosp.id);

              return (
                <div
                  key={hosp.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {hosp.hospital_type}
                      </span>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                        ⭐ {hosp.hospital_rating} ({hosp.hospital_reviews})
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">{hosp.branch_name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{hosp.address}</span>
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Distance:</span>
                        <span className="font-bold text-emerald-700">{hosp.distance_km} km away</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Emergency & ICU:</span>
                        <span className="font-semibold text-slate-800">
                          {hosp.emergency_service === 1 ? '✅ Verified 24x7 ICU' : 'Daycare Unit'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Doctors on Duty:</span>
                        <span className="font-semibold text-slate-800">{hosp.doctor_count} Specialists</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Contact:</span>
                        <span className="font-medium text-slate-700">{hosp.phone}</span>
                      </div>
                    </div>

                    {/* Departments */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {hosp.departments?.slice(0, 4).map((d) => (
                        <span key={d} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Compare Checkbox */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleCompare(hosp.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                        isComparing
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isComparing ? <Check className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{isComparing ? 'Comparing' : 'Compare'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/doctors?branch_id=${hosp.id}`}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Doctors</span>
                      </Link>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-lg"
                        title="Directions"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Comparison Bar */}
        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <span className="text-xs font-bold">
              {compareList.length} of 3 Hospitals Selected for Comparison
            </span>
            <button
              onClick={() => setCompareModalOpen(true)}
              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-extrabold rounded-lg text-xs shadow-md transition-colors"
            >
              Compare Side-by-Side
            </button>
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        )}

        {/* Comparison Modal */}
        {compareModalOpen && (
          <HospitalCompareModal
            branchIds={compareList}
            onClose={() => setCompareModalOpen(false)}
            onRemoveBranch={(id) => setCompareList(compareList.filter((bId) => bId !== id))}
          />
        )}
      </div>
    </div>
  );
};
