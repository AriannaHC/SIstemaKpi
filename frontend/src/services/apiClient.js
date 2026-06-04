import axios from 'axios';

const apiClient = axios.create({
  // Asegúrate de que apunte a la URL de tu FastAPI
  baseURL: 'http://127.0.0.1:8000/api', 
});

// Interceptor: Antes de que salga cualquier petición, le pegamos el token
apiClient.interceptors.request.use(
  (config) => {
    // Buscamos el token donde Login.jsx lo guardó
    const token = localStorage.getItem('kpi_token') || sessionStorage.getItem('kpi_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;