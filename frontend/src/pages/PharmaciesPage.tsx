import React, { useState, useEffect } from 'react';
import { Pill, Search, MapPin, Phone, Clock, Navigation, CheckCircle2 } from 'lucide-react';
import { api, Pharmacy } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';

export const PharmaciesPage: React.FC = () => {
  const { selectedCity, coordinates, radiusKm, setRadiusKm } = useLocation();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [only24x7, setOnly24x7] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPharmacies() {
      setLoading(true);
      try {
        const res = await api.getPharmacies({
          city_id: selectedCity?.id || 1,
          lat: coordinates?.lat,
          lon: coordinates?.lon,
          radius_km: radiusKm,
          search: searchQuery,
          is_24x7: only24x7 ? 1 : undefined,
        });
        if (res.success) setPharmacies(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPharmacies();
  }, [selectedCity, coordinates, radiusKm, searchQuery, only24x7]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Medicine & Prescription Dispensation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Verified Pharmacies & 24x7 Chemist Stores
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Locate licensed pharmacies with verified medicine stocks and 24x7 emergency counters across {selectedCity?.name}.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pharmacy by name or locality..."
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnly24x7(!only24x7)}
              className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                only24x7
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              🌙 Filter 24x7 Open Stores
            </button>
          </div>
        </div>

        {/* Pharmacy Cards */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Locating nearby pharmacies...
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No pharmacies found matching current filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pharmacies.map((p) => (
              <div
                key={p.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Partner
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                      {p.distance_km} km away
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{p.address}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Operating Hours: <strong>{p.operating_hours || '24x7'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Phone: {p.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`tel:${p.phone}`}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Store</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                    title="Directions"
                  >
                    <Navigation className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
