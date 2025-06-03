// utils/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Shelter,
  Coordinates,
  AppSettings,
  EmergencyContact,
  ShelterDataFile,
} from '../types/shelter';

// Storage keys
const STORAGE_KEYS = {
  SHELTERS: '@BombShelterApp:shelters',
  USER_SETTINGS: '@BombShelterApp:settings',
  LAST_LOCATION: '@BombShelterApp:lastLocation',
  EMERGENCY_CONTACTS: '@BombShelterApp:emergencyContacts',
  SEARCH_HISTORY: '@BombShelterApp:searchHistory',
  FAVORITE_SHELTERS: '@BombShelterApp:favoriteShelters',
  LAST_UPDATE: '@BombShelterApp:lastUpdate',
  APP_VERSION: '@BombShelterApp:appVersion',
};

// ==================== SHELTERS ====================

export async function saveShelters(shelters: Shelter[]): Promise<void> {
  try {
    const data = {
      shelters,
      timestamp: Date.now(),
      count: shelters.length,
      version: '1.0',
    };

    await AsyncStorage.setItem(STORAGE_KEYS.SHELTERS, JSON.stringify(data));
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_UPDATE,
      new Date().toISOString()
    );
    console.log(`Запазени ${shelters.length} убежища в AsyncStorage`);
  } catch (error) {
    console.error('Error saving shelters:', error);
    throw error;
  }
}

export async function getShelters(): Promise<Shelter[]> {
  try {
    const sheltersJson = await AsyncStorage.getItem(STORAGE_KEYS.SHELTERS);

    if (!sheltersJson) {
      console.log('Няма запазени убежища, връщам празен масив');
      return [];
    }

    const data = JSON.parse(sheltersJson);

    // Проверяваме дали данните не са твърде стари (30 дни)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дни
    if (data.timestamp && Date.now() - data.timestamp > maxAge) {
      console.log('Данните за убежища са остарели');
      return [];
    }

    const shelters = data.shelters || [];
    console.log(`Заредени ${shelters.length} убежища от AsyncStorage`);

    // Валидираме данните
    const validShelters = shelters.filter(
      (shelter: any) =>
        shelter &&
        typeof shelter.id === 'string' &&
        typeof shelter.name === 'string' &&
        typeof shelter.latitude === 'number' &&
        typeof shelter.longitude === 'number'
    );

    console.log(
      `${validShelters.length} валидни убежища от ${shelters.length} общо`
    );
    return validShelters;
  } catch (error) {
    console.error('Error getting shelters:', error);
    return [];
  }
}

export async function getLastUpdate(): Promise<Date | null> {
  try {
    const lastUpdate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
    return lastUpdate ? new Date(lastUpdate) : null;
  } catch (error) {
    console.error('Error getting last update:', error);
    return null;
  }
}

/**
 * Импортира убежища от JSON файл (OpenCage данни)
 */
