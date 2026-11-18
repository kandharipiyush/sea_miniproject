import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Heart, MapPin, Phone, Mail, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">Care<span className="text-emerald-400">Nex</span></span>
                <p className="text-xs text-slate-400">Smart Healthcare & Patient Management System</p>
              </div>
            </Link>

            <p className="mt-4 text-xs text-slate-400 leading-relaxed pr-6">
              CareNex connects patients, doctors, multi-branch hospitals, diagnostic labs, and pharmacies into one unified, location-intelligent healthcare network across India.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                DPDP Act Compliant (India)
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                Verified Facilities
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                EHR Encryption
              </span>
            </div>
          </div>

          {/* Quick Healthcare Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Patient Services</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/doctors" className="hover:text-emerald-400 transition-colors">Find Doctors by Specialization</Link></li>
              <li><Link to="/hospitals" className="hover:text-emerald-400 transition-colors">Nearby Hospitals & Branches</Link></li>
              <li><Link to="/map" className="hover:text-emerald-400 transition-colors">Interactive Healthcare Map</Link></li>
              <li><Link to="/diagnostics" className="hover:text-emerald-400 transition-colors">Diagnostic Tests & Home Collection</Link></li>
              <li><Link to="/pharmacies" className="hover:text-emerald-400 transition-colors">24x7 Verified Chemist Shops</Link></li>
              <li><Link to="/emergency" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors">Emergency Trauma & Ambulances</Link></li>
            </ul>
          </div>

          {/* Key Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Ecosystem Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/dashboard" className="hover:text-emerald-400 transition-colors">Patient Health Vault (EHR)</Link></li>
              <li><Link to="/doctor" className="hover:text-emerald-400 transition-colors">Doctor Consultation Console</Link></li>
              <li><Link to="/hospital-admin" className="hover:text-emerald-400 transition-colors">Hospital & Branch Admin</Link></li>
              <li><Link to="/diagnostic-admin" className="hover:text-emerald-400 transition-colors">Diagnostic Lab Management</Link></li>
              <li><Link to="/admin" className="hover:text-emerald-400 transition-colors">Super Admin Analytics</Link></li>
            </ul>
          </div>

          {/* Contact & Cities */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support & Coverage</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Mumbai, Kalyan, Thane, Navi Mumbai, Pune, Delhi, Bengaluru & 20+ Cities</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Emergency: 108 / 112 (National Helpline)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>support@carenex.demo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CareNex Healthcare Systems. All Rights Reserved. Built for high-reliability medical appointments and records.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400">Privacy Policy</span>
            <span className="hover:text-slate-400">Terms of Service</span>
            <span className="hover:text-slate-400">HIPAA & DPDP Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
