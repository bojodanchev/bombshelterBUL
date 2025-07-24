import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { DivIcon } from 'leaflet';

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

const userIcon = new DivIcon({
  html: `
    <div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>
    <div style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); color: black; font-weight: bold; background: white; padding: 2px 5px; border-radius: 3px; white-space: nowrap;">
      You are here
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const MapView = ({ bunkers, userLocation }) => {
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
        return (
          <Marker
            key={bunker.id}
            position={[bunker.latitude, bunker.longitude]}
            icon={bunker.isClosest ? highlightedIcon : defaultIcon}
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
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        >
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView; 