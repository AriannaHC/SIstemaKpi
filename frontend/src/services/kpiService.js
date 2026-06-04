// services/kpiService.js
// ─────────────────────────────────────────────────────────────────────────────
// CORRECCIONES vs versión anterior:
//   1. getConfiguracion / saveConfiguracion: faltaba el prefijo /kpis/
//      Antes: /configuracion/{id}  →  Ahora: /kpis/configuracion/{id}
//   2. getDashboardData: faltaba el prefijo /kpis/
//      Antes: /dashboard_data      →  Ahora: /kpis/dashboard_data
//   3. deleteArea: ruta correcta ya tenía /areas/{id} pero sin el prefijo /kpis/
//      Ahora: /kpis/areas/{id}
//   4. deleteKpi: antes apuntaba a /kpis/{id} (chocaba con el prefijo del router)
//      Ahora: /kpis/kpi/{id}  — coincide con @router.delete("/kpi/{kpi_id}")
//   5. uploadAreaExcel / uploadSmartExcel: faltaba prefijo /kpis/
//      Ahora: /kpis/upload  y  /kpis/upload_smart
//   6. Añadido activarKpi para el toggle semanal del Dashboard
//   7. Todos los métodos envuelven en try/catch uniforme y re-lanzan el error
//      para que los componentes puedan manejarlo con .catch()
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from './apiClient';

export const kpiService = {

  // ── Estructura dinámica ──────────────────────────────────────────────────

  /** Lista de áreas según el rol del usuario autenticado */
  getAreas: async () => {
    const res = await apiClient.get('/kpis/areas');
    return res.data;
  },

  /** KPIs de un área específica */
  getKpisPorArea: async (areaId) => {
    const res = await apiClient.get(`/kpis/area/${areaId}`);
    return res.data;
  },

  /**
   * Campos dinámicos de un KPI.
   * Retorna: { campos: [...], kpi_meta: { meta_valor, meta_produccion, horas_planificadas } }
   */
  getCamposKpi: async (kpiId) => {
    const res = await apiClient.get(`/kpis/campos/${kpiId}`);
    return res.data;
  },

  // ── Registro de valores ──────────────────────────────────────────────────

  /**
   * Envía el registro de valores al backend.
   * Payload: { kpi_id, valores: { campo_key: valor, ... }, semana?, periodo_inicio?, periodo_fin? }
   */
  registrarValores: async (payload) => {
    const res = await apiClient.post('/kpis/registrar', payload);
    return res.data;
  },

  // ── Configuración del Mini Excel ─────────────────────────────────────────

  /**
   * Trae los campos de un KPI con origen y fórmula para editar en el Mini Excel.
   * Retorna: { formula_original: str, campos: [...] }
   * CORRECCIÓN: prefijo /kpis/ faltaba en la versión anterior.
   */
  getConfiguracion: async (kpiId) => {
    const res = await apiClient.get(`/kpis/configuracion/${kpiId}`);
    return res.data;
  },

  /**
   * Guarda el origen y fórmula_personalizada de cada campo.
   * Payload: { campos: [{ id, origen, formula_personalizada }] }
   * CORRECCIÓN: prefijo /kpis/ faltaba en la versión anterior.
   */
  saveConfiguracion: async (kpiId, payload) => {
    const res = await apiClient.post(`/kpis/configuracion/${kpiId}`, payload);
    return res.data;
  },

  // ── Dashboard ────────────────────────────────────────────────────────────

  /**
   * Estructura completa Area → [KPIs] para el panel de administración.
   * CORRECCIÓN: prefijo /kpis/ faltaba en la versión anterior.
   */
  getDashboardData: async () => {
    const res = await apiClient.get('/kpis/dashboard_data');
    return res.data;
  },

  /** Toggle activo_semanal de un KPI (máximo 3 activos por área) */
  activarKpi: async (kpiId) => {
    const res = await apiClient.post(`/kpis/${kpiId}/activar`);
    return res.data;
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Elimina un área y todos sus KPIs en cascada.
   * CORRECCIÓN: prefijo /kpis/ faltaba.
   */
  deleteArea: async (areaId) => {
    const res = await apiClient.delete(`/kpis/areas/${areaId}`);
    return res.data;
  },

  /**
   * Elimina un KPI y todos sus registros.
   * CORRECCIÓN: el endpoint del backend es /kpi/{id} (singular), no /kpis/{id}.
   * La versión anterior producía un 404 al chocar con el prefijo del router.
   */
  deleteKpi: async (kpiId) => {
    const res = await apiClient.delete(`/kpis/kpi/${kpiId}`);
    return res.data;
  },

  // ── Importación de Excel ──────────────────────────────────────────────────

  /**
   * Sube el Excel de área y crea KPIs + campos dinámicos.
   * CORRECCIÓN: prefijo /kpis/ faltaba.
   */
  uploadAreaExcel: async (formData) => {
    const res = await apiClient.post('/kpis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Sube el diccionario SMART y autoconfigura fórmulas Positivo/Negativo.
   * CORRECCIÓN: prefijo /kpis/ faltaba.
   */
  uploadSmartExcel: async (formData) => {
    const res = await apiClient.post('/kpis/upload_smart', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};