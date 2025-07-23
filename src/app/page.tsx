import MapLoader from '@/components/MapLoader';
import ClosestShelters from '@/components/ClosestShelters';

export default function Home() {
  return (
    <main>
      <ClosestShelters />
      <MapLoader />
    </main>
  );
} 