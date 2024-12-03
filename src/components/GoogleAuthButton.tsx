// src/components/GoogleAuthButton.tsx
import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

interface GoogleJwtPayload {
  email: string;
  given_name: string;
  family_name: string;
  sub: string;  // Este es el google_id
}

const GoogleAuthButton = () => {
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No se recibieron credenciales de Google');
      }

      // Decodificar el token JWT
      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);

      // Preparar los datos según tu DTO
      const googleAuthData = {
        email: decoded.email,
        first_name: decoded.given_name,
        last_name: decoded.family_name,
        google_id: decoded.sub
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`,
        googleAuthData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { data } = response;

      if (data.access_token && data.refresh_token) {
        Cookies.set('access_token', data.access_token, { 
          expires: Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        Cookies.set('refresh_token', data.refresh_token, { 
          expires: Number(process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRES),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        toast.success('Autenticación exitosa');
        router.push('/home');
      } 
      else if (data.requiresVerification && data.email) {
        toast.info('Por favor verifica tu correo electrónico');
        router.push(`/auth/user-verify?email=${encodeURIComponent(data.email)}`);
      }
      else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error en autenticación de Google:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Error en la autenticación';
        toast.error(errorMessage);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
      } else {
        toast.error('Error en la autenticación con Google');
      }
    }
  };

  return (
    <div className="w-full flex justify-center my-4">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => toast.error('Error en la autenticación con Google')}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="100%"
        useOneTap={false}
      />
    </div>
  );
};

export default GoogleAuthButton;