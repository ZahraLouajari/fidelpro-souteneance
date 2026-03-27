import axios from 'axios';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: '/api', // Will be proxied by Vite to http://localhost:8000/api
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response?.data?.error);
    }
    
    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;