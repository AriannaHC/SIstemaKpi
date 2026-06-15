import { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";
import {
  Database,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Inbox,
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
  const [busqueda, setBusqueda] = useState("");
  const [filtroAlerta, setFiltroAlerta] = useState("todos");

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
          r.responsable.toLowerCase().includes(q)
      );
    }

    if (filtroAlerta !== "todos") {
      resultado = resultado.filter((r) => r.alerta === filtroAlerta);
    }

    setFiltered(resultado);
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
        <div className="flex items-center gap-3 text-sm">
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
        <select
          value={filtroAlerta}
          onChange={(e) => setFiltroAlerta(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all bg-white cursor-pointer"
        >
          <option value="todos">Todas las alertas</option>
          <option value="verde">🟢 Verde</option>
          <option value="amarillo">🟡 Amarillo</option>
          <option value="rojo">🔴 Rojo</option>
          <option value="gris">⚪ Gris</option>
        </select>
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
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
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
              <tbody>
                {filtered.map((reg, idx) => {
                  const esOmision = reg.estado === "no_reportado";
                  return (
                    <tr
                      key={reg.id}
                      className={`border-b border-slate-50 transition-colors ${
                        esOmision
                          ? "bg-rose-50/50 hover:bg-rose-50"
                          : idx % 2 === 0
                            ? "bg-white hover:bg-slate-50/80"
                            : "bg-slate-50/30 hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Periodo */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-600">
                          {formatFecha(reg.periodo_inicio)}
                        </span>
                        <span className="text-slate-300 mx-1">→</span>
                        <span className="text-xs font-medium text-slate-600">
                          {formatFecha(reg.periodo_fin)}
                        </span>
                      </td>

                      {/* Área */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {reg.area_nombre}
                        </span>
                      </td>

                      {/* KPI */}
                      <td className="px-5 py-4 max-w-[200px]">
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

                      {/* Responsable */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-600">
                          {reg.responsable}
                        </span>
                      </td>

                      {/* Valor */}
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

                      {/* Cumplimiento */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-700">
                          {formatCumplimiento(reg.cumplimiento)}
                        </span>
                      </td>

                      {/* Estado */}
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

                      {/* Alerta */}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
