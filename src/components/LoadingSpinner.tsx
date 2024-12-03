import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#0078ba] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#0078ba] font-medium">Cargando mapa...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;