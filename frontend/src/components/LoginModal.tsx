import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, login, quickSwitch } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        // Registration
        await login(email, password); // or api.register
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);
    try {
      await quickSwitch(role);
      setShowLoginModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isRegister ? 'Create CareNex Account' : 'Sign in to CareNex'}
            </h3>
            <p className="text-xs text-slate-500">Access your healthcare appointments & medical records</p>
          </div>
          <button
            onClick={() => setShowLoginModal(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Instant Demo Account Launcher (1-Click)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('patient')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all text-center"
              >
                👤 Patient
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('doctor')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all text-center"
              >
                👨‍⚕️ Doctor
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('hospital_admin')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all text-center"
              >
                🏥 Hospital Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('diagnostic_admin')}
                className="py-1.5 px-2 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all text-center"
              >
                🧪 Diagnostic
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('super_admin')}
                className="col-span-2 sm:col-span-2 py-1.5 px-2 bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-slate-700 text-[11px] font-semibold rounded-lg shadow-2xs transition-all text-center"
              >
                👑 Super Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@carenex.demo"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors mt-2"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
