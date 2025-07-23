'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import shelters from '@/data/bomb_shelters_opencage_geocoded_20250603_103516.json';
import L from 'leaflet';

// Fix for default icon issue with webpack
const icon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface Shelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  operator: string;
  type: string;
  category: string;
  short_category: string;
  city: string;
}

const Map = () => {
  const position: [number, number] = [42.7339, 25.4858]; // Bulgaria center

  return (
    <MapContainer
      center={position}
      zoom={8}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {(shelters as Shelter[]).map((shelter) => (
        <Marker
          key={shelter.id}
          position={[shelter.latitude, shelter.longitude]}
          icon={icon}
        >
          <Popup>
            <b>{shelter.name}</b>
            <br />
            {shelter.address}
            <br />
            {shelter.city}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map; 