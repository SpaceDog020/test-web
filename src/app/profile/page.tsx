'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import EditableIncidentHistoryList from '@/components/EditableIncidentHistoryList';
import * as XLSX from 'xlsx';
import axiosInstance from '../../../config/api';
import LogoutButton from '@/components/Logout';
import { Download, Home, History } from 'lucide-react';
import Link from 'next/link';

interface EntityInfo {
  id: string;
  name: string;
  location: string;
  email: string;
}

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

interface ReportDetails {
  questionLabel: string;
  value: string;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId');
  const [entityInfo, setEntityInfo] = useState<EntityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchEntityInfo = async () => {
    try {
      const response = await axiosInstance.get(
        `${process.env.NEXT_PUBLIC_API_URL}/entities/get-user-entity`,
      );

      setEntityInfo(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener datos de usuario:', err);
      setError('No se pudieron cargar los datos del usuario');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntityInfo();
  }, []);

  useEffect(() => {
    if (reportId) {
      const findReportById = async (id: string) => {
        if (!entityInfo?.id) return;

        try {
          const response = await axiosInstance.get<Report>(
            `${process.env.NEXT_PUBLIC_API_URL}/reports/${id}`
          );
          
          if (response.data) {
            setEntityInfo(prev => ({
              ...prev!,
              initialReport: response.data
            }));
          }
        } catch (err) {
          console.error('Error al obtener el reporte:', err);
          setError('No se pudo encontrar el reporte especificado');
        }
      };

      findReportById(reportId);
    }
  }, [reportId, entityInfo?.id]);

  const downloadExcel = async () => {
    try {
      setDownloading(true);

      // Obtener datos de incidentes
      const response = await axiosInstance.get<Report[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/get-entity-reports/${entityInfo?.id}`,
      );

      // Preparar datos para Excel
      const data = response.data.map(report => {
        // Transformar detalles del reporte en un formato legible
        const detailsObject = JSON.parse(report.details) as Record<string, ReportDetails>;;
        const formattedDetails = Object.values(detailsObject)
          .map((detail) => `${detail.questionLabel}: ${detail.value}`)
          .join(' ; ');

        return {
          ID: report.id,
          Incidente: report.incident_name,
          Dirección: report.address,
          Detalles: formattedDetails,
          Estado: report.status,
          'Fecha de Creación': new Date(report.createdAt).toLocaleString(),
          'Fecha de Actualización': new Date(report.updatedAt).toLocaleString(),
          Imagen: report.image ? report.image : 'No hay imagen',
        };
      });

      // Crear libro de Excel
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Incidentes");

      // Generar archivo
      const fileName = `incidentes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setDownloading(false);
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      alert('Error al generar el archivo Excel');
      setDownloading(false);
    }
  };

  if (loading) {
    return <LoadingView />;
  }

  if (error || !entityInfo) {
    return <ErrorView error={error} onRetry={fetchEntityInfo} />;
  }

  return <MainContent entityInfo={entityInfo} reportId={reportId} downloading={downloading} downloadExcel={downloadExcel} />;
}

// Componente principal que maneja la estructura base
export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-[#0078ba] py-4 px-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Image
            src="/images/new-logo-blanco-sin-fondo.png"
            alt="Logo"
            width={200}
            height={100}
            className="object-contain"
          />
          <LogoutButton />
        </div>
      </header>

      <Suspense fallback={<LoadingView />}>
        <ProfileContent />
      </Suspense>

      <NavigationBar />
    </div>
  );
}

// Componentes auxiliares
function LoadingView() {
  return (
    <main className="flex-grow p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div className="h-8 w-64 animate-pulse bg-gray-200 rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 animate-pulse bg-gray-100 rounded w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
            <div className="h-10 w-32 animate-pulse bg-gray-200 rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ErrorView({ error, onRetry }: { error: string | null, onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-red-500">{error || 'Error desconocido'}</p>
      <button
        onClick={onRetry}
        className="mt-4 text-blue-500 underline"
      >
        Reintentar
      </button>
    </div>
  );
}

function NavigationBar() {
  return (
    <nav className="bg-white border-t border-gray-200 shadow-lg sticky bottom-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/home"
            className="flex flex-col items-center p-2 text-[#0078ba] hover:text-[#006ba7] transition-colors relative group"
          >
            <Home className="h-6 w-6" />
            <span className="text-sm font-medium mt-1">Inicio</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0078ba] transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center p-2 text-[#02946b] hover:text-[#027a58] transition-colors relative group"
          >
            <History className="h-6 w-6" />
            <span className="text-sm font-medium mt-1">Historial</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#02946b] transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function MainContent({ entityInfo, reportId, downloading, downloadExcel }: { 
  entityInfo: EntityInfo; 
  reportId: string | null;
  downloading: boolean;
  downloadExcel: () => Promise<void>;
}) {
  return (
    <main className="flex-grow p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 pb-4 border-b border-gray-100">
              Información de la entidad
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center">
                <span className="w-24 text-gray-600 font-medium">Nombre:</span>
                <span className="text-gray-800">{entityInfo.name}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-gray-600 font-medium">Ubicación:</span>
                <span className="text-gray-800">{entityInfo.location}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-gray-600 font-medium">Correo:</span>
                <span className="text-gray-800">{entityInfo.email}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                Historial de Reportes
              </h2>
              <button
                onClick={downloadExcel}
                disabled={downloading}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#0078ba] text-white rounded-lg hover:bg-[#006ba7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0078ba] focus:ring-opacity-50"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    <span>Descargar Excel</span>
                  </>
                )}
              </button>
            </div>

            {entityInfo.id && (
              <EditableIncidentHistoryList
                entityId={entityInfo.id}
                initialReportId={reportId}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}