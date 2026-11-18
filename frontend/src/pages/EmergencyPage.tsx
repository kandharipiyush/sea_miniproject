import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, MapPin, Navigation, Activity, Droplets, AlertTriangle } from 'lucide-react';
import { api, EmergencyFacility } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';

export const EmergencyPage: React.FC = () => {
  const { selectedCity, coordinates, radiusKm, setRadiusKm } = useLocation();
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [helplines, setHelplines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmergency() {
      setLoading(true);
      try {
        const res = await api.getEmergencyFacilities({
          city_id: selectedCity?.id || 1,
          lat: coordinates?.lat,
          lon: coordinates?.lon,
          radius_km: radiusKm,
        });
        if (res.success) {
          setFacilities(res.data);
          setHelplines(res.helplines || []);
        }
      } catch (err) {
        console.error('Failed to load emergency facilities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEmergency();
  }, [selectedCity, coordinates, radiusKm]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Emergency Alert Banner */}
        <div className="bg-gradient-to-r from-rose-900 to-rose-700 text-white p-6 rounded-3xl shadow-xl mb-8 border border-rose-600">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-8 h-8 text-rose-300 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-rose-100">
                  CareNex 24x7 Emergency Trauma Network
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                  Emergency Medical Services – {selectedCity?.name}
                </h1>
                <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-2xl">
                  Quick-dial verified emergency hotlines, discover nearest trauma centers with ICU capacity, and navigate to 24x7 blood banks.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:108"
                className="py-3 px-6 bg-white text-rose-900 font-extrabold text-sm rounded-xl shadow-lg hover:bg-rose-50 transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-5 h-5 text-rose-600 animate-bounce" />
                <span>Call 108 Ambulance</span>
              </a>
              <a
                href="tel:112"
                className="py-3 px-5 bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm rounded-xl border border-rose-400 transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>112 Emergency</span>
              </a>
            </div>
          </div>
        </div>

        {/* National Emergency Helplines Grid */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Verified Medical Hotlines & Dispatch Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {helplines.map((h) => (
              <div key={h.number} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{h.name}</h4>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{h.available}</p>
                </div>
                <a
                  href={`tel:${h.number}`}
                  className="py-1.5 px-3 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-200"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{h.number}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Emergency Trauma Facilities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Verified 24x7 Emergency Trauma Centers ({facilities.length})
              </h2>
              <p className="text-xs text-slate-500">Sorted by distance from your search location</p>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-slate-500">Radius:</span>
              {[5, 10, 25, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    radiusKm === r ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Querying verified emergency trauma facilities...
            </div>
          ) : facilities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              No emergency facilities found within {radiusKm}km. Try expanding search radius.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((f) => (
                <div
                  key={f.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded uppercase">
                        {f.facility_type}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {f.distance_km} km away
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{f.facility_name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{f.address}</span>
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">ICU Ventilator Beds:</span>
                        <span className="font-bold text-slate-900">{f.icu_beds} Active Beds</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ambulance on Standby:</span>
                        <span className="font-bold text-emerald-700">✅ GPS Equipped</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Blood Bank:</span>
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5" /> 24x7 Available
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={`tel:${f.emergency_phone}`}
                      className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Emergency Desk</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                      title="Route Directions"
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
    </div>
  );
};
