// app/_layout.tsx

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useAppInitialization } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  const {
    isAppReady,
    hasError,
    isLoading,
    error,
    shelterCount,
    retryDataLoad,
  } = useAppInitialization();

  // Показваме различни екрани според състоянието
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (hasError && shelterCount === 0) {
    return <ErrorScreen error={error} onRetry={retryDataLoad} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />

      {/* Debug info в development mode */}
      {__DEV__ && (
        <View style={styles.debugBadge}>
          <Text style={styles.debugText}>{shelterCount} убежища</Text>
        </View>
      )}
    </>
  );
}

/**
 * Loading screen компонент
 */
function LoadingScreen() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Зареждам приложението...</Text>
      <Text style={styles.subText}>Подготвям данните за убежища</Text>
    </View>
  );
}

/**
 * Error screen компонент
 */
function ErrorScreen({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  useEffect(() => {
    // Показваме alert с грешката
    if (error) {
      Alert.alert('Грешка при зареждане', error, [
        {
          text: 'Опитай отново',
          onPress: onRetry,
        },
        {
          text: 'Продължи без данни',
          style: 'cancel',
        },
      ]);
    }
  }, [error, onRetry]);

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Проблем с данните</Text>
      <Text style={styles.errorMessage}>{error || 'Неизвестна грешка'}</Text>
      <Text style={styles.errorHint}>
        Приложението ще работи с ограничена функционалност
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  debugBadge: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
