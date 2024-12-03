// utils/withAuth.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const auth = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const router = useRouter();

    useEffect(() => {
      const accessToken = Cookies.get('access_token');
      if (!accessToken) {
        toast.error('Tu sesión ha expirado, por favor inicia sesión nuevamente');
        router.push('auth/login');
      }
    }, [router]);

    return React.createElement(WrappedComponent, props);
  };
};

export default auth;