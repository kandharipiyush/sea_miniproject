import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, CheckCircle2, FileText, Upload } from 'lucide-react';
import { api, DiagnosticTest } from '../../services/api.js';

export const DiagnosticAdminDashboard: React.FC = () => {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      try {
        const res = await api.getDiagnosticTests();
        if (res.success) setTests(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-800 font-extrabold text-2xl flex items-center justify-center border border-purple-200 flex-shrink-0">
              🧪
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded">
                Pathology Laboratory Console
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                Metropolis Diagnostic Operations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Managing clinical pathology catalogue, home sample dispatch, and PDF report delivery.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Diagnostic Test Catalogue ({tests.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.slice(0, 15).map((t) => (
              <div key={t.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase">
                      {t.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{t.test_name}</h3>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">₹{t.price}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>Sample: {t.sample_type}</p>
                  <p>Turnaround: {t.turnaround_hours} Hours</p>
                  <p className="text-slate-400 truncate">Centre: {t.centre_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
