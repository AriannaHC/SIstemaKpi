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
    // ¡ATENCIÓN! Barra final eliminada para compatibilidad con NestJS
    const response = await apiClient.get("/users");
    usersCache.data = response.data;
    usersCache.timestamp = Date.now();
    return response.data;
  },

  getMiEquipo: async () => {
    const response = await apiClient.get("/users/mi-equipo");
    return response.data;
  },

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
