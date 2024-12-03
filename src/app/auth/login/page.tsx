// src/app/Auth/login/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import axiosInstance from '../../../../config/api';
import { toast } from 'react-toastify';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const access_token = Cookies.get('access_token');
    if (access_token) {
      router.push('/home');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.access_token && response.data.refresh_token) {
        toast.success("Inicio de sesión exitoso");
        // Guardar los tokens en cookies
        Cookies.set('access_token', response.data.access_token, { expires: Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES) });
        Cookies.set('refresh_token', response.data.refresh_token, { expires: Number(process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRES) });
        router.push('/home');
      } else {
        if (response.data.statusCode === 403) {
          toast.success('Correo no verificado, se ha enviado un nuevo código');
          router.push(`/auth/user-verify?email=${encodeURIComponent(email)}`);
        } else {
          console.error('Login error:', response.data);
          toast.error('Error al iniciar sesión');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión');
      // TODO: Add proper error handling and user feedback
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-[#0078ba] py-4 flex items-center justify-center">
        <Image
          src="/images/new-logo-blanco-sin-fondo-centrado.png"
          alt="Logo"
          width={400}
          height={300}
          className="object-contain"
        />
      </header>

      <main className="flex-grow flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#003366]">Iniciar Sesión</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <input
                type="email"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-gray-700 focus:outline-none"
                required
              />
            </div>

            <div className="border rounded-lg overflow-hidden">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-gray-700 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#C62828] text-white py-3 rounded-lg hover:bg-red-700 transition duration-300"
            >
              Ingresar
            </button>

            {/* Agregamos el separador y el botón de Google manteniendo los estilos */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">o</span>
              </div>
            </div>

            {/* Envolvemos el botón de Google con el provider */}
            <GoogleAuthButton />
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600 mt-2">
              ¿Perteneces a una entidad?{' '}
              <a
                href="/auth/entity-register"
                className="text-[#003366] font-bold hover:underline"
              >
                ¡Regístrate aquí!
              </a>
            </p>
          </div>
        </div>
      </main>
    </div >
  );
}