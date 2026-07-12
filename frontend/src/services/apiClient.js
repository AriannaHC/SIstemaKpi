import axios from "axios";

const apiClient = axios.create({
  // Lee la variable de entorno, si falla usa el localhost por defecto
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Antes de que salga cualquier petición, le pegamos el token
apiClient.interceptors.request.use(
  (config) => {
    // Buscamos el token donde Login.jsx lo guardó
    const token =
      localStorage.getItem("kpi_token") || sessionStorage.getItem("kpi_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
