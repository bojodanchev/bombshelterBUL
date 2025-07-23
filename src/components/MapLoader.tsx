'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
});

const MapLoader = () => {
  return (
    <div className="rounded-lg overflow-hidden">
      <Map />
    </div>
  );
};

export default MapLoader; 