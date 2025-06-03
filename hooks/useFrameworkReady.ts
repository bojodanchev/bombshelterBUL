// hooks/useFrameworkReady.ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { getShelters, importSheltersFromJson } from '../utils/storage';

// Импортираме JSON данните - проверете дали пътят е правилен
let sheltersData: any = null;
try {
  sheltersData = require('../assets/data/bomb_shelters_opencage_geocoded_20250603_103516.json');
} catch (error) {
  console.warn('JSON файлът не може да бъде зареден:', error);
}

// Предотвратяваме автоматично скриване на splash screen
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore error if splash screen is already hidden
});

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Започвам подготовка на приложението...');

        // Проверяваме дали имаме данни за убежища
        let shelters = await getShelters();

        // Ако няма данни, импортираме от JSON файла
        if (shelters.length === 0 && sheltersData) {
          console.log('📂 Няма запазени данни, импортирам от JSON файла...');
          try {
            shelters = await importSheltersFromJson(sheltersData);
            console.log(
              `✅ Импортирани ${shelters.length} убежища при първо стартиране`
            );
          } catch (error) {
            console.error('❌ Грешка при импорт на данни:', error);
            // Приложението ще работи без данни
          }
        } else if (shelters.length > 0) {
          console.log(`📊 Заредени ${shelters.length} убежища от storage`);
        } else {
          console.warn('⚠️ Няма JSON файл и няма запазени данни');
        }

        // Малко изчакване за да се заредят всички ресурси
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error('❌ Грешка при подготовка на приложението:', error);
      } finally {
        // Маркираме приложението като готово
        setIsReady(true);
        console.log('✅ Приложението е готово');
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    // Скриваме splash screen когато приложението е готово
    if (isReady) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          // Splash screen може вече да е скрит
          console.log('Splash screen вече е скрит');
        }
      };

      // Малко закъснение за плавен преход
      setTimeout(hideSplash, 100);
    }
  }, [isReady]);

  return isReady;
}

/**
 * Hook за проверка на състоянието на данните
 */
export function useDataStatus() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shelterCount, setShelterCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkDataStatus() {
      try {
        setIsLoading(true);
        const shelters = await getShelters();
        setShelterCount(shelters.length);
        setDataLoaded(shelters.length > 0);

        // Можем да добавим и проверка за последна актуализация
        // const { getLastUpdate } = await import('../utils/storage');
        // const update = await getLastUpdate();
        // setLastUpdate(update);

        console.log(`📊 Data status: ${shelters.length} убежища заредени`);
      } catch (error) {
        console.error('❌ Грешка при проверка на данните:', error);
        setDataLoaded(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkDataStatus();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const shelters = await getShelters();
      setShelterCount(shelters.length);
      setDataLoaded(shelters.length > 0);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dataLoaded,
    shelterCount,
    lastUpdate,
    isLoading,
    refreshData,
  };
}

/**
 * Hook за управление на app state
 */
export function useAppState() {
  const [appState, setAppState] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string | null>(null);

  const isReady = useFrameworkReady();
  const { dataLoaded, shelterCount, isLoading } = useDataStatus();

  useEffect(() => {
    if (isReady && !isLoading) {
      if (dataLoaded && shelterCount > 0) {
        setAppState('ready');
        setError(null);
        console.log('✅ App state: готово с данни');
      } else if (dataLoaded && shelterCount === 0) {
        setAppState('error');
        setError('Няма данни за убежища');
        console.log('⚠️ App state: готово но няма данни');
      } else {
        // Позволяваме приложението да работи дори без данни
        setAppState('ready');
        setError('Данните ще бъдат заредени по-късно');
        console.log('⚠️ App state: готово без данни');
      }
    }
  }, [isReady, dataLoaded, shelterCount, isLoading]);

  const retryDataLoad = async () => {
    setAppState('loading');
    setError(null);

    // Trigger data refresh
    window.location?.reload?.(); // За web
    // За мобилни устройства можем да използваме Updates API
  };

  return {
    appState,
    error,
    isReady,
    dataLoaded,
    shelterCount,
    retryDataLoad,
  };
}

/**
 * Hook за проверка на мрежова свързаност (optional)
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Проверяваме дали сме в web среда с window и navigator.onLine
    if (
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.onLine === 'boolean'
    ) {
      setIsConnected(navigator.onLine);

      const handleOnline = () => {
        console.log('Network status: online');
        setIsConnected(true);
      };
      const handleOffline = () => {
        console.log('Network status: offline');
        setIsConnected(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Ако сме в React Native или друга среда без window, просто логваме и оставаме connected
      console.log(
        'Network status: cannot detect (non-web environment), assuming connected'
      );
      setIsConnected(true);
    }
  }, []);

  return isConnected;
}

/**
 * Hook за общо app initialization
 */
export function useAppInitialization() {
  const { appState, error, isReady, dataLoaded, shelterCount, retryDataLoad } =
    useAppState();
  const isConnected = useNetworkStatus();

  const isAppReady = appState === 'ready';
  const hasError = appState === 'error';
  const isLoading = appState === 'loading';

  return {
    isAppReady,
    hasError,
    isLoading,
    isConnected,
    error,
    shelterCount,
    dataLoaded,
    retryDataLoad,
    // Debugging info
    debug: {
      isReady,
      appState,
      dataLoaded,
      shelterCount,
    },
  };
}
