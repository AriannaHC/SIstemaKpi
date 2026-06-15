import { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  XCircle,
  Inbox,
} from "lucide-react";
import Toast from "../components/Toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

function alertaConfig(alerta) {
  switch (alerta) {
    case "verde":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        text: "text-emerald-700",
        label: "Verde",
      };
    case "amarillo":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        dot: "bg-amber-500",
        text: "text-amber-700",
        label: "Amarillo",
      };
    case "rojo":
      return {
        bg: "bg-rose-50",
        border: "border-rose-200",
        dot: "bg-rose-500",
        text: "text-rose-700",
        label: "Rojo",
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        dot: "bg-slate-400",
        text: "text-slate-500",
        label: "Sin datos",
      };
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

export default function MisReportes() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getMisReportes();
      setReportes(data);
    } catch (err) {
      console.error(err);
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar tu historial de reportes.",
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
      <div>
        <h1
          className="text-3xl font-extrabold font-heading"
          style={{ color: COLOR_AZUL }}
        >
          Mis <span style={{ color: COLOR_NARANJA }}>Reportes</span>
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Historial completo de tus registros de KPIs.
        </p>
      </div>

      {/* ── Resumen rápido ── */}
      {reportes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Reportes",
              value: reportes.length,
              icon: <FileText className="w-5 h-5" />,
              color: COLOR_AZUL,
              bg: "bg-blue-50",
            },
            {
              label: "Enviados",
              value: reportes.filter((r) => r.estado === "enviado").length,
              icon: <CheckCircle2 className="w-5 h-5" />,
              color: "#059669",
              bg: "bg-emerald-50",
            },
            {
              label: "Omisiones",
              value: reportes.filter((r) => r.estado === "no_reportado").length,
              icon: <XCircle className="w-5 h-5" />,
              color: "#dc2626",
              bg: "bg-rose-50",
            },
            {
              label: "Alertas Rojas",
              value: reportes.filter((r) => r.alerta === "rojo").length,
              icon: <AlertTriangle className="w-5 h-5" />,
              color: "#dc2626",
              bg: "bg-rose-50",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.bg} rounded-3xl p-5 border border-white/60 shadow-sm`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 bg-white rounded-xl shadow-sm"
                  style={{ color: stat.color }}
                >
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-black" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista de Reportes ── */}
      {reportes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Inbox className="w-14 h-14 text-slate-200 mb-4" />
          <p
            className="font-black text-lg uppercase tracking-widest font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Sin Reportes Aún
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Tus registros aparecerán aquí una vez que completes un KPI.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reportes.map((reporte) => {
            const esOmision = reporte.estado === "no_reportado";
            const cfg = alertaConfig(reporte.alerta);

            return (
              <div
                key={reporte.id}
                className={`rounded-4xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col ${
                  esOmision
                    ? "bg-rose-50/70 border-rose-200"
                    : "bg-white border-slate-200"
                }`}
              >
                {/* Barra superior de alerta */}
                <div
                  className={`h-1.5 ${
                    esOmision
                      ? "bg-linear-to-r from-rose-400 to-rose-600"
                      : reporte.alerta === "verde"
                        ? "bg-linear-to-r from-emerald-400 to-emerald-600"
                        : reporte.alerta === "amarillo"
                          ? "bg-linear-to-r from-amber-400 to-amber-500"
                          : reporte.alerta === "rojo"
                            ? "bg-linear-to-r from-rose-400 to-rose-600"
                            : "bg-slate-200"
                  }`}
                />

                <div className="p-5 flex-1 flex flex-col">
                  {/* KPI Name + Estado */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3
                      className="text-sm font-black leading-tight flex-1"
                      style={{ color: esOmision ? "#991b1b" : COLOR_AZUL }}
                    >
                      {reporte.kpi_nombre}
                    </h3>
                    {esOmision ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">
                        <XCircle className="w-3 h-3" /> Omisión
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Enviado
                      </span>
                    )}
                  </div>

                  {/* Datos */}
                  <div className="space-y-3 flex-1">
                    {/* Periodo */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">
                        {formatFecha(reporte.periodo_inicio)} →{" "}
                        {formatFecha(reporte.periodo_fin)}
                      </span>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Valor Semanal
                        </p>
                        <p
                          className="text-lg font-black"
                          style={{ color: COLOR_AZUL }}
                        >
                          {reporte.valor_semanal !== null &&
                          reporte.valor_semanal !== undefined
                            ? Number(reporte.valor_semanal).toFixed(2)
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Cumplimiento
                        </p>
                        <p
                          className="text-lg font-black"
                          style={{ color: COLOR_AZUL }}
                        >
                          {formatCumplimiento(reporte.cumplimiento)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Semáforo */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-2 ${cfg.bg} ${cfg.border} border px-3 py-1.5 rounded-full`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`}
                        />
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                      </span>
                      {reporte.enviado_en && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatFecha(reporte.enviado_en)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Etiqueta especial para omisiones */}
                {esOmision && (
                  <div className="bg-rose-100 border-t border-rose-200 px-5 py-3">
                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Cerrado por sistema — Fecha vencida sin llenado
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
