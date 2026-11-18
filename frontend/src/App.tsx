import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { LoginModal } from './components/LoginModal.js';
import { HomePage } from './pages/HomePage.js';
import { DoctorSearchPage } from './pages/DoctorSearchPage.js';
import { HospitalSearchPage } from './pages/HospitalSearchPage.js';
import { MapPage } from './pages/MapPage.js';
import { EmergencyPage } from './pages/EmergencyPage.js';
import { DiagnosticsPage } from './pages/DiagnosticsPage.js';
import { PharmaciesPage } from './pages/PharmaciesPage.js';
import { PatientDashboard } from './pages/dashboards/PatientDashboard.js';
import { DoctorDashboard } from './pages/dashboards/DoctorDashboard.js';
import { HospitalAdminDashboard } from './pages/dashboards/HospitalAdminDashboard.js';
import { DiagnosticAdminDashboard } from './pages/dashboards/DiagnosticAdminDashboard.js';
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard.js';
import { AuthProvider } from './context/AuthContext.js';
import { LocationProvider } from './context/LocationContext.js';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/doctors" element={<DoctorSearchPage />} />
                <Route path="/hospitals" element={<HospitalSearchPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/emergency" element={<EmergencyPage />} />
                <Route path="/diagnostics" element={<DiagnosticsPage />} />
                <Route path="/pharmacies" element={<PharmaciesPage />} />
                <Route path="/dashboard" element={<PatientDashboard />} />
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/hospital-admin" element={<HospitalAdminDashboard />} />
                <Route path="/diagnostic-admin" element={<DiagnosticAdminDashboard />} />
                <Route path="/admin" element={<SuperAdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <LoginModal />
          </div>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
