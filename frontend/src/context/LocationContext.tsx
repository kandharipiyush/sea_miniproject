import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, City } from '../services/api.js';

interface LocationContextType {
  cities: City[];
  selectedCity: City | null;
  setSelectedCity: (city: City) => void;
  coordinates: { lat: number; lon: number } | null;
  gpsEnabled: boolean;
  gpsLoading: boolean;
  locality: string;
  pincode: string;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  detectLocation: () => Promise<void>;
  selectCityById: (cityId: number) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locality, setLocality] = useState('Chembur / Central');
  const [pincode, setPincode] = useState('400071');
  const [radiusKm, setRadiusKm] = useState(10);

  useEffect(() => {
    async function loadCities() {
      try {
        const res = await api.getCities();
        if (res.success && res.data.length > 0) {
          setCities(res.data);
          // Default to Mumbai (or Kalyan)
          const defaultCity = res.data.find((c) => c.name === 'Mumbai') || res.data[0];
          setSelectedCity(defaultCity);
          setCoordinates({ lat: defaultCity.latitude, lon: defaultCity.longitude });
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
      }
    }
    loadCities();
  }, []);

  const selectCityById = (cityId: number) => {
    const city = cities.find((c) => c.id === cityId);
    if (city) {
      setSelectedCity(city);
      setCoordinates({ lat: city.latitude, lon: city.longitude });
      setLocality(`Central ${city.name}`);
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoordinates({ lat, lon });
        setGpsEnabled(true);

        try {
          const res = await api.detectLocation(lat, lon);
          if (res.success && res.data) {
            setSelectedCity(res.data.detectedCity);
            setLocality(res.data.suggestedLocality);
            setPincode(res.data.pincode);
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err.message);
        setGpsEnabled(false);
        setGpsLoading(false);
        // Fallback: keep existing selected city
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <LocationContext.Provider
      value={{
        cities,
        selectedCity,
        setSelectedCity: (city) => {
          setSelectedCity(city);
          setCoordinates({ lat: city.latitude, lon: city.longitude });
          setLocality(`Central ${city.name}`);
        },
        coordinates,
        gpsEnabled,
        gpsLoading,
        locality,
        pincode,
        radiusKm,
        setRadiusKm,
        detectLocation,
        selectCityById,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
