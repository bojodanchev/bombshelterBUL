'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ClosestBunkers from '@/components/ClosestBunkers';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
});

function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
    if (userLocation && bunkers.length > 0 && !bunkers[0].distance) {
      const sortedBunkers = bunkers
        .map((b) => ({
          ...b,
          distance: getDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance);

      const topThree = sortedBunkers.slice(0, 3);
      setClosestBunkers(topThree);

      const closestIds = new Set(topThree.map((b) => b.id));
      const finalBunkers = sortedBunkers.map((b) => ({
        ...b,
        isClosest: closestIds.has(b.id),
      }));
      setBunkers(finalBunkers);
    }
  }, [userLocation, bunkers]);

  return (
    <main>
      <MapView bunkers={bunkers} userLocation={userLocation} />
      <ClosestBunkers bunkers={closestBunkers} />
    </main>
  );
} 