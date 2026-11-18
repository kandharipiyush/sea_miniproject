import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Stethoscope, Phone, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { api, HospitalBranch, City } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLocation } from '../../context/LocationContext.js';

export const HospitalAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { cities } = useLocation();
  const [branches, setBranches] = useState<HospitalBranch[]>([]);
  const [loading, setLoading] = useState(true);

  // New Branch Modal
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('400071');
  const [latitude, setLatitude] = useState('19.0760');
  const [longitude, setLongitude] = useState('72.8777');
  const [phone, setPhone] = useState('+91 22 25251122');
  const [emergency, setEmergency] = useState(true);
  const [facilities, setFacilities] = useState('24x7 Emergency, Modular OT, ICU, In-house Pathology');

  const loadHospitalData = async () => {
    setLoading(true);
    try {
      const res = await api.getHospitals({ limit: 40 });
      if (res.success) setBranches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitalData();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBranch({
        hospital_id: 'hosp-1',
        branch_name: branchName,
        address,
        city_id: selectedCityId,
        locality,
        pincode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        emergency_service: emergency,
        facilities,
      });
      alert(`Branch '${branchName}' created successfully!`);
      setShowAddBranch(false);
      setBranchName('');
      setAddress('');
      setLocality('');
      loadHospitalData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 font-extrabold text-2xl flex items-center justify-center border border-blue-200 flex-shrink-0">
              🏥
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                Hospital Network Administrator
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Apex Healthcare Group Console
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Managing multi-city hospital locations, departments, doctor allocations, and emergency services.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddBranch(true)}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Hospital Branch</span>
          </button>
        </div>

        {/* Branches Overview Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Active Hospital Branches & Locations ({branches.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading hospital branch network...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.slice(0, 15).map((b) => (
                <div key={b.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                        {b.city_name}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{b.branch_name}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-900">⭐ {b.hospital_rating}</span>
                  </div>

                  <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{b.address}</span>
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-slate-600 text-[11px]">
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="font-mono text-slate-800">{b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emergency ICU:</span>
                      <span className="font-bold text-emerald-700">
                        {b.emergency_service === 1 ? '✅ 24x7 Active' : 'Daycare'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doctor Affiliations:</span>
                      <span className="font-semibold text-slate-900">{b.doctor_count} Specialists</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Branch Modal */}
      {showAddBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto text-xs animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Register New Hospital Branch</h3>
              <button onClick={() => setShowAddBranch(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Apex Hospital – Ghatkopar West Branch"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.state_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Locality</label>
                  <input
                    type="text"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Ghatkopar West"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 45, LBS Marg, Near Station"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Facilities</label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emrg"
                  checked={emergency}
                  onChange={(e) => setEmergency(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <label htmlFor="emrg" className="font-semibold text-slate-700">
                  Enable 24x7 Emergency Trauma & Ambulance Service
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                Create Branch in CareNex
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
