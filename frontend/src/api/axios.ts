import axios from 'axios';

const instance = axios.create({
  // Utilise l'URL de production si disponible, sinon localhost
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api', 
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
  },
});

// Interceptor باش يصيفط الـ Token في كاع الطلبات (Authorization)
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor باش يتشكا واش الـ Session تسلات (401)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default instance;