export async function importSheltersFromJson(
  jsonData: ShelterDataFile
): Promise<Shelter[]> {
  try {
    console.log('Започвам импорт на данни...');

    if (!jsonData || !jsonData.shelters || !Array.isArray(jsonData.shelters)) {
      throw new Error('Невалиден формат на JSON данни');
    }

    const rawShelters = jsonData.shelters;
    const validShelters: Shelter[] = [];
    let skippedCount = 0;

    for (const rawShelter of rawShelters) {
      try {
        // Конвертираме raw данните към Shelter формат
        const shelter = convertRawShelterData(rawShelter);
        if (shelter) {
          validShelters.push(shelter);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.warn('Пропускам невалиден запис:', rawShelter, error);
        skippedCount++;
      }
    }

    console.log(
      `Импорт завършен: ${validShelters.length} валидни, ${skippedCount} пропуснати`
    );

    // Запазваме в storage
    await saveShelters(validShelters);

    return validShelters;
  } catch (error) {
    console.error('Грешка при импорт на данни:', error);
    throw error;
  }
}

/**
 * Конвертира raw данни от JSON към Shelter обект
 */
function convertRawShelterData(raw: any): Shelter | null {
  try {
    // Проверяваме задължителните полета
    if (!raw || !raw.id || !raw.name || !raw.latitude || !raw.longitude) {
      return null;
    }

    // Валидираме координатите
    const lat = Number(raw.latitude);
    const lon = Number(raw.longitude);

    if (
      isNaN(lat) ||
      isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return null;
    }

    // Създаваме shelter обекта
    const shelter: Shelter = {
      id: String(raw.id),
      name: String(raw.name || 'Неизвестно име').trim(),
      address: String(raw.address || 'Неизвестен адрес').trim(),
      operator: String(raw.operator || 'Неизвестен оператор').trim(),
      type: String(raw.type || 'Скривалище').trim(),
      category: String(
        raw.category || raw.short_category || 'Неопределена'
      ).trim(),
      latitude: lat,
      longitude: lon,
      confidence: Number(raw.confidence) || 0,
      short_category: String(
        raw.short_category || raw.category || 'Неопределена'
      ).trim(),
      city: extractCity(raw.city || raw.address || ''),
      has_coordinates: true,

      // Допълнителни полета от геокодирането
      geocoding_status: raw.geocoding_status,
      formatted_address: raw.formatted_address,
      opencage_formatted_address: raw.opencage_formatted_address,
      formatted_query: raw.formatted_query,
    };

    return shelter;
  } catch (error) {
    console.error('Грешка при конвертиране на shelter данни:', error);
    return null;
  }
}

/**
 * Извлича града от адрес
 */
function extractCity(cityOrAddress: string): string {
  if (!cityOrAddress) return 'Неизвестен град';

  const str = String(cityOrAddress).trim();

  // Ако започва с "гр.", извличаме града
  const cityMatch = str.match(/гр\.\s*([^,]+)/i);
  if (cityMatch) {
    return cityMatch[1].trim();
  }

  // Ако е само име на град
  if (!str.includes(',') && str.length < 50) {
    return str;
  }

  // Опитваме се да извлечем първата част преди запетая
  const parts = str.split(',');
  if (parts.length > 0) {
    const firstPart = parts[0].trim();
    return firstPart.replace(/^гр\.\s*/i, '');
  }

  return str;
}

// ==================== LOCATION ====================

export async function saveLastLocation(location: Coordinates): Promise<void> {
  try {
    const locationData = {
      ...location,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_LOCATION,
      JSON.stringify(locationData)
    );
  } catch (error) {
    console.error('Error saving location:', error);
  }
}

export async function getLastLocation(): Promise<Coordinates | null> {
  try {
    const locationJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOCATION);

    if (!locationJson) {
      return null;
    }

    const data = JSON.parse(locationJson);

    // Проверяваме дали локацията не е твърде стара (1 час)
    const maxAge = 60 * 60 * 1000;
    if (data.timestamp && Date.now() - data.timestamp > maxAge) {
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

// ==================== SETTINGS ====================

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS,
      JSON.stringify(settings)
    );
    console.log('Настройките са запазени');
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);

    if (!settingsJson) {
      return getDefaultSettings();
    }

    const settings = JSON.parse(settingsJson);

    // Merge с default настройки за добавени полета
    return {
      ...getDefaultSettings(),
      ...settings,
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return getDefaultSettings();
  }
}

function getDefaultSettings(): AppSettings {
  return {
    enableNotifications: true,
    enableVoiceNavigation: true,
    preferredLanguage: 'bg',
    maxSearchDistance: 10,
    autoDownloadMaps: true,
    emergencyContacts: [],
  };
}

// ==================== EMERGENCY CONTACTS ====================

export async function saveEmergencyContacts(
  contacts: EmergencyContact[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.EMERGENCY_CONTACTS,
      JSON.stringify(contacts)
    );
    console.log(`Запазени ${contacts.length} аварийни контакта`);
  } catch (error) {
    console.error('Error saving emergency contacts:', error);
    throw error;
  }
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    const contactsJson = await AsyncStorage.getItem(
      STORAGE_KEYS.EMERGENCY_CONTACTS
    );
    return contactsJson ? JSON.parse(contactsJson) : [];
  } catch (error) {
    console.error('Error getting emergency contacts:', error);
    return [];
  }
}

// ==================== SEARCH HISTORY ====================

export async function addSearchToHistory(query: string): Promise<void> {
  try {
    const history = await getSearchHistory();

    // Премахваме дублиращи се записи
    const filteredHistory = history.filter((item) => item !== query);

    // Добавяме новото търсене в началото
    const newHistory = [query, ...filteredHistory].slice(0, 20); // Максимум 20 записа

    await AsyncStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify(newHistory)
    );
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
}

