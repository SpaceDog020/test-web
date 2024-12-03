import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ApiError extends Error {
  response?: {
    data: {
      message?: string;
      statusCode?: number;
    };
    status?: number;
  };
  request?: unknown;
  config?: unknown;
}

// Función para combinar clases de Tailwind de manera segura
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Función auxiliar para formatear fechas
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Función para validar tokens
export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  // Implementa tu lógica de validación
  return true;
}

// Función para manejar errores de API
export function handleApiError(error: ApiError): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Error de conexión';
}

// Función para validar email
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Función para validar contraseña
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

// Función para validar teléfono
export function validatePhone(phone: string): boolean {
  return /^[0-9]{9}$/.test(phone);
}

// Función para validar nombre
export function validateName(name: string): boolean {
  return name.length > 0;
}

// Función para validar dirección
export function validateAddress(address: string): boolean {
  return address.length > 0;
}

// Función para validar texto
export function validateText(text: string): boolean {
  return text.length > 0;
}

// Función para validar número
export function validateNumber(number: string): boolean {
  return /^[0-9]+$/.test(number);
}

