// frontend/src/services/userService.js
import apiClient from "./apiClient";

const CACHE_DURATION = 1000 * 60 * 5;
let usersCache = { data: null, timestamp: 0 };

export const userService = {
  getUsers: async (forceRefresh = false) => {
    if (
      !forceRefresh &&
      usersCache.data &&
      Date.now() - usersCache.timestamp < CACHE_DURATION
    ) {
      return usersCache.data;
    }
    const response = await apiClient.get("/users/");
    usersCache.data = response.data;
    usersCache.timestamp = Date.now();
    return response.data;
  },

  // Trabajadores del área del jefe autenticado (solo rol 2)
  getMiEquipo: async () => {
    const response = await apiClient.get("/users/mi-equipo");
    return response.data;
  },

  // Roles disponibles para el <select>
  getRoles: async () => {
    const response = await apiClient.get("/users/roles");
    return response.data;
  },

  updateUser: async (userId, kpi_rol_id, kpi_area_id) => {
    const payload = {
      kpi_rol_id: kpi_rol_id ?? null,
      kpi_area_id: kpi_area_id ?? null,
    };
    const response = await apiClient.put(`/users/${userId}`, payload);
    usersCache.data = null;
    return response.data;
  },
};
