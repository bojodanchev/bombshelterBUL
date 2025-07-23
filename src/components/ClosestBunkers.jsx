import React from 'react';

const ClosestBunkers = ({ bunkers }) => {
  if (!bunkers || bunkers.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-md shadow-lg">
      <h2 className="text-lg font-bold mb-2">Closest Bunkers</h2>
      <ul>
        {bunkers.map((bunker, index) => (
          <li key={bunker.id} className="mb-2">
            <p className="font-bold">
              {index + 1}. {bunker.name}
            </p>
            <p>{bunker.address}</p>
            <p className="text-sm text-gray-600">
              {bunker.distance ? `${(bunker.distance / 1000).toFixed(2)} km away` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClosestBunkers; 