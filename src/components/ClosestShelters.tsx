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
}

const ClosestShelters = () => {
  const [closest, setClosest] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(false);

  const findClosest = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition((position) => {
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
          const distance = haversine(userLocation, shelterLocation);
          return { ...shelter, distance };
        })
        .sort((a, b) => a.distance - b.distance);

      setClosest(sortedShelters.slice(0, 3));
      setLoading(false);
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
      }}
    >
      <button onClick={findClosest} disabled={loading}>
        {loading ? 'Finding...' : 'Find 3 Closest Shelters'}
      </button>
      {closest.length > 0 && (
        <ul>
          {closest.map((shelter) => (
            <li key={shelter.id}>
              <b>{shelter.name}</b>
              <br />
              {shelter.address}
              <br />
              {shelter.city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClosestShelters; 