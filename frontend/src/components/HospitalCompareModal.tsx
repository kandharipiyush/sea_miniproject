import React, { useEffect, useState } from 'react';
import { X, Check, AlertCircle, Building2, ShieldAlert, Award, Stethoscope, Navigation } from 'lucide-react';
import { api, HospitalBranch } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';

interface HospitalCompareModalProps {
  branchIds: string[];
  onClose: () => void;
  onRemoveBranch: (branchId: string) => void;
}

export const HospitalCompareModal: React.FC<HospitalCompareModalProps> = ({
  branchIds,
  onClose,
  onRemoveBranch,
}) => {
  const { coordinates } = useLocation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompare() {
      if (branchIds.length === 0) return;
      setLoading(true);
      try {
        const res = await api.compareHospitals(branchIds, coordinates?.lat, coordinates?.lon);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to compare hospitals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompare();
  }, [branchIds, coordinates]);

  if (branchIds.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
              Side-by-Side Comparison
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Compare Hospitals & Facilities ({data.length} Selected)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading comparison metrics...</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No hospitals selected for comparison.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 font-bold text-slate-400 uppercase tracking-wider w-40">Criteria</th>
                    {data.map((h) => (
                      <th key={h.id} className="p-3 font-bold text-slate-900 min-w-[200px] align-top">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-sm font-extrabold text-slate-900 leading-tight">
                            {h.branch_name}
                          </span>
                          <button
                            onClick={() => onRemoveBranch(h.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                          {h.hospital_type}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Distance */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600">Distance</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3 font-bold text-emerald-700">
                        {h.distance_km > 0 ? `${h.distance_km} km away` : 'Selected city area'}
                      </td>
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600">Patient Rating</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3 text-slate-800">
                        ⭐ {h.hospital_rating} ({h.hospital_reviews} reviews)
                      </td>
                    ))}
                  </tr>

                  {/* Emergency Services */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600">24x7 Emergency</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3">
                        {h.emergency_service === 1 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            <Check className="w-3.5 h-3.5" /> Verified 24x7 ICU
                          </span>
                        ) : (
                          <span className="text-slate-400">Daycare Only</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Fee Range */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600">Doctor Fees</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3 font-bold text-slate-900">
                        {h.fee_range}
                      </td>
                    ))}
                  </tr>

                  {/* Doctor Count */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600">Available Doctors</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3 font-bold text-slate-800">
                        {h.doctor_count} Specialists on Duty
                      </td>
                    ))}
                  </tr>

                  {/* Departments */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600 align-top">Key Departments</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {h.departments?.slice(0, 5).map((d: string) => (
                            <span key={d} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Operating Hours */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600">Operating Hours</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3 text-slate-700">
                        {h.operating_hours || '24x7'}
                      </td>
                    ))}
                  </tr>

                  {/* Facilities */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-600 align-top">Key Facilities</td>
                    {data.map((h) => (
                      <td key={h.id} className="p-3 text-slate-600 text-[11px] leading-relaxed align-top">
                        {h.facilities || 'ICU, Operation Theatre, Pharmacy'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
