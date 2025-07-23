'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import haversine from 'haversine-distance';
import ClosestBunkers from '@/components/ClosestBunkers';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
});

interface Location {
  latitude: number;
  longitude: number;
}

export default function Home() {
  const [bunkers, setBunkers] = useState([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [closestBunkers, setClosestBunkers] = useState([]);

  useEffect(() => {
    // Fetch bunker data
    fetch('/bunkers.json')
      .then((res) => res.json())
      .then((data) => {
        setBunkers(data.shelters);
      });

    // Get user location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(location);
      },
      (err) => {
        console.error('Error getting user location:', err);
      }
    );
  }, []);

  useEffect(() => {
    if (userLocation && bunkers.length > 0) {
      const sortedBunkers = [...bunkers]
        .map((bunker: any) => ({
          ...bunker,
          distance: haversine(userLocation, {
            latitude: bunker.latitude,
            longitude: bunker.longitude,
          }),
        }))
        .sort((a: any, b: any) => a.distance - b.distance);
      setClosestBunkers(sortedBunkers.slice(0, 3));
    }
  }, [userLocation, bunkers]);

  return (
    <main>
      <MapView bunkers={bunkers} userLocation={userLocation} />
      <ClosestBunkers bunkers={closestBunkers} />
    </main>
  );
} 