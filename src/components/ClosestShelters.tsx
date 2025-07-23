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

const ClosestShelters = () => {
  const [closest, setClosest] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(false);

  const findClosest = () => {
    setLoading(true);
    setClosest([]); // Clear previous results
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
      (error) => {
        console.error("Error getting user's location", error);
        setLoading(false);
        // Optionally, display an error message to the user
      }
    );
  };

  return (
    <div className="absolute bottom-5 right-5 z-[1000] bg-white p-4 rounded-lg shadow-2xl w-full max-w-sm">
      <button
        onClick={findClosest}
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400"
      >
        {loading ? 'Finding...' : 'Find 3 Closest Shelters'}
      </button>
      {closest.length > 0 && (
        <ul className="mt-4 space-y-3">
          {closest.map((shelter) => (
            <li key={shelter.id} className="border-b border-gray-200 pb-2">
              <p className="font-bold text-gray-800">{shelter.name}</p>
              <p className="text-sm text-gray-600">{shelter.address}</p>
              <p className="text-sm text-gray-600">{shelter.city}</p>
               <p className="text-xs text-blue-500 font-semibold mt-1">
                {(shelter.distance! / 1000).toFixed(2)} km away
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClosestShelters; 