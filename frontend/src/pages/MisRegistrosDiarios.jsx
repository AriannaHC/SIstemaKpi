import React, { useState, useEffect, useMemo } from "react";
import { registroDiarioService } from "../services/registroDiarioService";
import {
  Search,
  Inbox,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Briefcase,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Toast from "../components/Toast";
import confetti from "canvas-confetti";

// ── Helpers ──
function formatFechaHora(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFechaCorta(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MisRegistrosDiarios({ showConfetti, onConfettiDone }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");

  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";
  const LIMIT = 16;

  const [page, setPage] = useState(1);

  useEffect(() => {
    // Si venimos de un guardado exitoso, forzamos refresh y lanzamos confeti
    cargarRegistros(showConfetti);
  }, []);

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 700,
        spread: 240,
        origin: { y: 0.6 },
        colors: ["#123498", "#F46F0B", "#ffffff"],
      });
      if (onConfettiDone) onConfettiDone();
    }
  }, [showConfetti]);

  const cargarRegistros = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await registroDiarioService.getMisRegistros(forceRefresh);
      setRegistros(data);
    } catch (err) {
      console.error(err);
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar tus registros diarios.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Lógica de Filtrado ──
  const registrosFiltrados = useMemo(() => {
    return registros.filter((reg) => {
      // 1. Búsqueda SOLO por entregable
      const matchBuscador = reg.entregable
        ?.toLowerCase()
        .includes(busqueda.toLowerCase());

      // 2. Filtro exacto por Fecha de Registro (YYYY-MM-DD)
      // reg.fecha_registro viene en formato ISO (ej. "2026-08-03T21:25:15.000Z")
      const matchFecha = fechaFiltro
        ? reg.fecha_registro && reg.fecha_registro.startsWith(fechaFiltro)
        : true;

      return matchBuscador && matchFecha;
    });
  }, [registros, busqueda, fechaFiltro]);

  // Resetear página al cambiar filtros
  useEffect(() => { setPage(1); }, [busqueda, fechaFiltro]);

  const totalPages = Math.max(1, Math.ceil(registrosFiltrados.length / LIMIT));
  const registrosPagina = registrosFiltrados.slice((page - 1) * LIMIT, page * LIMIT);

  // ── Renderizado ──
  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLOR_AZUL, borderTopColor: "transparent" }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      {/* ── Cabecera ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-extrabold font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Mis <span style={{ color: COLOR_NARANJA }}>Registros</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Historial de las actividades y entregables que reportaste.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span
            className="px-4 py-2 rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-sm"
            style={{ backgroundColor: COLOR_AZUL }}
          >
            {registros.length} reportes enviados
          </span>
        </div>
      </div>

      {/* ── Barra de Filtros (Simplificada y Directa) ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Buscador de Entregable */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre del entregable..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all font-medium"
          />
        </div>

        {/* Filtro de Fecha */}
        <div className="relative w-full md:w-48 shrink-0">
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-naranja focus:ring-2 focus:ring-naranja/10 transition-all font-medium text-slate-600"
          />
        </div>
      </div>

      {/* ── Grid de Cards ── */}
      {registrosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Inbox className="w-14 h-14 text-slate-200 mb-4" />
          <p
            className="font-black text-lg uppercase tracking-widest font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Sin Resultados
          </p>
          <p className="text-gray-500 text-sm mt-1">
            No se encontraron registros con la búsqueda actual.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {registrosPagina.map((reg) => {
            return (
              <div
                key={reg.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col h-full hover:shadow-md hover:border-[#123498]/40 transition-all duration-300"
              >
                {/* 1. Cabecera Minimalista */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {formatFechaCorta(reg.fecha_registro)}
                  </div>

                  {/* Plazo sutil a la derecha */}
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {formatFechaCorta(reg.fecha_inicio)} -{" "}
                    {formatFechaCorta(reg.fecha_entrega)}
                  </div>
                </div>

                {/* 2. Cuerpo: Entregable y Contexto */}
                <div className="flex-1 mb-3">
                  <h3
                    className="text-sm font-bold text-slate-800 leading-snug mb-3 line-clamp-2"
                    title={reg.entregable}
                  >
                    {reg.entregable}
                  </h3>

                  {/* Píldoras de contexto: Proceso, Actividad y Tarea apiladas */}
                  <div className="flex flex-col items-start gap-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100 max-w-full"
                      title={`Proceso: ${reg.proceso}`}
                    >
                      <Briefcase className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{reg.proceso}</span>
                    </span>

                    <span
                      className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-purple-100 max-w-full"
                      title={`Actividad: ${reg.tipo_actividad}`}
                    >
                      <Activity className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{reg.tipo_actividad}</span>
                    </span>

                    <span
                      className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-orange-100 max-w-full"
                      title={`Tarea: ${reg.tipo_tarea}`}
                    >
                      <FileText className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{reg.tipo_tarea}</span>
                    </span>
                  </div>
                </div>

                {/* 3. Pie: Estado de Auditorías Ultra Compacto */}
                <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Estado:
                  </span>

                  <div className="flex gap-2">
                    {/* Pastilla Calidad */}
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                        reg.auditado_calidad
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                      title={
                        reg.auditado_calidad
                          ? "Auditado por Calidad"
                          : "Pendiente de Calidad"
                      }
                    >
                      {reg.auditado_calidad ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      Calidad
                    </div>

                    {/* Pastilla Operaciones */}
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                        reg.auditado_operaciones
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                      title={
                        reg.auditado_operaciones
                          ? "Auditado por Operaciones"
                          : "Pendiente de Operaciones"
                      }
                    >
                      {reg.auditado_operaciones ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      Operaciones
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-3xl border border-slate-100 px-6 py-4 shadow-sm">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            {registrosFiltrados.length} registro{registrosFiltrados.length !== 1 ? "s" : ""} &mdash; Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-[#123498] hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" /> Anterior
            </button>

            {/* Números de página */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-2 text-[10px] font-black text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                        page === p
                          ? "bg-[#123498] text-white shadow-md shadow-[#123498]/20"
                          : "bg-white border border-slate-200 text-gray-500 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-[#123498] hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
