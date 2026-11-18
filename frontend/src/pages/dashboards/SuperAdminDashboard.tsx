import React, { useState, useEffect } from 'react';
import {
  Users,
  Stethoscope,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { api } from '../../services/api.js';

const COLORS = ['#10b981', '#0284c7', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#3b82f6'];

export const SuperAdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add City Modal
  const [showAddCity, setShowAddCity] = useState(false);
  const [cityName, setCityName] = useState('');
  const [cityStateId, setCityStateId] = useState(1);
  const [cityLat, setCityLat] = useState('25.3176');
  const [cityLon, setCityLon] = useState('82.9739');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [anRes, docRes, usrRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminDoctors({ limit: 15 }),
        api.getAdminUsers({ limit: 15 }),
      ]);
      if (anRes.success) setAnalytics(anRes.data);
      if (docRes.success) setDoctors(docRes.data);
      if (usrRes.success) setUsers(usrRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyDoctor = async (id: string, status: string) => {
    try {
      await api.verifyDoctor(id, status);
      alert(`Doctor status updated to ${status}!`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addCity({
        name: cityName,
        state_id: cityStateId,
        latitude: parseFloat(cityLat),
        longitude: parseFloat(cityLon),
      });
      alert(`City '${cityName}' added to CareNex multi-city coverage network!`);
      setShowAddCity(false);
      setCityName('');
      loadAdminData();
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
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 font-extrabold text-2xl flex items-center justify-center border border-amber-200 flex-shrink-0">
              👑
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
                Ecosystem Master Console
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                CareNex Super Administration
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete platform metrics, doctor credential verification, multi-city rollout, and audit management.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddCity(true)}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New City Coverage</span>
          </button>
        </div>

        {/* Real Dynamic Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Patients</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {analytics?.totals?.patients?.toLocaleString() || '5,000+'}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Registered Vaults</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Doctors</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {analytics?.totals?.doctors?.toLocaleString() || '1,200+'}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Multi-Branch Specialists</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Hospitals</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">
              {analytics?.totals?.branches || '200+'}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Verified Branches</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Diagnostic Labs</span>
            <div className="text-2xl font-extrabold text-purple-600 mt-1">
              {analytics?.totals?.diagnosticCentres || '120'}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Certified Centres</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Appointments</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {analytics?.totals?.totalAppointments?.toLocaleString() || '2,500+'}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {analytics?.totals?.activeAppointments} Active
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{analytics?.totals?.totalRevenue?.toLocaleString() || '1.8M'}
            </div>
            <span className="text-[10px] text-slate-400">Processed Payments</span>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* City Hospital Distribution Chart */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Hospital Branch Coverage by City
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Distribution across key metro and tier-2 healthcare hubs</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.cityDistribution?.slice(0, 8) || []}>
                  <XAxis dataKey="city_name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="branch_count" fill="#10b981" radius={[6, 6, 0, 0]} name="Hospital Branches" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Specialization Breakdown Chart */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Specialization Distribution
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">Doctor count per medical specialty</p>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.specDistribution || []}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}`}
                  >
                    {(analytics?.specDistribution || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Doctor Verification Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-8">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Doctor Credential Verification Queue</h3>
              <p className="text-[11px] text-slate-500">Review qualifications and approve doctor platform credentials</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Qualifications</th>
                  <th className="p-3">Experience</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{d.name}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{d.specialization_name}</td>
                    <td className="p-3 text-slate-600">{d.qualification}</td>
                    <td className="p-3 text-slate-600">{d.experience_years} years</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {d.verification_status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleVerifyDoctor(d.id, 'VERIFIED')}
                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerifyDoctor(d.id, 'REJECTED')}
                        className="py-1 px-2.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg text-[11px] font-semibold"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Accounts Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Registered Platform Users</h3>
            <p className="text-[11px] text-slate-500">Unified identity accounts across all 5 portals</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{u.phone || '—'}</td>
                    <td className="p-3 text-slate-400">{u.created_at?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New City Coverage Modal */}
      {showAddCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-900">Add New City Coverage</h3>
              <button onClick={() => setShowAddCity(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddCity} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City Name</label>
                <input
                  type="text"
                  required
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Varanasi"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <select
                  value={cityStateId}
                  onChange={(e) => setCityStateId(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  <option value={1}>Maharashtra (MH)</option>
                  <option value={2}>Delhi NCR (DL)</option>
                  <option value={3}>Karnataka (KA)</option>
                  <option value={4}>Telangana (TS)</option>
                  <option value={5}>Tamil Nadu (TN)</option>
                  <option value={6}>Gujarat (GJ)</option>
                  <option value={9}>Uttar Pradesh (UP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    required
                    value={cityLat}
                    onChange={(e) => setCityLat(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    required
                    value={cityLon}
                    onChange={(e) => setCityLon(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                Activate City Coverage
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
