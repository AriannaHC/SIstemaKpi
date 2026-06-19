// frontend/src/services/analyticsService.js
import apiClient from "./apiClient";

export const analyticsService = {
  // 1. Participación (Para Analítica)
  getParticipacion: async (areaId = "", mes = "", anio = "") => {
    const params = new URLSearchParams();
    if (areaId && areaId !== "todas") params.append("area_id", areaId);
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    const qs = params.toString();
    const response = await apiClient.get(`/analytics/participacion${qs ? "?" + qs : ""}`);
    return response.data;
  },

  // 2. Evolución (Para Analítica)
  getEvolucion: async (areaId = "", mes = "", anio = "") => {
    const params = new URLSearchParams();
    if (areaId && areaId !== "todas") params.append("area_id", areaId);
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    const qs = params.toString();
    const response = await apiClient.get(`/analytics/evolucion${qs ? "?" + qs : ""}`);
    return response.data;
  },

  // 3. Perfil de Rendimiento (Para Analítica)
  getPerfil: async (areaId = "", mes = "", anio = "") => {
    const params = new URLSearchParams();
    if (areaId && areaId !== "todas") params.append("area_id", areaId);
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    const qs = params.toString();
    const response = await apiClient.get(`/analytics/perfil${qs ? "?" + qs : ""}`);
    return response.data;
  },

  // 3. Comparativa entre dos Áreas (Para Comparativas)
  compararAreas: async (areaA, areaB, mes = "", anio = "") => {
    if (!areaA || !areaB) return [];
    const params = new URLSearchParams();
    params.append("area_a", areaA);
    params.append("area_b", areaB);
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    const response = await apiClient.get(`/analytics/comparar-areas?${params.toString()}`);
    return response.data;
  },

  // 4. Comparativa entre dos Trabajadores (Para Comparativas)
  compararTrabajadores: async (userA, userB, mes = "", anio = "") => {
    if (!userA || !userB) return [];
    const params = new URLSearchParams();
    params.append("user_a", userA);
    params.append("user_b", userB);
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    const response = await apiClient.get(`/analytics/comparar-trabajadores?${params.toString()}`);
    return response.data;
  },

  // 5. Comparativa de Meses (Para Comparativas)
  compararMeses: async (areaId = "", mes = "", anio = "") => {
    const params = new URLSearchParams();
    if (areaId && areaId !== "todas") params.append("area_id", areaId);
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    const qs = params.toString();
    const response = await apiClient.get(`/analytics/comparar-meses${qs ? "?" + qs : ""}`);
    return response.data;
  },
};
