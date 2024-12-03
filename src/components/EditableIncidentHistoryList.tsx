'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog } from '@/components/ui/dialog';
import axiosInstance from '../../config/api';
import { toast } from 'react-toastify';
import StatusFilter from './StatusFilter';
import { Calendar, Clock, MapPin, X } from 'lucide-react';

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  details: string;
  incident_id: string;
  incident_name: string;
  status: string;
  address: string;
  image: string;
  updatedAt: string;
  createdAt: string;
}

interface Props {
  entityId: string;
  initialReportId?: string | null;
}

const ESTADO_OPCIONES = ['Resolviendo', 'Resuelto', 'En pausa', 'Postergado', 'Sin resolver'];

const statusColors: Record<string, string> = {
  Resolviendo: 'bg-yellow-400',
  Resuelto: 'bg-green-500',
  'En pausa': 'bg-orange-500',
  Postergado: 'bg-purple-500',
  'Sin resolver': 'bg-red-500',
  Enviado: 'bg-blue-500',
};

export default function EditableIncidentHistoryList({ entityId, initialReportId }: Props) {
  const [initialReportLoaded, setInitialReportLoaded] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

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

  useEffect(() => {
    if (initialReportId && !initialReportLoaded) {
      // Hacer una petición específica para el reporte inicial
      const fetchInitialReport = async () => {
        try {
          const response = await axiosInstance.get(
            `${process.env.NEXT_PUBLIC_API_URL}/reports/get-report/${initialReportId}`
          );
          if (response.data) {
            setSelectedReport(response.data);
            setShowDetails(true);
            setInitialReportLoaded(true);
          }
        } catch (error) {
          console.error('Error fetching initial report:', error);
          toast.error('No se pudo cargar el reporte específico');
        }
      };

      fetchInitialReport();
    }
  }, [initialReportId, initialReportLoaded]);

  const handleReports = useCallback(async (filters: { startDate: string; endDate: string }) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      }).toString();

      const reportResponse = await axiosInstance.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/get-entity-reports/${entityId}?${queryParams}`
      );

      if (reportResponse.data) {
        const newReports = reportResponse.data;
        setReports(newReports);

        // Aplicar filtros de estado si existen
        if (selectedStatuses.length > 0) {
          setFilteredReports(newReports.filter((report: Report) =>
            selectedStatuses.includes(report.status)
          ));
        } else {
          setFilteredReports(newReports);
        }

        // Si hay un reporte inicial y está siendo mostrado, actualizarlo con los nuevos datos
        if (selectedReport && initialReportId) {
          const updatedInitialReport = newReports.find(
            (r: Report) => r.id === initialReportId
          );
          if (updatedInitialReport) {
            setSelectedReport(updatedInitialReport);
          }
        }
      }
    } catch (error) {
      console.error('Error getting reports:', error);
      toast.error('Error al obtener los reportes');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, selectedStatuses, selectedReport, initialReportId]);

  useEffect(() => {
    handleReports(dateFilters);
  }, [dateFilters, handleReports]);

  useEffect(() => {
    if (!isLoading) { // Solo aplicar filtros cuando no estamos cargando nuevos datos
      if (selectedStatuses.length === 0) {
        setFilteredReports(reports);
      } else {
        const filtered = reports.filter(report =>
          selectedStatuses.includes(report.status)
        );
        setFilteredReports(filtered);
      }
    }
  }, [selectedStatuses, reports, isLoading]);

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
    const today = getLocalToday();
    const newFilters = {
      startDate: today,
      endDate: today
    };
    setDateFilters(newFilters);
    setSelectedStatuses([]); // Resetear los filtros de estado
    handleReports(newFilters);
  };

  const updateIncidentStatus = async (reportId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/change-report-status`,
        { report_id: reportId, status: newStatus },
      );

      if (response.data.success != true) {
        toast.error('No se pudo actualizar el estado');
        setIsLoading(false);
      } else {
        setReports(prevReports =>
          prevReports.map(report =>
            report.id === reportId
              ? { ...report, status: newStatus }
              : report
          )
        );

        setShowStatusModal(false);
        setShowDetails(false);
        toast.success('Estado actualizado correctamente');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error al actualizar el estado:', err);
      toast.error('No se pudo actualizar el estado');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-full max-w-sm" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded-lg w-24" />
              ))}
            </div>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                name="startDate"
                value={dateFilters.startDate}
                onChange={handleDateFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078ba] focus:border-transparent outline-none"
              />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                name="endDate"
                value={dateFilters.endDate}
                onChange={handleDateFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0078ba] focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-[#0078ba] text-white rounded-lg hover:bg-[#006ba7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0078ba] focus:ring-opacity-50"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={handleTodayFilter}
                className="px-6 py-2 bg-[#02946b] text-white rounded-lg hover:bg-[#027a58] transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-[#02946b] focus:ring-opacity-50"
              >
                Hoy
              </button>
            </div>
          </div>
          <StatusFilter
            selectedStatuses={selectedStatuses}
            onChange={setSelectedStatuses}
          />
        </form>
      </div>

      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            onClick={() => {
              setSelectedReport(report);
              setShowDetails(true);
            }}
            className={`${statusColors[report.status]} rounded-lg p-6 text-white cursor-pointer transform transition-all duration-200 hover:scale-[1.01] hover:shadow-lg`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{report.incident_name}</h3>
                  <p className="text-sm bg-black/20 px-2 py-1 rounded inline-block">
                    ID: {report.id}
                  </p>
                </div>
                <div className="flex items-center text-sm bg-black/20 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Ultima actualización:
                  {new Date(report.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{report.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 bg-black/20 rounded-full text-sm">
                  {report.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDetails && selectedReport && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedReport.incident_name}
                  </h2>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    {selectedReport.address}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-4">Detalles del reporte</h3>
                  <div className="space-y-4">
                    {Object.entries(JSON.parse(selectedReport.details)).map(([key, detail]) => (
                      <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="font-medium text-gray-900">{(detail as { questionLabel: string }).questionLabel}</p>
                        <p className="text-gray-700 mt-1">{(detail as { value: string }).value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedReport.image && (
                  <div className="rounded-lg overflow-hidden shadow-lg">
                    <div className="relative h-64 w-full">
                      <Image
                        src={selectedReport.image}
                        alt="Incidente"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowStatusModal(true)}
                  className={`${statusColors[selectedReport.status]} w-full py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm`}
                >
                  Estado Actual: {selectedReport.status}
                  {' (Cambiar)'}
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {showStatusModal && selectedReport && (
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Cambiar estado
              </h3>

              <div className="space-y-2">
                {ESTADO_OPCIONES.map((estado) => (
                  <button
                    key={estado}
                    onClick={() => {
                      if (selectedReport) {
                        updateIncidentStatus(selectedReport.id, estado);
                      }
                    }}
                    className={`${statusColors[estado]} w-full py-3 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm`}
                  >
                    {estado}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}