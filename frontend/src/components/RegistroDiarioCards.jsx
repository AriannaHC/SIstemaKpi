import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarRange,
  Building2,
  User,
  UserSearch,
  FileText,
  Inbox,
  X,
  ChevronDown,
} from "lucide-react";

const COLOR_AZUL = "#123498";
const COLOR_NARANJA = "#F46F0B";
const LOTE = 24;

export default function RegistroDiarioCards({ registros, onViewDetails, onFilteredCountChange }) {
  // ── Filtros ──────────────────────────────────────────────────────────────
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroTrabajador, setFiltroTrabajador] = useState("");

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

  // Registros filtrados
  const registrosFiltrados = useMemo(() => {
    if (!registros) return [];
    return registros.filter((r) => {
      if (filtroFecha) {
        const fechaRegistro = r.fecha_registro?.split("T")[0];
        if (fechaRegistro !== filtroFecha) return false;
      }
      if (filtroArea && r.area_nombre !== filtroArea) return false;
      if (filtroTrabajador && r.trabajador_nombre !== filtroTrabajador)
        return false;
      return true;
    });
  }, [registros, filtroFecha, filtroArea, filtroTrabajador]);

  const hayFiltrosActivos = filtroFecha || filtroArea || filtroTrabajador;

  // Notificar al padre la cantidad filtrada
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(registrosFiltrados.length, hayFiltrosActivos);
    }
  }, [registrosFiltrados.length, hayFiltrosActivos, onFilteredCountChange]);

  // ── Carga progresiva (Load More) ─────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(LOTE);

  // Reiniciar visibleCount cuando cambian los filtros
  useEffect(() => {
    setVisibleCount(LOTE);
  }, [filtroFecha, filtroArea, filtroTrabajador]);

  const registrosVisibles = registrosFiltrados.slice(0, visibleCount);
  const hayMasRegistros = visibleCount < registrosFiltrados.length;

  const limpiarFiltros = () => {
    setFiltroFecha("");
    setFiltroArea("");
    setFiltroTrabajador("");
  };

  // ── Estado vacío (sin datos originales) ────────────────────────────────
  if (!registros || registros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Inbox className="w-12 h-12 text-slate-200 mb-4" />
        <p className="font-black text-sm uppercase tracking-widest text-slate-400">
          Bandeja Limpia
        </p>
        <p className="text-xs text-slate-400 mt-1">
          No hay registros pendientes de auditoría.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Barra de filtros ──────────────────────────────────────────────── */}
      <div className="mb-4 md:mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filtro por Fecha */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.18em]">
              <span className="flex items-center gap-1.5">
                <CalendarRange
                  className="w-3 h-3"
                  style={{ color: COLOR_NARANJA }}
                />
                Fecha
              </span>
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
            />
          </div>

          {/* Filtro por Área */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.18em]">
              <span className="flex items-center gap-1.5">
                <Building2
                  className="w-3 h-3"
                  style={{ color: COLOR_NARANJA }}
                />
                Área
              </span>
            </label>
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
            >
              <option value="">Todas las áreas</option>
              {areasUnicas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Trabajador */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.18em]">
              <span className="flex items-center gap-1.5">
                <UserSearch
                  className="w-3 h-3"
                  style={{ color: COLOR_NARANJA }}
                />
                Trabajador
              </span>
            </label>
            <select
              value={filtroTrabajador}
              onChange={(e) => setFiltroTrabajador(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
            >
              <option value="">Todos los trabajadores</option>
              {trabajadoresUnicos.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Limpiar Filtros */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
              className="w-full flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: hayFiltrosActivos ? COLOR_AZUL : "#e2e8f0",
                color: hayFiltrosActivos ? COLOR_AZUL : "#94a3b8",
                backgroundColor: hayFiltrosActivos ? "#123498" + "08" : "white",
              }}
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenido: Cards o estado vacío filtrado ──────────────────────── */}
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {registrosVisibles.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <Building2 className="w-3 h-3" style={{ color: COLOR_NARANJA }} />
                    {r.area_nombre}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <CalendarRange className="w-3 h-3" />
                    {new Date(r.fecha_registro).toLocaleDateString("es-PE")}
                  </span>
                </div>

                <div className="flex-1 mb-4">
                  <p className="text-xs font-bold text-[#123498] flex items-center gap-1.5 mb-2">
                    <User className="w-3.5 h-3.5" />
                    {r.trabajador_nombre}
                  </p>
                  <p
                    className="text-sm font-semibold text-slate-700 line-clamp-2 leading-relaxed"
                    title={r.entregable}
                  >
                    "{r.entregable}"
                  </p>
                </div>

                <button
                  onClick={() => onViewDetails(r.id)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-[11px] uppercase tracking-widest py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ver más detalles
                </button>
              </div>
            ))}
          </div>

          {/* ── Botón "Ver más" ──────────────────────────────────────────── */}
          {hayMasRegistros && (
            <div className="flex flex-col items-center mt-6 gap-1">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + LOTE)}
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-all hover:bg-slate-50"
                style={{
                  borderColor: COLOR_AZUL + "30",
                  color: COLOR_AZUL,
                }}
              >
                <ChevronDown className="w-4 h-4" />
                Ver más registros
              </button>
              <span className="text-[10px] text-slate-400 font-semibold tabular-nums">
                Mostrando {registrosVisibles.length} de {registrosFiltrados.length}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
