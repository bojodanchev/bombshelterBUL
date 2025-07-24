import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const highlightedIcon = new L.Icon({
  iconUrl: '/marker-icon-2x.png', // Using the 2x version for a different look
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapView = ({ bunkers, userLocation, closestBunkers }) => {
  const mapCenter = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [42.7, 23.3];
  const zoomLevel = userLocation ? 13 : 8;

  return (
    <MapContainer center={mapCenter} zoom={zoomLevel} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {bunkers.map((bunker) => {
        const isClosest = closestBunkers.some((cb) => cb.id === bunker.id);
        return (
          <Marker
            key={bunker.id}
            position={[bunker.latitude, bunker.longitude]}
            icon={isClosest ? highlightedIcon : defaultIcon}
          >
            <Popup>
              <b>{bunker.name}</b>
              <br />
              {bunker.address}
              {bunker.distance && (
                <>
                  <br />
                  Distance: {(bunker.distance / 1000).toFixed(2)} km
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
      {userLocation && (
        <Marker position={[userLocation.latitude, userLocation.longitude]}>
          <Popup>You are here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView; 