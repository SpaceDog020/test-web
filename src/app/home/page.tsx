
'use client';

import ClientBoundary from '@/components/ClientBoundary';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import auth from '../../../utils/auth';
import axiosInstance from '../../../config/api';
import { toast } from 'react-toastify';
import LogoutButton from '@/components/Logout';
import StatusFilter from '@/components/StatusFilter';
import { Calendar, Home, History, MapPin } from "lucide-react";
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0078ba]" />
        <p className="text-gray-600 font-medium">Cargando mapa...</p>
      </div>
    </div>
  ),
});

interface Report {
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
}

function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isBrowser, setIsBrowser] = useState(false);
  const [permission, setPermission] = useState<boolean | null>(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const getLocalToday = () => {
    const date = new Date();
    // Ajustamos al formato YYYY-MM-DD considerando la zona horaria local
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  };

  const [dateFilters, setDateFilters] = useState(() => {
    const today = getLocalToday();
    return {
      startDate: today,
      endDate: today
    };
  });

  const checkGeolocationPermission = async () => {
    if (!isBrowser) return;

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        console.log("denegado")
        toast.warn('El permiso de ubicación está denegado. Por favor, habilítalo en la configuración del navegador');
      } else {
        console.log("permitido")
        setPermission(true);
      }
    } catch (error) {
      console.log('Error checking permission:', error);
    }
  };

  useEffect(() => {
    if (isBrowser && 'geolocation' in navigator) {
      checkGeolocationPermission();
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
      );
    } else {
      console.log('Geolocation is not available');
    }
  }, [isBrowser]);

  useEffect(() => {
    if (isBrowser) {
      handleReports(dateFilters);
    }
  }, [dateFilters, isBrowser]);

  const handleReports = async (filters: { startDate: string; endDate: string }) => {
    setIsLoading(true);
    try {
      const entityResponse = await axiosInstance.get(
        `${process.env.NEXT_PUBLIC_API_URL}/entities/get-user-entity`
      );

      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      }).toString();

      const reportResponse = await axiosInstance.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/get-entity-reports/${entityResponse.data.id}?${queryParams}`
      );

      if (reportResponse.data) {
        setAllReports(reportResponse.data);
        setFilteredReports(reportResponse.data);
      }
    } catch (error) {
      console.error('Error getting reports:', error);
      toast.error('Error al obtener los reportes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStatuses.length === 0) {
      setFilteredReports(allReports); // Mostrar todos los reportes si no hay filtros
    } else {
      const filtered = allReports.filter(report =>
        selectedStatuses.includes(report.status)
      );
      setFilteredReports(filtered);
    }
  }, [selectedStatuses, allReports]);

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleReports(dateFilters);
  };

  const handleTodayFilter = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const newFilters = {
      startDate: formattedDate,
      endDate: formattedDate
    };
    setDateFilters(newFilters);
    setSelectedStatuses([]); // Esto hará que se muestren todos los reportes de hoy
    handleReports(newFilters);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-[#0078ba] py-4 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Image
            src="/images/new-logo-blanco-sin-fondo-centrado.png"
            alt="Logo"
            width={300}
            height={200}
            className="object-contain"
          />
          <LogoutButton />
        </div>
      </header>

      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto p-4">
          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  max={getLocalToday()}
                  value={dateFilters.startDate}
                  onChange={handleDateFilterChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078ba] focus:border-transparent outline-none"
                  disabled={isLoading || !permission}
                />
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  max={getLocalToday()}
                  min={dateFilters.startDate}
                  value={dateFilters.endDate}
                  onChange={handleDateFilterChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078ba] focus:border-transparent outline-none"
                  disabled={isLoading || !permission}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0078ba] text-white rounded-lg hover:bg-[#006ba7] transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0078ba] focus:ring-opacity-50"
                  disabled={isLoading || !permission}
                >
                  Filtrar
                </button>
                <button
                  type="button"
                  onClick={handleTodayFilter}
                  className="px-6 py-2 bg-[#02946b] text-white rounded-lg hover:bg-[#027a58] transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#02946b] focus:ring-opacity-50"
                  disabled={isLoading || !permission}
                >
                  Hoy
                </button>
              </div>
            </div>
            <StatusFilter
              selectedStatuses={selectedStatuses}
              onChange={setSelectedStatuses}
              disabled={isLoading || !permission}
            />
          </form>
        </div>
      </div>

      <main className="flex-1 relative h-0">
        {isBrowser && permission && location ? (
          <ClientBoundary>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0078ba]" />
                  <p className="text-gray-600 font-medium">Cargando reportes...</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0">
                <Map location={location} reports={filteredReports} />
              </div>
            )}
          </ClientBoundary>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center space-y-4 m-4">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">
                Es necesario activar la ubicación para un correcto funcionamiento del mapa
              </p>
              <p className="text-sm text-gray-500">
                Activa la ubicación en tu navegador y recarga la página
              </p>
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-around items-center h-16">
            <Link
              href="/home"
              className="flex flex-col items-center p-2 text-[#02946b] hover:text-[#027a58] transition-colors relative group"
            >
              <Home className="h-6 w-6" />
              <span className="text-sm font-medium mt-1">Inicio</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#02946b] transform scale-x-100 transition-transform" />
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center p-2 text-[#0078ba] hover:text-[#006ba7] transition-colors relative group"
            >
              <History className="h-6 w-6" />
              <span className="text-sm font-medium mt-1">Historial</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0078ba] transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default auth(HomePage);