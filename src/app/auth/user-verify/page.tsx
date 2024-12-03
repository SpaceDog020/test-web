'use client';

import React, { useState, Suspense } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';

// Componente que maneja la verificación
function VerificationForm() {
    const [verificationCode, setVerificationCode] = useState('');
    const [isResending, setIsResending] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVerificationCode(e.target.value);
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/verify-email`, {
                email: email,
                code: parseInt(verificationCode)
            });
            if (response.data.success === true) {
                toast.success("Verificación exitosa. Ahora puede iniciar sesión.");
                router.push('/auth/login');
            }
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Error al verificar el código');
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/resend-verification-code`, {
                email: email
            });
            toast.success("Código de verificación reenviado. Revise su correo.");
        } catch (error) {
            console.error('Error al reenviar el código:', error);
            toast.error('Error al reenviar el código de verificación');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-6 text-[#003366]">
                Verificación de Usuario
            </h1>

            <form onSubmit={handleVerify} className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                    <input
                        type="text"
                        name="verificationCode"
                        placeholder="Código de verificación"
                        value={verificationCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 text-gray-700 focus:outline-none"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#C62828] text-white py-3 rounded-lg hover:bg-red-700 transition duration-300"
                >
                    Verificar
                </button>
            </form>

            <button
                onClick={handleResendCode}
                className="w-full mt-4 bg-[#0078ba] text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
                disabled={isResending}
            >
                {isResending ? 'Reenviando...' : 'Reenviar código'}
            </button>
        </div>
    );
}

// Componente de carga fallback
function LoadingForm() {
    return (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

// Componente principal
export default function UserVerifyPage() {
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
                <Suspense fallback={<LoadingForm />}>
                    <VerificationForm />
                </Suspense>
            </main>
        </div>
    );
}