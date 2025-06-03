// types/shelter.ts

export interface Shelter {
  id: string;
  name: string;
  address: string;
  operator: string;
  type: string;
  category: string;
  latitude: number;
  longitude: number;
  confidence: number;
  short_category: string;
  city: string;
  has_coordinates: boolean;
  distance?: number; // в км от потребителя
}

// Преименувам Location на Coordinates за да избегна конфликт с expo-location
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocation {
  coordinates: Coordinates;
  accuracy: number;
  timestamp: number;
}

export interface ShelterWithDistance extends Shelter {
  distance: number; // в км
}

export interface SearchFilters {
  maxDistance?: number;
  type?: string;
  category?: string;
  city?: string;
}

// Emergency contacts
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

// App settings
export interface AppSettings {
  enableNotifications: boolean;
  enableVoiceNavigation: boolean;
  preferredLanguage: 'bg' | 'en';
  maxSearchDistance: number;
  autoDownloadMaps: boolean;
  emergencyContacts: EmergencyContact[];
}
