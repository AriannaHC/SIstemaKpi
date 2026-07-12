// frontend/src/components/RegistroDiarioPanelTable.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Edit,
  Inbox,
  CalendarRange,
  Building2,
  UserSearch,
  X,
  Activity,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  ImageIcon,
  Download,
  Loader2,
} from "lucide-react";
import { registroDiarioService } from "../services/registroDiarioService";
import Toast from "./Toast"; // Asegúrate de tener este componente accesible

const COLOR_AZUL = "#123498";
const COLOR_NARANJA = "#F46F0B";
const REGISTROS_POR_PAGINA = 30;

function formatFecha(fechaIso) {
  try {
    if (!fechaIso) return "-";
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return fechaIso;
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return fechaIso;
  }
}

export default function RegistroDiarioPanelTable({
  registros,
  isLoading,
  errorMessage,
  area,
  onEdit,
}) {
  // ── Filtros ──────────────────────────────────────────────────────────────
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroRangoActivo, setFiltroRangoActivo] = useState(false);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroTrabajador, setFiltroTrabajador] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  // ── Estados UI ───────────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState(null);
  const [imagenModalUrl, setImagenModalUrl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Opciones únicas derivadas de los datos
  const areasUnicas = useMemo(() => {
    if (!registros || registros.length === 0) return [];
    const set = new Set(registros.map((r) => r.area_nombre).filter(Boolean));
    return [...set].sort();
  }, [registros]);

  const trabajadoresUnicos = useMemo(() => {
    if (!registros || registros.length === 0) return [];
    const set = new Set(
      registros.map((r) => r.trabajador_nombre).filter(Boolean),
    );
    return [...set].sort();
  }, [registros]);

  const estadosUnicos = useMemo(() => {
    if (!registros || registros.length === 0) return [];
    const campo =
      area === "calidad"
        ? "estado_entregable_calidad"
        : "estado_tarea_operaciones";
    const set = new Set(registros.map((r) => r[campo]).filter(Boolean));
    return [...set].sort();
  }, [registros, area]);

  // Registros filtrados
  const registrosFiltrados = useMemo(() => {
    if (!registros) return [];
    return registros.filter((r) => {
      const fechaRegistro = r.fecha_registro?.split("T")[0];
      if (filtroRangoActivo) {
        if (filtroFechaDesde && fechaRegistro < filtroFechaDesde) return false;
        if (filtroFechaHasta && fechaRegistro > filtroFechaHasta) return false;
      } else {
        if (filtroFecha && fechaRegistro !== filtroFecha) return false;
      }
      if (filtroArea && r.area_nombre !== filtroArea) return false;
      if (filtroTrabajador && r.trabajador_nombre !== filtroTrabajador)
        return false;
      if (filtroEstado) {
        const campo =
          area === "calidad"
            ? "estado_entregable_calidad"
            : "estado_tarea_operaciones";
        if (r[campo] !== filtroEstado) return false;
      }
      return true;
    });
  }, [
    registros,
    filtroFecha,
    filtroRangoActivo,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroArea,
    filtroTrabajador,
    filtroEstado,
    area,
  ]);

  const hayFiltrosActivos =
    filtroFecha ||
    filtroFechaDesde ||
    filtroFechaHasta ||
    filtroArea ||
    filtroTrabajador ||
    filtroEstado;

  const limpiarFiltros = () => {
    setFiltroFecha("");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setFiltroArea("");
    setFiltroTrabajador("");
    setFiltroEstado("");
    setPaginaActual(1);
    setExpandedId(null);
  };

  useEffect(() => {
    setPaginaActual(1);
    setExpandedId(null);
  }, [
    filtroFecha,
    filtroRangoActivo,
    filtroFechaDesde,
    filtroFechaHasta,
    filtroArea,
    filtroTrabajador,
    filtroEstado,
  ]);

  // ── Exportar a Excel ──
  const handleExportExcel = async () => {
    if (registrosFiltrados.length === 0) {
      setFeedback({
        tipo: "error",
        mensaje: "No hay registros para exportar con estos filtros.",
      });
      return;
    }

    setIsExporting(true);
    setFeedback(null);

    try {
      const filtros = {
        fecha: filtroRangoActivo ? "" : filtroFecha,
        fechaDesde: filtroRangoActivo ? filtroFechaDesde : "",
        fechaHasta: filtroRangoActivo ? filtroFechaHasta : "",
        area: filtroArea,
        trabajador: filtroTrabajador,
        estado: filtroEstado,
      };

      const blob = await registroDiarioService.exportarExcel(area, filtros);

      // Generar nombre de archivo dinámico
      let filename = `Listado_Registros_${area === "calidad" ? "Calidad" : "Operaciones"}`;
      if (filtroRangoActivo && filtroFechaDesde && filtroFechaHasta) {
        filename += `_${filtroFechaDesde}_al_${filtroFechaHasta}`;
      } else if (filtroFecha) {
        filename += `_${filtroFecha}`;
      }
      if (filtroArea) {
        filename += `_${filtroArea.replace(/\s+/g, "")}`;
      }
      filename += ".xlsx";

      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setFeedback({ tipo: "ok", mensaje: "¡Excel descargado con éxito!" });
    } catch (error) {
      console.error(error);
      setFeedback({
        tipo: "error",
        mensaje: "Hubo un error al generar el archivo Excel.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Paginación ──────────────────────────────────────────────────────────
  const totalPaginas = Math.max(
    1,
    Math.ceil(registrosFiltrados.length / REGISTROS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const registrosPagina = useMemo(() => {
    const inicio = (paginaSegura - 1) * REGISTROS_POR_PAGINA;
    return registrosFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [registrosFiltrados, paginaSegura]);

  // ── DEFINICIÓN DE COLUMNAS ──
  const columnasBase =
    area === "calidad"
      ? ["Fecha", "Trabajador", "Proceso"]
      : ["Fecha", "Trabajador"];
  const columnasDinamicas =
    area === "calidad"
      ? ["Tipo Act.", "Entregable", "Est. Calidad", "Eficiencia", "Tasa Cal."]
      : ["Tipo Tarea", "Prioridad", "Est. Operativo", "Días Venc.", "Retraso"];
  const columnasTotales = [...columnasBase, ...columnasDinamicas, "Acciones"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-3">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLOR_AZUL, borderTopColor: "transparent" }}
        ></div>
        Cargando registros del historial...
      </div>
    );
  }

  if (errorMessage)
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-6 text-center font-semibold">
        {errorMessage}
      </div>
    );

  if (!registros || registros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Inbox className="w-14 h-14 text-slate-200 mb-4" />
        <p
          className="font-black text-lg uppercase tracking-widest font-heading"
          style={{ color: COLOR_AZUL }}
        >
          Sin historial
        </p>
      </div>
    );
  }

  return (
    <>
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      <div className="bg-white rounded-4xl shadow-xl border border-slate-100 p-4 md:p-6">
        {/* ── Encabezado y Paginación ── */}
        <div className="mb-4 md:mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-slate-500 border border-slate-200">
              {hayFiltrosActivos
                ? `${registrosFiltrados.length} resultados`
                : `${registros.length} registros`}
            </span>

            {/* BOTÓN EXPORTAR EXCEL */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting || registrosFiltrados.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando
                  Excel...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Exportar Excel
                </>
              )}
            </button>
          </div>

          <nav aria-label="Paginación de registros">
            <div
              className="inline-flex rounded-xl shadow-sm -space-x-px"
              role="group"
            >
              <button
                onClick={() => {
                  setPaginaActual((p) => Math.max(1, p - 1));
                  setExpandedId(null);
                }}
                disabled={paginaSegura <= 1}
                className="inline-flex items-center justify-center bg-white rounded-l-xl border border-slate-200 hover:bg-slate-50 focus:ring-2 focus:ring-[#123498]/20 w-9 h-9 text-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="inline-flex shrink-0 text-xs items-center justify-center text-slate-600 bg-white border border-slate-200 font-bold leading-5 px-3 h-9 tabular-nums">
                {paginaSegura} de {totalPaginas}
              </span>
              <button
                onClick={() => {
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1));
                  setExpandedId(null);
                }}
                disabled={paginaSegura >= totalPaginas}
                className="inline-flex items-center justify-center bg-white rounded-r-xl border border-slate-200 hover:bg-slate-50 focus:ring-2 focus:ring-[#123498]/20 w-9 h-9 text-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>

        {/* ── Barra de filtros ── */}
        <div className="mb-4 md:mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${filtroRangoActivo ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}
          >
            <div
              className={`flex flex-col justify-end ${filtroRangoActivo ? "sm:col-span-2 lg:col-span-2" : ""}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] flex items-center gap-1.5">
                  <CalendarRange
                    className="w-3 h-3"
                    style={{ color: COLOR_NARANJA }}
                  />
                  {filtroRangoActivo ? "Rango de Fechas" : "Fecha"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroRangoActivo(!filtroRangoActivo);
                    setFiltroFecha("");
                    setFiltroFechaDesde("");
                    setFiltroFechaHasta("");
                  }}
                  className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: filtroRangoActivo ? COLOR_AZUL : "white",
                    color: filtroRangoActivo ? "white" : COLOR_AZUL,
                    border: `1px solid ${filtroRangoActivo ? COLOR_AZUL : "#cbd5e1"}`,
                  }}
                >
                  {filtroRangoActivo ? "Fecha exacta" : "Rango"}
                </button>
              </div>

              {filtroRangoActivo ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                  />
                  <span className="text-slate-300 font-bold">-</span>
                  <input
                    type="date"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                  />
                </div>
              ) : (
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                />
              )}
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.18em]">
                <span className="flex items-center gap-1.5">
                  <Building2
                    className="w-3 h-3"
                    style={{ color: COLOR_NARANJA }}
                  />{" "}
                  Área
                </span>
              </label>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
              >
                <option value="">Todas las áreas</option>
                {areasUnicas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.18em]">
                <span className="flex items-center gap-1.5">
                  <UserSearch
                    className="w-3 h-3"
                    style={{ color: COLOR_NARANJA }}
                  />{" "}
                  Trabajador
                </span>
              </label>
              <select
                value={filtroTrabajador}
                onChange={(e) => setFiltroTrabajador(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
              >
                <option value="">Todos los trabajadores</option>
                {trabajadoresUnicos.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.18em]">
                <span className="flex items-center gap-1.5">
                  <Filter
                    className="w-3 h-3"
                    style={{ color: COLOR_NARANJA }}
                  />{" "}
                  Estado
                </span>
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
              >
                <option value="">Todos los estados</option>
                {estadosUnicos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={!hayFiltrosActivos}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor: hayFiltrosActivos ? COLOR_AZUL : "#e2e8f0",
                  color: hayFiltrosActivos ? COLOR_AZUL : "#94a3b8",
                  backgroundColor: hayFiltrosActivos
                    ? "#123498" + "08"
                    : "white",
                }}
              >
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* ── Contenido: Tabla ── */}
        {registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Inbox className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold">
              No hay registros que coincidan con los filtros.
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-2 text-xs font-bold underline transition-colors hover:text-[#123498]"
              style={{ color: COLOR_AZUL }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {columnasTotales.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {registrosPagina.map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      {/* FILA PRINCIPAL */}
                      <tr
                        className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? "bg-slate-50/70" : ""}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {formatFecha(r.fecha_registro)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">
                          {r.trabajador_nombre}
                        </td>

                        {area === "calidad" && (
                          <td
                            className="px-4 py-3 text-slate-600 max-w-[150px] truncate"
                            title={r.proceso}
                          >
                            {r.proceso}
                          </td>
                        )}

                        {area === "calidad" ? (
                          <>
                            <td className="px-4 py-3 text-slate-600">
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                {r.tipo_actividad}
                              </span>
                            </td>
                            <td
                              className="px-4 py-3 max-w-[150px] truncate text-slate-500"
                              title={r.entregable}
                            >
                              {r.entregable}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {r.estado_entregable_calidad || "-"}
                            </td>
                            <td className="px-4 py-3 text-emerald-600 font-bold">
                              {r.eficiencia
                                ? r.eficiencia.toFixed(1) + "%"
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-emerald-600 font-bold">
                              {r.tasa_calidad
                                ? r.tasa_calidad.toFixed(1) + "%"
                                : "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-slate-600">
                              <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                                {r.tipo_tarea}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {r.prioridad || "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {r.estado_tarea_operaciones || "-"}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-700">
                              {r.dias_vencimiento ?? "-"}
                            </td>
                            <td
                              className="px-4 py-3 text-slate-600 truncate max-w-[120px]"
                              title={r.motivo_retraso}
                            >
                              {r.motivo_retraso || "-"}
                            </td>
                          </>
                        )}

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRow(r.id)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${isExpanded ? "bg-slate-200 border-slate-300 text-slate-700" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                            >
                              {isExpanded ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}{" "}
                              {isExpanded ? "Ocultar" : "Detalle"}
                            </button>
                            <button
                              onClick={() => onEdit(r.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#123498] hover:bg-[#123498] hover:text-white hover:border-[#123498] transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" /> Editar
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* FILA DESPLEGABLE (DETALLE) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                          <td colSpan={columnasTotales.length} className="p-0">
                            <div className="px-6 py-4 animate-in slide-in-from-top-2 duration-300">
                              <div
                                className={`grid grid-cols-1 gap-4 mb-4 ${area === "operaciones" ? "md:grid-cols-6" : "md:grid-cols-5"}`}
                              >
                                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                    Área del trabajador
                                  </p>
                                  <p
                                    className="text-sm font-semibold text-slate-700 truncate"
                                    title={r.area_nombre}
                                  >
                                    {r.area_nombre || "-"}
                                  </p>
                                </div>
                                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                    Fecha Inicio
                                  </p>
                                  <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                    {formatFecha(r.fecha_inicio)}
                                  </p>
                                </div>
                                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                    Fecha Límite
                                  </p>
                                  <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                    {formatFecha(r.fecha_entrega)}
                                  </p>
                                </div>

                                {area === "calidad" ? (
                                  <>
                                    <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                        Estado de Ánimo
                                      </p>
                                      <p className="text-sm font-semibold text-slate-700">
                                        {r.estado_animo || "-"}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                        <p
                                          className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5"
                                          title="Tiempo Estándar / Real"
                                        >
                                          T. Est / T. Real
                                        </p>
                                        <p className="text-sm font-semibold text-slate-700">
                                          {r.tiempo_estandar || "0"}h /{" "}
                                          {r.tiempo_real_calidad || "0"}h
                                        </p>
                                      </div>
                                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                          Errores
                                        </p>
                                        <p className="text-sm font-semibold text-red-600">
                                          {r.errores_observaciones || "0"}
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                        Responsable
                                      </p>
                                      <p
                                        className="text-sm font-semibold text-slate-700 truncate"
                                        title={r.responsable_asigna}
                                      >
                                        {r.responsable_asigna || "-"}
                                      </p>
                                    </div>
                                    <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                        Validación Líder
                                      </p>
                                      <p className="text-sm font-semibold text-slate-700">
                                        {r.validacion_lider || "-"}
                                      </p>
                                    </div>
                                    <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                        Actitud Colab.
                                      </p>
                                      <p className="text-sm font-semibold text-slate-700">
                                        {r.actitud_colaborador || "-"}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
                                    Descripción completa del entregable
                                  </p>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {r.entregable || "-"}
                                  </p>
                                </div>
                                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                  <div className="flex justify-between items-end mb-1.5">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                      {area === "calidad"
                                        ? "Rúbrica y Observaciones"
                                        : "Evidencia y Observaciones"}
                                    </p>
                                    {area === "calidad" && (
                                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                                        {r.rubrica_final || "Sin rúbrica"}
                                      </span>
                                    )}
                                  </div>
                                  {area === "operaciones" &&
                                    r.enlace_evidencia && (
                                      <a
                                        href={r.enlace_evidencia}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-[#123498] font-bold underline mb-1 block truncate"
                                      >
                                        Ver Enlace Adjunto
                                      </a>
                                    )}
                                  {area === "operaciones" &&
                                    r.imagen_evidencia && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setImagenModalUrl(
                                            `${backendUrl}${r.imagen_evidencia}`,
                                          )
                                        }
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F46F0B]/10 text-[#F46F0B] text-xs font-bold rounded-lg hover:bg-[#F46F0B] hover:text-white mb-2 transition-colors border border-[#F46F0B]/20 w-max"
                                      >
                                        <ImageIcon className="w-4 h-4" /> Ver
                                        Imagen Adjunta
                                      </button>
                                    )}
                                  <p className="text-xs text-slate-600 leading-relaxed italic mt-1">
                                    {area === "calidad"
                                      ? r.observaciones_calidad ||
                                        "Sin observaciones registradas."
                                      : r.observaciones_operaciones ||
                                        "Sin observaciones registradas."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL DE IMAGEN ── */}
      {imagenModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setImagenModalUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h4
                className="text-sm font-black uppercase tracking-widest"
                style={{ color: COLOR_AZUL }}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Imagen de Evidencia
              </h4>
              <button
                onClick={() => setImagenModalUrl(null)}
                className="p-2 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 hover:bg-rose-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50">
              <img
                src={imagenModalUrl}
                alt="Evidencia"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
