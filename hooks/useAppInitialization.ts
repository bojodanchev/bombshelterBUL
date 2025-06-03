import { useEffect, useState } from 'react';

// Примерни фалшиви данни, можеш да замениш с реално зареждане от API, SQLite, etc.
export function useAppInitialization() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [shelterCount, setShelterCount] = useState(0);

  useEffect(() => {
    // Симулираме асинхронно зареждане
    const loadData = async () => {
      // TODO: Зареди реални убежища тук
      await new Promise((res) => setTimeout(res, 1000));
      setShelterCount(1234); // примерен брой
      setIsAppReady(true);
    };

    loadData();
  }, []);

  return { isAppReady, shelterCount };
}
