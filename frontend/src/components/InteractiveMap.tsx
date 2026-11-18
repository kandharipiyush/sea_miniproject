import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  Building2,
  Navigation,
  Phone,
  ShieldAlert,
  Clock,
  UserCheck,
  Calendar,
  X,
  Stethoscope,
  Filter,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext.js';
import { api, HospitalBranch, Doctor, Specialization } from '../services/api.js';
import { getDoctorPhoto, handleImageError } from '../utils/doctorImages.js';

// Custom SVG-based Pin Icons for Leaflet
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
        cursor: pointer;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: 700;
          font-size: 13px;
        ">${label}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-pin',
  html: `
    <div style="position: relative; width: 28px; height: 28px;">
      <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #0284c7; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: #0284c7; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Component to dynamically re-center map when coordinates change
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], 12);
  }, [lat, lon, map]);
  return null;
}

interface InteractiveMapProps {
  onSelectDoctorForBooking?: (doctor: Doctor, branch: HospitalBranch) => void;
  heightClass?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onSelectDoctorForBooking,
  heightClass = 'h-[620px]',
}) => {
  const { selectedCity, coordinates, radiusKm, setRadiusKm } = useLocation();
  const [hospitals, setHospitals] = useState<HospitalBranch[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [facilityType, setFacilityType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Selected hospital for Doctor side drawer
  const [activeBranch, setActiveBranch] = useState<HospitalBranch | null>(null);
  const [branchDoctors, setBranchDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const centerLat = coordinates?.lat || selectedCity?.latitude || 19.076;
  const centerLon = coordinates?.lon || selectedCity?.longitude || 72.8777;

  useEffect(() => {
    async function loadSpecializations() {
      try {
        const res = await api.getSpecializations();
        if (res.success) setSpecializations(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadSpecializations();
  }, []);

  useEffect(() => {
    async function fetchHospitals() {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          lat: centerLat,
          lon: centerLon,
          radius_km: radiusKm,
          limit: 60,
        };
        if (selectedCity?.id) params.city_id = selectedCity.id;
        if (facilityType === 'EMERGENCY') params.emergency_only = true;

        const res = await api.getHospitals(params);
        if (res.success) {
          setHospitals(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch hospitals on map:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHospitals();
  }, [centerLat, centerLon, radiusKm, selectedCity, facilityType]);

  const handleOpenDoctors = async (branch: HospitalBranch) => {
    setActiveBranch(branch);
    setLoadingDoctors(true);
    try {
      const res = await api.getBranchDetails(branch.id);
      if (res.success) {
        let docs = res.data.doctors || [];
        if (selectedSpecialization) {
          docs = docs.filter(
            (d) => d.specialization_name.toLowerCase() === selectedSpecialization.toLowerCase()
          );
        }
        setBranchDoctors(docs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const getDirectionsUrl = (lat: number, lon: number, name: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`;
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      {/* Map Filter Controls Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Filters:
          </span>

          {/* Facility Type buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'EMERGENCY', 'MULTISPECIALITY'].map((type) => (
              <button
                key={type}
                onClick={() => setFacilityType(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  facilityType === type
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'ALL' ? 'All Facilities' : type === 'EMERGENCY' ? '🚨 24x7 Emergency' : 'Multispeciality'}
              </button>
            ))}
          </div>

          {/* Specialization Filter on Map */}
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="">All Medical Specializations</option>
            {specializations.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.doctor_count} doctors)
              </option>
            ))}
          </select>
        </div>

        {/* Radius Slider */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Search Radius:</span>
          <div className="flex items-center gap-1">
            {[2, 5, 10, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  radiusKm === r
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
          <span className="ml-2 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {hospitals.length} Mapped Facilities
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className={`w-full ${heightClass} relative z-10`}>
        {loading && (
          <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Querying spatial coordinates...
          </div>
        )}

        <MapContainer
          center={[centerLat, centerLon]}
          zoom={12}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <RecenterMap lat={centerLat} lon={centerLon} />

          {/* OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Patient Current Location Marker & Radius Circle */}
          {coordinates && (
            <>
              <Marker position={[coordinates.lat, coordinates.lon]} icon={userLocationIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-medblue-700">Your Current Search Center</p>
                    <p className="text-slate-500">{selectedCity?.name} Area</p>
                  </div>
                </Popup>
              </Marker>

              <Circle
                center={[coordinates.lat, coordinates.lon]}
                radius={radiusKm * 1000}
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.06, weight: 1.5 }}
              />
            </>
          )}

          {/* Hospital Branch Markers */}
          {hospitals.map((branch) => {
            const isEmergency = branch.emergency_service === 1;
            const icon = isEmergency ? createCustomIcon('#e11d48', 'H+') : createCustomIcon('#0284c7', 'H');

            return (
              <Marker
                key={branch.id}
                position={[branch.latitude, branch.longitude]}
                icon={icon}
              >
                <Popup className="carenex-map-popup" maxWidth={320}>
                  <div className="p-2 text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {branch.hospital_type}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1 leading-tight">
                          {branch.branch_name}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex-shrink-0">
                        {branch.distance_km} km
                      </span>
                    </div>

                    <p className="text-slate-500 text-[11px] mb-2 leading-snug">{branch.address}</p>

                    <div className="space-y-1 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Hours: {branch.operating_hours || '24x7'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Phone: {branch.phone}</span>
                      </div>
                      {isEmergency && (
                        <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Level-1 Emergency & ICU Trauma Unit</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleOpenDoctors(branch)}
                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center font-bold text-[11px] shadow-2xs flex items-center justify-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>View Doctors</span>
                      </button>

                      <a
                        href={getDirectionsUrl(branch.latitude, branch.longitude, branch.branch_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center font-semibold text-[11px] flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        <span>Directions</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Legend (Floating in corner) */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200 shadow-lg text-[11px] space-y-1.5">
          <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Map Legend</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span>Multispeciality Hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span>24x7 Emergency Trauma Center</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Your GPS Radius Search</span>
          </div>
        </div>
      </div>

      {/* Side Drawer: Associated Doctors at Selected Hospital */}
      {activeBranch && (
        <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl border-l border-slate-200 z-30 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                Hospital Medical Staff
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-1">{activeBranch.branch_name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Navigation className="w-3 h-3 text-emerald-600" />
                {activeBranch.locality}, {activeBranch.city_name} ({activeBranch.distance_km} km away)
              </p>
            </div>
            <button
              onClick={() => setActiveBranch(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Doctor List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingDoctors ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <span className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
                <p>Loading practicing specialists...</p>
              </div>
            ) : branchDoctors.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No doctors found matching current filters at this branch.</p>
              </div>
            ) : (
              branchDoctors.map((doc) => (
                <div
                  key={doc.doctor_id || doc.id}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:shadow-md transition-all text-xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={getDoctorPhoto(doc)}
                      onError={(e) => handleImageError(e, doc.name)}
                      alt={doc.name}
                      className="w-12 h-12 rounded-xl object-cover bg-emerald-50 border border-slate-200 flex-shrink-0 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-slate-900 truncate">{doc.name}</h4>
                        <span title="CareNex Doctor"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /></span>
                      </div>
                      <p className="text-emerald-700 font-semibold">{doc.specialization_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{doc.qualification}</p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                        <span>⭐ {doc.rating || 4.8} ({doc.review_count || 32})</span>
                        <span>•</span>
                        <span>{doc.experience_years} yrs exp</span>
                        <span>•</span>
                        <span className="font-bold text-slate-900">₹{doc.consultation_fee}</span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {doc.schedule_days ? doc.schedule_days.split(',').slice(0, 3).join(', ') : 'Daily'}
                        </span>

                        <button
                          onClick={() => {
                            if (onSelectDoctorForBooking) {
                              onSelectDoctorForBooking(doc, activeBranch);
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Book Slot</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
