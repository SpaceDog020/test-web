// src/app/Auth/entity-register/page.tsx

'use client';

import React, { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function EntityRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    entityCode: ''
  });
  
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email !== formData.confirmEmail) {
      toast.error('Los correos no coinciden');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        first_name: formData.name,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        entity_password: formData.entityCode
      });
      if(response) {
        toast.success("Registro exitoso. Revise su correo para verificar su cuenta.");
        router.push(`/auth/user-verify?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Error al registrar usuario');
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
          <h1 className="text-2xl font-bold text-center mb-6 text-[#003366]">
            Registro de Usuario de Entidad
          </h1>
          
          <form onSubmit={handleRegister} className="space-y-4">
            {['name', 'lastName', 'email', 'confirmEmail', 'password', 'confirmPassword', 'entityCode'].map((field) => (
                <div key={field} className="border rounded-lg overflow-hidden">
                <input
                  type={
                  field.includes('password') || field === 'confirmPassword' ? 'password' : 
                  field.includes('email') ? 'email' : 
                  'text'
                  }
                  name={field}
                  placeholder={
                  {
                    name: 'Nombre',
                    lastName: 'Apellido',
                    email: 'Correo',
                    confirmEmail: 'Repetir correo',
                    password: 'Contraseña',
                    confirmPassword: 'Repetir contraseña',
                    entityCode: 'Código de identificación entidad'
                  }[field]
                  }
                  value={formData[field as keyof typeof formData]}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-700 focus:outline-none"
                  required
                />
                </div>
            ))}
            
            <button
              type="submit"
              className="w-full bg-[#C62828] text-white py-3 rounded-lg hover:bg-red-700 transition duration-300"
            >
              Registrar
            </button>
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">o</span>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}