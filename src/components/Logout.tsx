// components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = () => {
    try {
      // Cerrar sesión de Google
      googleLogout();
      
      // Eliminar cookies
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      
      // Redireccionar
      router.push('/auth/login');
      
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      
      // Asegurarnos de limpiar las cookies incluso si hay error
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      
      router.push('/auth/login');
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
    >
      Cerrar sesión
    </button>
  );
};

export default LogoutButton;