// frontend/src/services/registroDiarioService.js
import apiClient from "./apiClient";

const CACHE_DURATION = 1000 * 60 * 5;
let panelCache = {
  operaciones: null,
  calidad: null,
  timestampOperaciones: 0,
  timestampCalidad: 0,
};

export const registroDiarioService = {
  crearRegistro: async (payload) => {
    const response = await apiClient.post("/registros-diarios", payload);
    return response.data;
  },

  getPanelOperaciones: async (forceRefresh = false) => {
    // Si hay caché válida y no forzamos recarga, devolver caché
    if (
      !forceRefresh &&
      panelCache.operaciones &&
      Date.now() - panelCache.timestampOperaciones < CACHE_DURATION
    ) {
      return panelCache.operaciones;
    }
    const response = await apiClient.get(
      "/registros-diarios/panel-operaciones",
    );
    panelCache.operaciones = response.data;
    panelCache.timestampOperaciones = Date.now();
    return response.data;
  },

  getPanelCalidad: async (forceRefresh = false) => {
    if (
      !forceRefresh &&
      panelCache.calidad &&
      Date.now() - panelCache.timestampCalidad < CACHE_DURATION
    ) {
      return panelCache.calidad;
    }
    const response = await apiClient.get("/registros-diarios/panel-calidad");
    panelCache.calidad = response.data;
    panelCache.timestampCalidad = Date.now();
    return response.data;
  },

  // Añadir dentro de registroDiarioService:
  getRegistroDetalle: async (id) => {
    const response = await apiClient.get(`/registros-diarios/${id}`);
    return response.data;
  },

  auditarCalidad: async (id, payload) => {
    const response = await apiClient.patch(
      `/registros-diarios/${id}/calidad`,
      payload,
    );
    // Limpiamos caché porque hubo actualización
    panelCache.calidad = null;
    return response.data;
  },

  auditarOperaciones: async (id, payload) => {
    const response = await apiClient.patch(
      `/registros-diarios/${id}/operaciones`,
      payload,
    );
    // Limpiamos caché porque hubo actualización
    panelCache.operaciones = null;
    return response.data;
  },

  exportarExcel: async (area, filtros) => {
    const paramsObj = {
      area_panel: area,
      fecha: filtros.fecha,
      fecha_desde: filtros.fechaDesde,
      fecha_hasta: filtros.fechaHasta,
      area_filtro: filtros.area,
      trabajador: filtros.trabajador,
      estado: filtros.estado,
    };

    // Solo incluir claves con valor real (evita mandar "" al backend)
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(paramsObj).filter(
          ([, v]) => v !== undefined && v !== null && v !== "",
        ),
      ),
    );

    const response = await apiClient.get(
      `/registros-diarios/exportar-excel?${params.toString()}`,
      { responseType: "blob" },
    );
    return response.data;
  },
};
