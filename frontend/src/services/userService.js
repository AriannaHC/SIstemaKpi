// frontend/src/services/userService.js
import apiClient from './apiClient';

export const userService = {
  // Lista todos los usuarios activos (solo admin)
  getUsers: async () => {
    const response = await apiClient.get('/users/');
    return response.data;
  },

  // Roles disponibles para el <select>
  getRoles: async () => {
    const response = await apiClient.get('/users/roles');
    return response.data;
  },

  // Actualiza rol y área de un usuario
  updateUser: async (userId, kpi_rol_id, kpi_area_id) => {
    const payload = {
      kpi_rol_id: kpi_rol_id ?? null,
      kpi_area_id: kpi_area_id ?? null,
    };
    const response = await apiClient.put(`/users/${userId}`, payload);
    return response.data;
  },
};