import apiClient from "./apiClient";

// ── MÉTODOS NUEVOS ────────────────────────────────────────────────────────────

export const getKpisSemanales = async (areaId) => {
  const response = await apiClient.get(`/kpis/semanales/${areaId}`);
  return response.data;
};

export const programarKpi = async (kpiId, payload) => {
  const response = await apiClient.post(`/kpis/${kpiId}/programar`, payload);
  return response.data;
};

export const activarKpi = async (kpiId) => {
  const response = await apiClient.post(`/kpis/${kpiId}/activar`);
  return response.data;
};

export const asignarResponsable = async (kpiId, responsableId) => {
  const response = await apiClient.patch(`/kpis/${kpiId}/responsable`, {
    responsable_id: responsableId,
  });
  return response.data;
};

// ── MÉTODOS EXISTENTES (copia completa para que no pierdas nada) ──────────────

export const kpiService = {
  getAreas: async () => {
    const response = await apiClient.get("/kpis/areas");
    return response.data;
  },

  getKpisPorArea: async (areaId) => {
    const response = await apiClient.get(`/kpis/area/${areaId}`);
    return response.data;
  },

  getCampos: async (kpiId) => {
    const response = await apiClient.get(`/kpis/campos/${kpiId}`);
    return response.data;
  },

  getDiario: async () => {
    const response = await apiClient.get("/kpis/diario");
    return response.data;
  },

  registrar: async (payload) => {
    const response = await apiClient.post("/kpis/registrar", payload);
    return response.data;
  },

  getDashboardData: async () => {
    const response = await apiClient.get("/kpis/dashboard_data");
    return response.data;
  },

  getConfiguracion: async (kpiId) => {
    const response = await apiClient.get(`/kpis/configuracion/${kpiId}`);
    return response.data;
  },

  saveConfiguracion: async (kpiId, payload) => {
    const response = await apiClient.post(
      `/kpis/configuracion/${kpiId}`,
      payload,
    );
    return response.data;
  },

  deleteArea: async (areaId) => {
    const response = await apiClient.delete(`/kpis/areas/${areaId}`);
    return response.data;
  },

  deleteKpi: async (kpiId) => {
    const response = await apiClient.delete(`/kpis/kpi/${kpiId}`);
    return response.data;
  },

  uploadExcel: async (formData) => {
    const response = await apiClient.post("/kpis/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  uploadSmart: async (formData) => {
    const response = await apiClient.post("/kpis/upload_smart", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Expuestos también como named exports arriba
  getKpisSemanales,
  activarKpi,
  asignarResponsable,
  programarKpi,
};
