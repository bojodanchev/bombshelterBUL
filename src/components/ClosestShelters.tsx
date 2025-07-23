'use client';

import { useState } from 'react';
import haversine from 'haversine-distance';
import sheltersData from '@/data/bomb_shelters_opencage_geocoded_20250603_103516.json';

interface Shelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string | null;
  distance?: number;
}

const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClosestShelters = () => {
  const [closest, setClosest] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findClosest = () => {
    setLoading(true);
    setClosest([]);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const sortedShelters = [...sheltersData.shelters]
          .map((shelter) => {
            const shelterLocation = {
              latitude: shelter.latitude,
              longitude: shelter.longitude,
            };
            const distance = haversine(userLocation, shelterLocation); // in meters
            return { ...shelter, distance };
          })
          .sort((a, b) => a.distance - b.distance);

        setClosest(sortedShelters.slice(0, 3));
        setLoading(false);
      },
      (err) => {
        console.error("Error getting user's location", err);
        setError('Could not get your location. Please enable location services and try again.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="absolute bottom-8 right-8 z-[1000] bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-black/20 w-full max-w-md">
      <button
        onClick={findClosest}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <LocationIcon />
        {loading ? 'Finding...' : 'Find 3 Closest Shelters'}
      </button>

      {error && <p className="mt-4 text-center text-red-600 font-semibold">{error}</p>}

      {closest.length > 0 && (
        <div className="mt-4 animate-fade-in">
          <h2 className="text-lg font-bold text-gray-900 mb-3 text-center">Closest Shelters</h2>
          <ul className="space-y-2">
            {closest.map((shelter, index) => (
              <li
                key={shelter.id}
                className="bg-gray-50/80 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="font-bold text-gray-800">{shelter.name}</p>
                <p className="text-sm text-gray-600">{shelter.address}</p>
                <p className="text-sm text-gray-600">{shelter.city}</p>
                <p className="text-sm text-indigo-600 font-semibold mt-1">
                  {(shelter.distance! / 1000).toFixed(2)} km away
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClosestShelters; 