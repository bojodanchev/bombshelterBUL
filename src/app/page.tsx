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

interface Bunker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string | null;
  distance?: number;
  isClosest?: boolean;
}

export default function Home() {
  const [bunkers, setBunkers] = useState<Bunker[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [closestBunkers, setClosestBunkers] = useState<Bunker[]>([]);
  const [distancesCalculated, setDistancesCalculated] = useState(false);

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
    if (userLocation && bunkers.length > 0 && !distancesCalculated) {
      const bunkersWithDistance = bunkers.map((bunker) => ({
        ...bunker,
        distance: haversine(userLocation, {
          latitude: bunker.latitude,
          longitude: bunker.longitude,
        }),
      }));

      const sortedBunkers = [...bunkersWithDistance].sort(
        (a, b) => a.distance! - b.distance!
      );

      const closestBunkerIds = sortedBunkers.slice(0, 3).map((b) => b.id);

      const finalBunkers = sortedBunkers.map((b) => ({
        ...b,
        isClosest: closestBunkerIds.includes(b.id),
      }));

      setBunkers(finalBunkers);
      setClosestBunkers(finalBunkers.slice(0, 3));
      setDistancesCalculated(true);
    }
  }, [userLocation, bunkers, distancesCalculated]);

  return (
    <main>
      <MapView bunkers={bunkers} userLocation={userLocation} />
      <ClosestBunkers bunkers={closestBunkers} />
    </main>
  );
} 