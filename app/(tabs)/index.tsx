import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Target,
  Settings,
  Phone,
  Route,
} from 'lucide-react-native';

import { getCurrentLocation } from '../../utils/location';
import { getShelters } from '../../utils/storage';
import {
  Shelter,
  Coordinates,
  ShelterWithDistance,
  MapRegion,
} from '../../types/shelter';

const { width, height } = Dimensions.get('window');

// Координати на България за по-добро центриране
const BULGARIA_CENTER = {
  latitude: 42.7339,
  longitude: 25.4858,
  latitudeDelta: 2.0,
  longitudeDelta: 2.0,
};

export default function MapScreen() {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null
  );
  const [shelters, setShelters] = useState<ShelterWithDistance[]>([]);
  const [selectedShelter, setSelectedShelter] =
    useState<ShelterWithDistance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState<Coordinates[]>([]);
  const [mapRegion, setMapRegion] = useState<MapRegion>(BULGARIA_CENTER);
  const [followUserLocation, setFollowUserLocation] = useState(true);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);

      // Първо зареждаме убежищата
      const storedShelters = await getShelters();
      console.log(`Заредени ${storedShelters.length} убежища`);

      // Получаваме местоположението
      const location = await getCurrentLocation();

      // Изчисляваме разстоянията ако имаме местоположение
      let sheltersWithDistance: ShelterWithDistance[];
      if (location) {
        setCurrentLocation(location);

        // Центрираме картата само ако followUserLocation е true
        if (followUserLocation) {
          const newRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          setMapRegion(newRegion);
          // Анимираме картата към новото местоположение
          setTimeout(() => {
            mapRef.current?.animateToRegion(newRegion, 1000);
          }, 500);
        }

        sheltersWithDistance = storedShelters
          .filter((shelter) => shelter.has_coordinates)
          .map((shelter) => ({
            ...shelter,
            distance: calculateDistance(location, {
              latitude: shelter.latitude,
              longitude: shelter.longitude,
            }),
          }))
          .sort((a, b) => a.distance - b.distance);
      } else {
        // Ако няма местоположение, центрираме върху България
        sheltersWithDistance = storedShelters
          .filter((shelter) => shelter.has_coordinates)
          .map((shelter) => ({ ...shelter, distance: 0 }));
      }

      setShelters(sheltersWithDistance);
    } catch (error) {
      console.error('Грешка при зареждане на данни:', error);
      Alert.alert('Грешка', 'Не можах да заредя данните');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Изчислява разстоянието между две точки в км
   */
  function calculateDistance(point1: Coordinates, point2: Coordinates): number {
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

  function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Намира най-близкото убежище
   */
  function findNearestShelter() {
    if (!currentLocation) {
      Alert.alert('Грешка', 'Първо трябва да получа вашето местоположение');
      return;
    }

    if (shelters.length === 0) {
      Alert.alert('Грешка', 'Няма данни за убежища');
      return;
    }

    const nearest = shelters[0]; // Вече са сортирани по разстояние
    setSelectedShelter(nearest);

    // Центрираме картата
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: nearest.latitude,
          longitude: nearest.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }

    Alert.alert(
      'Най-близко убежище',
      `${nearest.name}\nРазстояние: ${nearest.distance.toFixed(2)} км`,
      [
        { text: 'Отказ', style: 'cancel' },
        { text: 'Google Maps', onPress: () => openInGoogleMaps(nearest) },
        { text: 'Покажи на картата', onPress: () => showOnMap(nearest) },
      ]
    );
  }

  /**
   * Отваря Google Maps за навигация
   */
  function openInGoogleMaps(shelter: ShelterWithDistance) {
    const destination = `${shelter.latitude},${shelter.longitude}`;
    const label = encodeURIComponent(shelter.name);

    let url: string;
    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${destination}&dirflg=d&t=m`;
    } else {
      url = `google.navigation:q=${destination}&mode=d`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback към browser версията
          const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}`;
          return Linking.openURL(browserUrl);
        }
      })
      .catch((error) => {
        console.error('Грешка при отваряне на карти:', error);
        Alert.alert('Грешка', 'Не можах да отворя приложението за карти');
      });
  }

  /**
   * Показва убежището на картата
   */
  function showOnMap(shelter: ShelterWithDistance) {
    setSelectedShelter(shelter);
    setFollowUserLocation(false);

    if (mapRef.current && currentLocation) {
      // Показваме и двете точки на картата
      const midLat = (currentLocation.latitude + shelter.latitude) / 2;
      const midLon = (currentLocation.longitude + shelter.longitude) / 2;
      const latDelta =
        Math.abs(currentLocation.latitude - shelter.latitude) * 2;
      const lonDelta =
        Math.abs(currentLocation.longitude - shelter.longitude) * 2;

      mapRef.current.animateToRegion(
        {
          latitude: midLat,
          longitude: midLon,
          latitudeDelta: Math.max(latDelta, 0.01),
          longitudeDelta: Math.max(lonDelta, 0.01),
        },
        1000
      );

      // Показваме линия до убежището
      setNavigationRoute([
        currentLocation,
        { latitude: shelter.latitude, longitude: shelter.longitude },
      ]);
    }
  }

  /**
   * Спира показването на маршрута
   */
  function stopNavigation() {
    setNavigationRoute([]);
    setSelectedShelter(null);
    setIsNavigating(false);
  }

  /**
   * Центрира картата върху потребителя
   */
  function centerOnUser() {
    if (currentLocation && mapRef.current) {
      setFollowUserLocation(true);
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    } else {
      // Опитваме се да получим местоположението отново
      getCurrentLocation()
        .then((location) => {
          if (location) {
            setCurrentLocation(location);
            setFollowUserLocation(true);
            mapRef.current?.animateToRegion(
              {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000
            );
          }
        })
        .catch((error) => {
          Alert.alert('Грешка', 'Не можах да получа местоположението ви');
        });
    }
  }

  /**
   * Emergency функция
   */
  function handleEmergency() {
    Alert.alert('СПЕШНА СИТУАЦИЯ', 'Какво искате да направите?', [
      {
        text: 'Обади 112',
        onPress: () => {
          Linking.openURL('tel:112').catch(() => {
            Alert.alert('Грешка', 'Не можах да инициирам обаждане');
          });
        },
      },
      {
        text: 'Най-близко убежище',
        onPress: findNearestShelter,
      },
      {
        text: 'Отказ',
        style: 'cancel',
      },
    ]);
  }

  /**
   * Отваря настройките (трябва да се имплементира навигацията)
   */
  function openSettings() {
    // Тук трябва да се имплементира навигация към settings screen
    Alert.alert('Настройки', 'Навигация към настройки (не е имплементирана)');
  }

  /**
   * Обработва промяна на региона на картата
   */
  function handleRegionChange(region: MapRegion) {
    // Ако потребителят мести картата ръчно, спираме следенето
    if (followUserLocation && currentLocation) {
      const distance = calculateDistance(
        { latitude: region.latitude, longitude: region.longitude },
        currentLocation
      );
      // Ако е преместил картата повече от 1км, спираме следенето
      if (distance > 1) {
        setFollowUserLocation(false);
      }
    }
    setMapRegion(region);
  }

  /**
   * Връща цвета на маркера според категорията
   */
  function getShelterMarkerColor(shelter: Shelter): string {
    if (shelter.short_category === 'Първа категория') {
      return 'green';
    } else if (shelter.short_category === 'Втора категория') {
      return 'orange';
    } else if (shelter.short_category === 'Трета категория') {
      return 'red';
    } else {
      return 'gray';
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Зареждам картата...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={BULGARIA_CENTER}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        followsUserLocation={followUserLocation}
        showsPointsOfInterest={false}
        showsBuildings={false}
      >
        {/* Потребителско местоположение (само ако няма showsUserLocation) */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Вашето местоположение"
            pinColor="blue"
            identifier="user-location"
          />
        )}

        {/* Убежища */}
        {shelters.map((shelter, index) => (
          <Marker
            key={`shelter-${shelter.id}-${index}`}
            coordinate={{
              latitude: shelter.latitude,
              longitude: shelter.longitude,
            }}
            title={shelter.name}
            description={`${shelter.address} • ${shelter.distance.toFixed(
              2
            )} км`}
            pinColor={getShelterMarkerColor(shelter)}
            onPress={() => setSelectedShelter(shelter)}
          />
        ))}

        {/* Линия до избраното убежище */}
        {navigationRoute.length > 0 && (
          <Polyline
            coordinates={navigationRoute}
            strokeColor="#007AFF"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Горни контроли */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={openSettings}>
          <Settings size={22} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
          <Target size={22} color={followUserLocation ? '#007AFF' : '#666'} />
        </TouchableOpacity>
      </View>

      {/* Долни контроли */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={findNearestShelter}
        >
          <MapPin size={20} color="white" />
          <Text style={styles.actionButtonText}>Най-близко</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.emergencyButton]}
          onPress={handleEmergency}
        >
          <AlertTriangle size={20} color="white" />
          <Text style={styles.actionButtonText}>СПЕШНО</Text>
        </TouchableOpacity>
      </View>

      {/* Информация за избраното убежище */}
      {selectedShelter && (
        <View style={styles.shelterInfo}>
          <View style={styles.shelterHeader}>
            <Text style={styles.shelterName} numberOfLines={2}>
              {selectedShelter.name}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedShelter(null);
                setNavigationRoute([]);
              }}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.shelterAddress}>{selectedShelter.address}</Text>
          <Text style={styles.shelterDetails}>
            {selectedShelter.short_category} •{' '}
            {selectedShelter.distance.toFixed(2)} км
          </Text>
          <Text style={styles.shelterOperator}>
            Оператор: {selectedShelter.operator}
          </Text>

          <View style={styles.shelterActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.showButton]}
              onPress={() => showOnMap(selectedShelter)}
            >
              <Route size={16} color="white" />
              <Text style={styles.actionButtonText}>Покажи</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.navigateButton]}
              onPress={() => openInGoogleMaps(selectedShelter)}
            >
              <Navigation size={16} color="white" />
              <Text style={styles.actionButtonText}>Навигация</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Статистики панел */}
      <View style={styles.statsPanel}>
        <Text style={styles.statsText}>
          {shelters.length} убежища
          {currentLocation &&
            ` • ${currentLocation.latitude.toFixed(
              4
            )}, ${currentLocation.longitude.toFixed(4)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
  },
  navigateButton: {
    backgroundColor: '#007AFF',
  },
  showButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shelterInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 280,
  },
  shelterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  shelterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  shelterAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shelterDetails: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  shelterOperator: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  shelterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statsPanel: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '70%',
  },
  statsText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
});
