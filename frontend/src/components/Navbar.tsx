import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import {
  Activity,
  MapPin,
  Crosshair,
  ShieldAlert,
  Calendar,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Stethoscope,
  Building2,
  Map as MapIcon,
  FlaskConical,
  Pill,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useLocation } from '../context/LocationContext.js';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitch, setShowLoginModal } = useAuth();
  const { cities, selectedCity, selectCityById, detectLocation, gpsLoading, gpsEnabled, locality } = useLocation();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useRouterLocation();

  const handleRoleSwitch = async (role: string) => {
    setRoleDropdownOpen(false);
    await quickSwitch(role);
    // Navigate to role-specific dashboard
    if (role === 'doctor') navigate('/doctor');
    else if (role === 'hospital_admin') navigate('/hospital-admin');
    else if (role === 'diagnostic_admin') navigate('/diagnostic-admin');
    else if (role === 'super_admin') navigate('/admin');
    else navigate('/dashboard');
  };

  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'doctor': return '/doctor';
      case 'hospital_admin': return '/hospital-admin';
      case 'diagnostic_admin': return '/diagnostic-admin';
      case 'super_admin': return '/admin';
      default: return '/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Top emergency & live bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              CareNex Multi-City Network Active
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-300">
              Coverage across 20+ Indian Cities & 200+ Verified Hospital Branches
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/emergency"
              className="flex items-center gap-1.5 text-rose-400 font-semibold hover:text-rose-300 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
              <span>24x7 Emergency Trauma & Ambulance: 108 / 112</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold tracking-tight text-slate-900">Care<span className="text-emerald-600">Nex</span></span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase">Health</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none">Smart Healthcare Ecosystem</p>
            </div>
          </Link>

          {/* City & GPS Location Selector */}
          <div className="relative">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 text-slate-700 text-sm transition-all"
            >
              <MapPin className={`w-4 h-4 ${gpsEnabled ? 'text-emerald-600' : 'text-slate-500'}`} />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">City / Area</p>
                <p className="font-semibold text-slate-800 leading-tight">
                  {selectedCity?.name || 'Select City'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-100">
                  <button
                    onClick={() => {
                      detectLocation();
                      setCityDropdownOpen(false);
                    }}
                    disabled={gpsLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>{gpsLoading ? 'Detecting GPS Location...' : 'Use My Exact Location (GPS)'}</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-1.5">
                    {locality ? `Current: ${locality}` : 'Reverse geocodes to nearest hospitals'}
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supported Cities</p>
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        selectCityById(city.id);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                        selectedCity?.id === city.id
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-left">
                        <span className="block font-medium">{city.name}</span>
                        <span className="text-[10px] text-slate-400">{city.state_name}</span>
                      </div>
                      <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
                        {city.branch_count} Branches
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              to="/doctors"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/doctors' ? 'text-emerald-600 bg-emerald-50 font-semibold' : 'hover:text-emerald-600 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Find Doctors</span>
            </Link>

            <Link
              to="/hospitals"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/hospitals' ? 'text-emerald-600 bg-emerald-50 font-semibold' : 'hover:text-emerald-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Find Hospitals</span>
            </Link>

            <Link
              to="/map"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/map' ? 'text-emerald-600 bg-emerald-50 font-semibold' : 'hover:text-emerald-600 hover:bg-slate-100'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Healthcare Map</span>
            </Link>

            <Link
              to="/diagnostics"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/diagnostics' ? 'text-emerald-600 bg-emerald-50 font-semibold' : 'hover:text-emerald-600 hover:bg-slate-100'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Lab Tests</span>
            </Link>

            <Link
              to="/pharmacies"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/pharmacies' ? 'text-emerald-600 bg-emerald-50 font-semibold' : 'hover:text-emerald-600 hover:bg-slate-100'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Pharmacies</span>
            </Link>
          </nav>

          {/* Role Quick Switcher & User Profile */}
          <div className="flex items-center gap-2">
            {/* Quick Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold hover:border-emerald-400 transition-all shadow-sm"
                title="Switch portal role instantly for demo testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="capitalize">Portal: {user?.role ? user.role.replace('_', ' ') : 'Patient'}</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in">
                  <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Role Switch (Demo)
                  </p>
                  {[
                    { role: 'patient', label: 'Patient Portal', desc: 'Rahul Sharma (Patient)', icon: '👤' },
                    { role: 'doctor', label: 'Doctor Portal', desc: 'Dr. Priya Desai (MD)', icon: '👨‍⚕️' },
                    { role: 'hospital_admin', label: 'Hospital Admin', desc: 'Apex Healthcare Org', icon: '🏥' },
                    { role: 'diagnostic_admin', label: 'Diagnostic Admin', desc: 'Metropolis Lab Director', icon: '🧪' },
                    { role: 'super_admin', label: 'Super Admin', desc: 'Complete Ecosystem Control', icon: '👑' },
                  ].map((item) => (
                    <button
                      key={item.role}
                      onClick={() => handleRoleSwitch(item.role)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2.5 ${
                        user?.role === item.role ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dashboard / User Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 hover:border-slate-300 bg-white shadow-sm"
                >
                  <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden sm:inline">
                    {user.full_name}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs overflow-hidden border border-emerald-200">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user.full_name.charAt(0)
                    )}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in">
                    <div className="p-3 border-b border-slate-100">
                      <p className="font-semibold text-xs text-slate-900">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>My Dashboard & Portal</span>
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
