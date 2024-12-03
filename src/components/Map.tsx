'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Dialog } from '@/components/ui/dialog';
import Image from 'next/image';

interface MapProps {
  location: {
    lat: number;
    lng: number;
  };
  reports: {
    id: number;
    latitude: number;
    longitude: number;
    address: string;
    details: string;
    incident_id: string;
    incident_name: string;
    status: string;
    image: string;
    updatedAt: string;
    createdAt: string;
  }[];
}

interface IconDefault extends L.Icon {
  _getIconUrl?: string;
}

// Definimos los colores para cada estado
const statusColors: { [key: string]: string } = {
  'Resolviendo': '#FBBF24', // yellow-400
  'Resuelto': '#22C55E',    // green-500
  'En pausa': '#F97316',    // orange-500
  'Postergado': '#A855F7',  // purple-500
  'Sin resolver': '#EF4444',// red-500
  'Enviado': '#3B82F6',     // blue-500
};

// Función para crear un icono personalizado
const createCustomIcon = (status: string) => {
  const color = statusColors[status] || '#3B82F6'; // Color por defecto si no se encuentra el estado

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 25px;
        height: 25px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Fix for default marker icon in Next.js (solo para el marcador de ubicación actual)
delete ((L.Icon.Default.prototype as IconDefault)._getIconUrl);
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Map({ location, reports }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedReport, setSelectedReport] = useState<MapProps['reports'][0] | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !Array.isArray(reports)) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    mapInstanceRef.current = L.map(mapRef.current).setView([location.lat, location.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstanceRef.current);

    // Marcador de ubicación actual (mantiene el estilo original)
    const marker = L.marker([location.lat, location.lng])
      .addTo(mapInstanceRef.current)
      .bindPopup('Tu ubicación actual')
      .openPopup();

    marker.dragging?.enable();

    if (reports && reports.length > 0) {
      reports.forEach(report => {
        const popupContent = L.DomUtil.create('div', '');
        popupContent.innerHTML = `
          <div>
            <p>${report.incident_name} - Estado: 
              <span style="color: ${statusColors[report.status]}; font-weight: bold;">
                ${report.status}
              </span>
            </p>
            <p>Última actualización: ${new Date(report.updatedAt).toLocaleString()}</p>
          </div>
        `;
        const button = L.DomUtil.create('button', '', popupContent);
        button.innerHTML = 'Ver detalles';
        button.onclick = () => {
          setSelectedReport(report);
          setShowDetails(true);
        };

        // Usar el icono personalizado basado en el estado
        L.marker([report.latitude, report.longitude], {
          icon: createCustomIcon(report.status)
        })
          .addTo(mapInstanceRef.current!)
          .bindPopup(popupContent);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, reports]);

  return (
    <>
      <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
      {showDetails && selectedReport && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 1000 }}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">{selectedReport.incident_name}</h2>
              <div className="mb-4 max-h-60 overflow-y-auto">
                {Object.entries(JSON.parse(selectedReport.details) as Record<string, { questionLabel: string, value: string }>).map(([key, detail]) => (
                  <p key={key} className="mb-2">
                    <strong>{detail.questionLabel}:</strong> {detail.value}
                  </p>
                ))}
              </div>
              {selectedReport.image && (
                <div className="mb-4 relative h-48">
                  <Image
                    src={selectedReport.image}
                    alt="Incident"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              <button
                onClick={() => setShowDetails(false)}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}