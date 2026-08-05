import React, { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";
import SelectCustom from "../components/SelectCustom";
import {
  Database,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart4,
  Activity,
  Target,
  FileText,
  Loader2,
} from "lucide-react";
import Toast from "../components/Toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

function alertaDot(alerta) {
  switch (alerta) {
    case "verde":
      return "bg-emerald-500";
    case "amarillo":
      return "bg-amber-500";
    case "rojo":
      return "bg-rose-500";
    default:
      return "bg-slate-400";
  }
}

function formatFecha(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCumplimiento(val) {
  if (val === null || val === undefined) return "—";
  return `${(val * 100).toFixed(1)}%`;
}

// ── Componente Principal ─────────────────────────────────────────────────────

export default function HistorialKPIs() {
  const [registros, setRegistros] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroAlerta, setFiltroAlerta] = useState("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para la Fila Desplegable (Acordeón)
  const [expandedId, setExpandedId] = useState(null);

  // Estado para el Badge seguidor del Mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringTable, setIsHoveringTable] = useState(false);

  const [exporting, setExporting] = useState(false);

  const handleExportarExcel = async () => {
    setExporting(true);
    try {
      // 1. Llamamos a nuestro servicio
      const blobData = await kpiService.exportarHistorialExcel();

      // 2. Creamos el link de descarga invisible
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      const fecha = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `Historial_KPIs_${fecha}.xlsx`);

      document.body.appendChild(link);
      link.click();

      // 3. Limpieza
      link.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({
        tipo: "success",
        mensaje: "¡Historial exportado con éxito!",
      });
    } catch (error) {
      setFeedback({ tipo: "error", mensaje: "Error al descargar el Excel." });
    } finally {
      setExporting(false);
    }
  };

  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    let resultado = registros;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(
        (r) =>
          r.kpi_nombre.toLowerCase().includes(q) ||
          r.area_nombre.toLowerCase().includes(q) ||
          r.responsable.toLowerCase().includes(q),
      );
    }

    if (filtroAlerta !== "todos") {
      resultado = resultado.filter((r) => r.alerta === filtroAlerta);
    }

    setFiltered(resultado);
    setCurrentPage(1);
    setExpandedId(null); // Cierra cualquier fila abierta al buscar
  }, [busqueda, filtroAlerta, registros]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getHistorial();
      setRegistros(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar el historial general.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setExpandedId(null); // Cierra detalles al cambiar de página
    }
  };

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      {/* ── Badge Seguidor del Mouse (Tooltip Flotante) ── */}
      {isHoveringTable && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 transition-transform duration-75 ease-out"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            backgroundColor: COLOR_AZUL,
            color: "white",
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Click para detalle
          </span>
        </div>
      )}

      {/* ── Cabecera ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-extrabold font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Historial <span style={{ color: COLOR_NARANJA }}>General</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Registro completo de todos los KPIs de la empresa.
          </p>
        </div>

        {/* BOTÓN Y BADGE JUNTOS */}
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={handleExportarExcel}
            disabled={exporting || filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generando Excel...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Exportar Excel
              </>
            )}
          </button>

          <span
            className="px-4 py-2 rounded-2xl font-black text-white text-xs uppercase tracking-widest"
            style={{ backgroundColor: COLOR_AZUL }}
          >
            {filtered.length} registros
          </span>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por KPI, área o responsable..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all"
          />
        </div>
        <SelectCustom
          value={filtroAlerta}
          onChange={setFiltroAlerta}
          options={[
            { value: "todos", label: "Todas las alertas" },
            { value: "verde", label: "🟢 Verde" },
            { value: "amarillo", label: "🟡 Amarillo" },
            { value: "rojo", label: "🔴 Rojo" },
            { value: "gris", label: "⚪ Gris" },
          ]}
        />
      </div>

      {/* ── Tabla ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Inbox className="w-14 h-14 text-slate-200 mb-4" />
          <p
            className="font-black text-lg uppercase tracking-widest font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Sin Resultados
          </p>
          <p className="text-gray-500 text-sm mt-1">
            No se encontraron registros con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div
            className="overflow-x-auto"
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
          >
            <table className="w-full min-w-225 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {[
                    "Periodo",
                    "Área",
                    "KPI",
                    "Responsable",
                    "Valor",
                    "Cumplimiento",
                    "Estado",
                    "Alerta",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                onMouseEnter={() => setIsHoveringTable(true)}
                onMouseLeave={() => setIsHoveringTable(false)}
              >
                {paginatedData.map((reg, idx) => {
                  const esOmision = reg.estado === "no_reportado";
                  const isExpanded = expandedId === reg.id;

                  return (
                    <React.Fragment key={reg.id}>
                      {/* FILA PRINCIPAL */}
                      <tr
                        onClick={() => toggleRow(reg.id)}
                        className={`transition-colors cursor-none relative ${
                          isExpanded
                            ? "bg-blue-50/30 border-b-0"
                            : "border-b border-slate-50"
                        } ${
                          esOmision
                            ? "hover:bg-rose-50/80"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-slate-600">
                            {formatFecha(reg.periodo_inicio)}
                          </span>
                          <span className="text-slate-300 mx-1">→</span>
                          <span className="text-xs font-medium text-slate-600">
                            {formatFecha(reg.periodo_fin)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {reg.area_nombre}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-50">
                          <p
                            className="text-xs font-bold truncate"
                            style={{
                              color: esOmision ? "#991b1b" : COLOR_AZUL,
                            }}
                            title={reg.kpi_nombre}
                          >
                            {reg.kpi_nombre}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-slate-600">
                            {reg.responsable}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="text-sm font-black"
                            style={{ color: COLOR_AZUL }}
                          >
                            {reg.valor_semanal !== null &&
                            reg.valor_semanal !== undefined
                              ? Number(reg.valor_semanal).toFixed(2)
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-slate-700">
                            {formatCumplimiento(reg.cumplimiento)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {esOmision ? (
                            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              <XCircle className="w-3 h-3" /> Omisión
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3" /> Enviado
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`h-3 w-3 rounded-full ${alertaDot(reg.alerta)} shadow-sm`}
                            />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {reg.alerta || "—"}
                            </span>
                          </span>
                        </td>
                      </tr>

                      {/* FILA DESPLEGABLE (DETALLES) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                          <td
                            colSpan={8}
                            className="p-0 cursor-default"
                            onMouseEnter={(e) => e.stopPropagation()}
                          >
                            <div className="p-6 md:p-8 animate-in slide-in-from-top-2 duration-300">
                              {/* Tarjeta Interna del Detalle */}
                              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                  <BarChart4 className="w-5 h-5 text-[#123498]" />
                                  <h3 className="text-sm font-black text-[#123498] uppercase tracking-widest">
                                    Desglose Analítico
                                  </h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                  {[
                                    {
                                      label: "Productividad",
                                      val: reg.productividad,
                                    },
                                    {
                                      label: "Eficiencia",
                                      val: reg.eficiencia,
                                    },
                                    { label: "Eficacia", val: reg.eficacia },
                                    {
                                      label: "Efectividad",
                                      val: reg.efectividad,
                                    },
                                    {
                                      label: "Rendimiento",
                                      val: reg.rendimiento,
                                    },
                                  ].map((stat, i) => (
                                    <div
                                      key={i}
                                      className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center"
                                    >
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        {stat.label}
                                      </p>
                                      <p className="text-lg font-black text-slate-800">
                                        {stat.val !== null &&
                                        stat.val !== undefined
                                          ? formatCumplimiento(stat.val)
                                          : "—"}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                      <FileText className="w-3.5 h-3.5" />{" "}
                                      Observaciones
                                    </h4>
                                    <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">
                                      {reg.observaciones ||
                                        "Sin observaciones registradas."}
                                    </p>
                                  </div>
                                  {reg.acciones_correctivas && (
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                                      <h4 className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" />{" "}
                                        Acciones Correctivas
                                      </h4>
                                      <p className="text-sm text-orange-900 font-medium whitespace-pre-wrap">
                                        {reg.acciones_correctivas}
                                      </p>
                                    </div>
                                  )}
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

          {/* ── Paginación ── */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filtered.length)} de{" "}
                {filtered.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#123498] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        currentPage === i + 1
                          ? "bg-[#123498] text-white shadow-md shadow-[#123498]/20"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#123498]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#123498] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
