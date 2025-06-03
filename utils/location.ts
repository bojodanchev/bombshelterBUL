// utils/location.ts

import * as ExpoLocation from 'expo-location';
import { Coordinates, UserLocation } from '../types/shelter';

/**
 * Получава текущото местоположение на потребителя
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    // Проверяваме за разрешения
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return null;
    }

    // Получаваме текущото местоположение
    const location = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.High,
      maximumAge: 10000, // Кеш за 10 секунди
      timeout: 15000, // Timeout след 15 секунди
    });

    const coordinates: Coordinates = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    console.log('Current location obtained:', coordinates);
    return coordinates;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Получава подробна информация за местоположението
 */
export async function getCurrentLocationDetailed(): Promise<UserLocation | null> {
  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return null;
    }

    const location = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.High,
      maximumAge: 10000,
      timeout: 15000,
    });

    const userLocation: UserLocation = {
      coordinates: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      accuracy: location.coords.accuracy || 0,
      timestamp: location.timestamp,
    };

    return userLocation;
  } catch (error) {
    console.error('Error getting detailed location:', error);
    return null;
  }
}

/**
 * Наблюдава промените в местоположението
 */
export async function watchLocation(
  callback: (location: Coordinates) => void,
  errorCallback?: (error: any) => void
): Promise<ExpoLocation.LocationSubscription | null> {
  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return null;
    }

    const subscription = await ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 5000, // Обновява на всеки 5 секунди
        distanceInterval: 10, // Обновява при движение от 10 метра
      },
      (location) => {
        const coordinates: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        callback(coordinates);
      }
    );

    console.log('Location watching started');
    return subscription;
  } catch (error) {
    console.error('Error watching location:', error);
    if (errorCallback) {
      errorCallback(error);
    }
    return null;
  }
}

/**
 * Изчислява разстоянието между две точки в километри
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Радиус на Земята в км
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Изчислява bearing (посоката) между две точки в градуси
 */
export function calculateBearing(start: Coordinates, end: Coordinates): number {
  const dLon = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = Math.atan2(y, x);
  bearing = toDegrees(bearing);
  return (bearing + 360) % 360;
}

/**
 * Проверява дали координатите са в границите на България
 */
export function isInBulgaria(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates;
  return (
    latitude >= 41.2 &&
    latitude <= 44.2 &&
    longitude >= 22.3 &&
    longitude <= 28.6
  );
}

/**
 * Форматира координатите за показване
 */
export function formatCoordinates(
  coordinates: Coordinates,
  precision: number = 6
): string {
  return `${coordinates.latitude.toFixed(
    precision
  )}, ${coordinates.longitude.toFixed(precision)}`;
}

/**
 * Форматира разстоянието за показване
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} м`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} км`;
  } else {
    return `${Math.round(distanceKm)} км`;
  }
}

/**
 * Изчислява приблизителното време за пътуване
 */
export function calculateTravelTime(
  distanceKm: number,
  mode: 'walking' | 'driving' | 'cycling' = 'walking'
): number {
  // Времето в минути според начина на придвижване
  const speeds = {
    walking: 5, // км/ч
    cycling: 15, // км/ч
    driving: 40, // км/ч (средна скорост в града)
  };

  return Math.round((distanceKm / speeds[mode]) * 60);
}

/**
 * Форматира времето за пътуване
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}мин`;
  }
}

/**
 * Получава адрес от координати (reverse geocoding)
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<string | null> {
  try {
    const result = await ExpoLocation.reverseGeocodeAsync(coordinates);

    if (result && result.length > 0) {
      const address = result[0];
      const parts = [];

      if (address.street) parts.push(address.street);
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.city) parts.push(address.city);
      if (address.region) parts.push(address.region);

      return parts.join(', ') || 'Неизвестен адрес';
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Проверява дали location services са включени
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    return await ExpoLocation.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
}

/**
 * Получава последното известно местоположение от кеша
 */
export async function getLastKnownLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();

    if (status !== 'granted') {
      return null;
    }

    const location = await ExpoLocation.getLastKnownPositionAsync({
      maxAge: 300000, // 5 минути
      requiredAccuracy: 1000, // 1 км точност
    });

    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting last known location:', error);
    return null;
  }
}

/**
 * Намира най-близката точка от масив от координати
 */
export function findNearestPoint(
  userLocation: Coordinates,
  points: Coordinates[]
): { point: Coordinates; distance: number; index: number } | null {
  if (points.length === 0) return null;

  let nearestPoint = points[0];
  let nearestDistance = calculateDistance(userLocation, points[0]);
  let nearestIndex = 0;

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(userLocation, points[i]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = points[i];
      nearestIndex = i;
    }
  }

  return {
    point: nearestPoint,
    distance: nearestDistance,
    index: nearestIndex,
  };
}

/**
 * Създава bounding box около координати с даден радиус
 */
export function createBoundingBox(
  center: Coordinates,
  radiusKm: number
): [Coordinates, Coordinates] {
  // Приблизителни изчисления за България
  const latDelta = radiusKm / 111; // 1 градус ≈ 111 км
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(center.latitude)));

  const southwest: Coordinates = {
    latitude: center.latitude - latDelta,
    longitude: center.longitude - lonDelta,
  };

  const northeast: Coordinates = {
    latitude: center.latitude + latDelta,
    longitude: center.longitude + lonDelta,
  };

  return [southwest, northeast];
}

// Helper functions
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Валидира координати
 */
export function isValidCoordinates(
  coordinates: any
): coordinates is Coordinates {
  return (
    typeof coordinates === 'object' &&
    coordinates !== null &&
    typeof coordinates.latitude === 'number' &&
    typeof coordinates.longitude === 'number' &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

/**
 * Нормализира координати (ограничава в валидни граници)
 */
export function normalizeCoordinates(coordinates: Coordinates): Coordinates {
  return {
    latitude: Math.max(-90, Math.min(90, coordinates.latitude)),
    longitude: Math.max(-180, Math.min(180, coordinates.longitude)),
  };
}
