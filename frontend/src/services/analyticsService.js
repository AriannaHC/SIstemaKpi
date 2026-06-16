// frontend/src/services/analyticsService.js
import apiClient from "./apiClient";

export const analyticsService = {
  // 1. Participación (Para Analítica)
  getParticipacion: async (areaId = "") => {
    const params = areaId && areaId !== "todas" ? `?area_id=${areaId}` : "";
    const response = await apiClient.get(`/analytics/participacion${params}`);
    return response.data;
  },

  // 2. Evolución (Para Analítica)
  getEvolucion: async (areaId = "") => {
    const params = areaId && areaId !== "todas" ? `?area_id=${areaId}` : "";
    const response = await apiClient.get(`/analytics/evolucion${params}`);
    return response.data;
  },

  // 3. Comparativa entre dos Áreas (Para Comparativas)
  compararAreas: async (areaA, areaB) => {
    if (!areaA || !areaB) return [];
    const response = await apiClient.get(
      `/analytics/comparar-areas?area_a=${areaA}&area_b=${areaB}`,
    );
    return response.data;
  },

  // 4. Comparativa entre dos Trabajadores (Para Comparativas)
  compararTrabajadores: async (userA, userB) => {
    if (!userA || !userB) return [];
    const response = await apiClient.get(
      `/analytics/comparar-trabajadores?user_a=${userA}&user_b=${userB}`,
    );
    return response.data;
  },
};
