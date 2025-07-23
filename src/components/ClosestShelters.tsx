'use client';

import { useState } from 'react';
import haversine from 'haversine-distance';
import sheltersData from '@/data/bomb_shelters_opencage_geocoded_20250603_103516.json';
import Image from 'next/image';

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
    <div className="absolute bottom-8 right-8 z-[1000] w-full max-w-sm">
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-2xl shadow-black/20">
        <button
          onClick={findClosest}
          disabled={loading}
          className="w-full flex items-center justify-center p-0 rounded-xl transition-all duration-300 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          {loading ? (
            <div className="flex h-[58px] w-[250px] items-center justify-center bg-gray-200 rounded-xl">
              <p className="text-lg font-bold text-gray-900">Finding...</p>
            </div>
          ) : (
            <Image
              src="/findclosest.png"
              alt="Find 3 closest shelters"
              width={250}
              height={58}
              className="rounded-xl"
              priority
            />
          )}
        </button>

        {error && <p className="mt-4 text-center text-red-600 font-semibold">{error}</p>}

        {closest.length > 0 && (
          <div className="mt-4 animate-fade-in overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
            <div className="bg-gray-900 py-3 px-5">
              <h2 className="text-center text-lg font-semibold text-white">
                3 closest shelters
              </h2>
            </div>
            <ul className="divide-y divide-gray-200 bg-white">
              {closest.map((shelter, index) => (
                <li
                  key={shelter.id}
                  className="px-5 py-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-blue-600 w-8">
                      {index + 1}
                    </span>
                    <div className="ml-2 flex-1">
                      <p className="text-base font-bold text-gray-900">{shelter.name}</p>
                      <p className="text-sm text-gray-600">{shelter.city ?? 'N/A'}</p>
                    </div>
                    <p className="text-sm font-semibold text-indigo-500 whitespace-nowrap">
                      {(shelter.distance! / 1000).toFixed(2)} km
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosestShelters; 