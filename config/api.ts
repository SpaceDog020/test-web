// utils/axiosConfig.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Interceptor para agregar el token a las solicitudes
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar la expiración del token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = Cookies.get('refresh_token');

    if (error.response.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        if (response.data.access_token) {
          Cookies.set('access_token', response.data.access_token, { expires: Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRES) });
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
          return axiosInstance(originalRequest);
        }

        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Router.push('auth/login');

      } catch (refreshError) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        Router.push('auth/login');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;