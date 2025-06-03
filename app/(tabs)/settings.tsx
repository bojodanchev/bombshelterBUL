import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Settings,
  RefreshCw,
  Database,
  Info,
  Trash2,
  Download,
} from 'lucide-react-native';

import {
  getLastUpdate,
  importSheltersFromJson,
  getShelters,
  clearAllData,
  getStorageSize,
  getShelterStatistics,
} from '../../utils/storage';

// Импортираме JSON данните директно
import sheltersData from '../../assets/data/bomb_shelters_opencage_geocoded_20250603_103516.json';

export default function SettingsScreen() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOfflineEnabled, setIsOfflineEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shelterCount, setShelterCount] = useState(0);
  const [storageSize, setStorageSize] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Последна актуализация
      const date = await getLastUpdate();
      setLastUpdate(date);

      // Брой убежища
      const shelters = await getShelters();
      setShelterCount(shelters.length);

      // Статистики
      if (shelters.length > 0) {
        const stats = getShelterStatistics(shelters);
        setStatistics(stats);
      }

      // Размер на storage
      const size = await getStorageSize();
      setStorageSize(size);
    } catch (error) {
      console.error('Грешка при зареждане на данни:', error);
    }
  }

  async function handleUpdateData() {
    try {
      setIsUpdating(true);

      console.log('Започвам импорт на данни от JSON файла...');

      // Импортираме данните от JSON файла
      const importedShelters = await importSheltersFromJson(sheltersData);

      // Обновяваме UI
      await loadData();

      Alert.alert(
        'Успех',
        `Данните са обновени успешно!\n\nИмпортирани: ${
          importedShelters.length
        } убежища\nС координати: ${
          importedShelters.filter((s) => s.has_coordinates).length
        }`
      );
    } catch (error) {
      console.error('Грешка при обновяване на данни:', error);
      Alert.alert(
        'Грешка',
        `Неуспешно обновяване на данните:\n${
          error instanceof Error ? error.message : 'Неизвестна грешка'
        }`
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleClearData() {
    Alert.alert(
      'Изчистване на данни',
      'Сигурни ли сте, че искате да изчистите всички данни? Това действие не може да бъде отменено.',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изчисти',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await loadData();
              Alert.alert('Успех', 'Всички данни са изчистени');
            } catch (error) {
              Alert.alert('Грешка', 'Неуспешно изчистване на данните');
            }
          },
        },
      ]
    );
  }

  function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function showDataDetails() {
    if (!statistics) {
      Alert.alert('Информация', 'Няма заредени данни');
      return;
    }

    const details = `
Общо убежища: ${statistics.total}
С координати: ${statistics.withCoordinates}
Средна точност: ${statistics.averageConfidence.toFixed(1)}/10

По типове:
${Object.entries(statistics.byType)
  .map(([type, count]) => `• ${type}: ${count}`)
  .join('\n')}

По категории:
${Object.entries(statistics.byCategory)
  .map(([category, count]) => `• ${category}: ${count}`)
  .join('\n')}

Топ градове:
${Object.entries(statistics.byCity)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([city, count]) => `• ${city}: ${count}`)
  .join('\n')}
    `.trim();

    Alert.alert('Статистики за данните', details);
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Settings size={32} color="#007AFF" />
        <Text style={styles.headerTitle}>Настройки</Text>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Управление на данни</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Database size={20} color="#007AFF" />
              <Text style={styles.label}>Убежища в базата</Text>
            </View>
            <Text style={styles.value}>{shelterCount}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <RefreshCw size={20} color="#007AFF" />
              <Text style={styles.label}>Последна актуализация</Text>
            </View>
            <Text style={styles.value}>
              {lastUpdate ? lastUpdate.toLocaleDateString('bg-BG') : 'Никога'}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Download size={20} color="#007AFF" />
              <Text style={styles.label}>Размер на данните</Text>
            </View>
            <Text style={styles.value}>{formatStorageSize(storageSize)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleUpdateData}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <RefreshCw size={20} color="white" />
          )}
          <Text style={styles.buttonText}>
            {isUpdating ? 'Обновявам...' : 'Обнови данните за убежища'}
          </Text>
        </TouchableOpacity>

        {statistics && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={showDataDetails}
          >
            <Info size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Покажи статистики</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearData}
        >
          <Trash2 size={20} color="white" />
          <Text style={styles.buttonText}>Изчисти всички данни</Text>
        </TouchableOpacity>
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настройки на приложението</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Офлайн режим</Text>
            <Switch
              value={isOfflineEnabled}
              onValueChange={setIsOfflineEnabled}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={isOfflineEnabled ? '#FFF' : '#FFF'}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Уведомления</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor="#FFF"
            />
          </View>
        </View>
      </View>

      {/* Data Source Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация за данните</Text>

        <View style={styles.card}>
          <Text style={styles.infoText}>
            Данните за бомбоубежищата са получени от официални източници и
            геокодирани с OpenCage API.
          </Text>
          <Text style={styles.infoText}>
            Координатите имат точност от 5 до 10 метра в повечето случаи.
          </Text>
          <Text style={styles.infoText}>
            При спешна ситуация винаги обадете се на 112.
          </Text>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>За приложението</Text>

        <View style={styles.card}>
          <Text style={styles.version}>Версия 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 Bomb Shelter Locator</Text>
          <Text style={styles.description}>
            Приложение за намиране на най-близкото бомбоубежище в България
          </Text>
        </View>
      </View>

      {/* Debug Info (само в development) */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug информация</Text>

          <View style={styles.card}>
            <Text style={styles.debugText}>
              JSON файл: bomb_shelters_opencage_geocoded_20250603_103516.json
            </Text>
            <Text style={styles.debugText}>
              Записи в JSON: {sheltersData?.shelters?.length || 0}
            </Text>
            <Text style={styles.debugText}>
              Metadata: {sheltersData?.metadata ? 'Да' : 'Не'}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  value: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 32,
  },
});
