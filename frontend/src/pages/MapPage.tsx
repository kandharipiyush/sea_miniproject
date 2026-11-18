import React, { useState } from 'react';
import { InteractiveMap } from '../components/InteractiveMap.js';
import { BookingModal } from '../components/BookingModal.js';
import { Doctor, HospitalBranch } from '../services/api.js';
import { useLocation } from '../context/LocationContext.js';
import { MapPin, Navigation, Crosshair } from 'lucide-react';

export const MapPage: React.FC = () => {
  const { selectedCity, detectLocation, gpsLoading, locality } = useLocation();
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingBranch, setBookingBranch] = useState<HospitalBranch | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600" />
              Interactive Healthcare Discovery Map
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live location-based discovery in {selectedCity?.name} ({locality || 'Central Area'}). Click any facility marker to inspect departments, distance, and practicing specialists.
            </p>
          </div>

          <button
            onClick={detectLocation}
            disabled={gpsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Detecting Location...' : 'Detect My GPS Location'}</span>
          </button>
        </div>

        <InteractiveMap
          heightClass="h-[720px]"
          onSelectDoctorForBooking={(doc, branch) => {
            setBookingDoctor(doc);
            setBookingBranch(branch);
          }}
        />
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          branch={bookingBranch}
          onClose={() => {
            setBookingDoctor(null);
            setBookingBranch(null);
          }}
        />
      )}
    </div>
  );
};
