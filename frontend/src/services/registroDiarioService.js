// frontend/src/services/registroDiarioService.js
import apiClient from "./apiClient";

export const registroDiarioService = {
  crearRegistro: async (payload) => {
    const response = await apiClient.post("/registros-diarios/", payload);
    return response.data;
  },
};