export async function getSearchHistory(): Promise<string[]> {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

// ==================== FAVORITES ====================

export async function addFavoriteShelter(shelterId: string): Promise<void> {
  try {
    const favorites = await getFavoriteShelters();

    if (!favorites.includes(shelterId)) {
      favorites.push(shelterId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVORITE_SHELTERS,
        JSON.stringify(favorites)
      );
    }
  } catch (error) {
    console.error('Error adding favorite shelter:', error);
  }
}

export async function removeFavoriteShelter(shelterId: string): Promise<void> {
  try {
    const favorites = await getFavoriteShelters();
    const filteredFavorites = favorites.filter((id) => id !== shelterId);

    await AsyncStorage.setItem(
      STORAGE_KEYS.FAVORITE_SHELTERS,
      JSON.stringify(filteredFavorites)
    );
  } catch (error) {
    console.error('Error removing favorite shelter:', error);
  }
}

export async function getFavoriteShelters(): Promise<string[]> {
  try {
    const favoritesJson = await AsyncStorage.getItem(
      STORAGE_KEYS.FAVORITE_SHELTERS
    );
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  } catch (error) {
    console.error('Error getting favorite shelters:', error);
    return [];
  }
}

export async function isFavoriteShelter(shelterId: string): Promise<boolean> {
  try {
    const favorites = await getFavoriteShelters();
    return favorites.includes(shelterId);
  } catch (error) {
    console.error('Error checking favorite shelter:', error);
    return false;
  }
}

// ==================== UTILITY ====================

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    console.log('Всички данни са изчистени');
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

export async function getStorageSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;

    for (const key of keys) {
      if (key.startsWith('@BombShelterApp:')) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
}

// ==================== SHELTER UTILITIES ====================

/**
 * Филтрира убежища според дадени критерии
 */
export function filterShelters(
  shelters: Shelter[],
  filters: {
    maxDistance?: number;
    type?: string;
    category?: string;
    city?: string;
  }
): Shelter[] {
  return shelters.filter((shelter) => {
    if (
      filters.maxDistance &&
      shelter.distance &&
      shelter.distance > filters.maxDistance
    ) {
      return false;
    }

    if (filters.type && shelter.type !== filters.type) {
      return false;
    }

    if (filters.category && shelter.category !== filters.category) {
      return false;
    }

    if (filters.city && shelter.city !== filters.city) {
      return false;
    }

    return true;
  });
}

/**
 * Търси убежища по текст
 */
export function searchShelters(shelters: Shelter[], query: string): Shelter[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return shelters;
  }

  return shelters.filter(
    (shelter) =>
      shelter.name.toLowerCase().includes(normalizedQuery) ||
      shelter.address.toLowerCase().includes(normalizedQuery) ||
      shelter.city.toLowerCase().includes(normalizedQuery) ||
      shelter.operator.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Сортира убежища по разстояние
 */
export function sortSheltersByDistance(shelters: Shelter[]): Shelter[] {
  return shelters.sort((a, b) => {
    const distanceA = a.distance || 0;
    const distanceB = b.distance || 0;
    return distanceA - distanceB;
  });
}

/**
 * Групира убежища по град
 */
export function groupSheltersByCity(
  shelters: Shelter[]
): Record<string, Shelter[]> {
  return shelters.reduce((groups, shelter) => {
    const city = shelter.city || 'Неизвестен град';
    if (!groups[city]) {
      groups[city] = [];
    }
    groups[city].push(shelter);
    return groups;
  }, {} as Record<string, Shelter[]>);
}

/**
 * Получава статистики за убежищата
 */
export function getShelterStatistics(shelters: Shelter[]): {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byCity: Record<string, number>;
  withCoordinates: number;
  averageConfidence: number;
} {
  const byType: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  let withCoordinates = 0;
  let totalConfidence = 0;

  shelters.forEach((shelter) => {
    // По тип
    byType[shelter.type] = (byType[shelter.type] || 0) + 1;

    // По категория
    byCategory[shelter.category] = (byCategory[shelter.category] || 0) + 1;

    // По град
    byCity[shelter.city] = (byCity[shelter.city] || 0) + 1;

    // С координати
    if (shelter.has_coordinates) {
      withCoordinates++;
    }

    // Средна точност
    totalConfidence += shelter.confidence || 0;
  });

  return {
    total: shelters.length,
    byType,
    byCategory,
    byCity,
    withCoordinates,
    averageConfidence:
      shelters.length > 0 ? totalConfidence / shelters.length : 0,
  };
}
