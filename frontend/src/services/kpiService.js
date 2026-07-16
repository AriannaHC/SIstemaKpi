import apiClient from "./apiClient";

const CACHE_DURATION = 1000 * 60 * 5;
let areasStatsCache = { data: null, timestamp: 0 };
let dashboardCache = { data: null, timestamp: 0 };
let alertasCache = { data: null, timestamp: 0 };
let historialCache = { data: null, timestamp: 0 };

const invalidateAreasStatsCache = () => {
  areasStatsCache.data = null;
};

const invalidateDashboardCache = () => {
  dashboardCache.data = null;
};

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

export const getAlertas = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    alertasCache.data &&
    Date.now() - alertasCache.timestamp < CACHE_DURATION
  ) {
    return alertasCache.data;
  }
  const response = await apiClient.get("/kpis/alertas");
  alertasCache.data = response.data;
  alertasCache.timestamp = Date.now();
  return response.data;
};

export const getMisReportes = async () => {
  const response = await apiClient.get("/kpis/mis-reportes");
  return response.data;
};

export const getHistorial = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    historialCache.data &&
    Date.now() - historialCache.timestamp < CACHE_DURATION
  ) {
    return historialCache.data;
  }
  const response = await apiClient.get("/kpis/historial");
  historialCache.data = response.data;
  historialCache.timestamp = Date.now();
  return response.data;
};

export const getAreasStats = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    areasStatsCache.data &&
    Date.now() - areasStatsCache.timestamp < CACHE_DURATION
  ) {
    return areasStatsCache.data;
  }
  const response = await apiClient.get("/kpis/areas/stats");
  areasStatsCache.data = response.data;
  areasStatsCache.timestamp = Date.now();
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

  getDashboardData: async (forceRefresh = false) => {
    if (
      !forceRefresh &&
      dashboardCache.data &&
      Date.now() - dashboardCache.timestamp < CACHE_DURATION
    ) {
      return dashboardCache.data;
    }
    const response = await apiClient.get("/kpis/dashboard_data");
    dashboardCache.data = response.data;
    dashboardCache.timestamp = Date.now();
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
    invalidateAreasStatsCache();
    invalidateDashboardCache();
    return response.data;
  },

  deleteArea: async (areaId) => {
    const response = await apiClient.delete(`/kpis/areas/${areaId}`);
    invalidateAreasStatsCache();
    invalidateDashboardCache();
    return response.data;
  },

  deleteKpi: async (kpiId) => {
    const response = await apiClient.delete(`/kpis/kpi/${kpiId}`);
    invalidateAreasStatsCache();
    invalidateDashboardCache();
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
  getAlertas,
  getMisReportes,
  getHistorial,
  getAreasStats,
};
