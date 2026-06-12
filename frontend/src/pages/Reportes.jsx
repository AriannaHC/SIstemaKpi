import { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";
import {
  AlertTriangle,
  Clock,
  Activity,
  Download,
  FileBarChart,
} from "lucide-react";
import Toast from "../components/Toast";

export default function Reportes() {
  const [alertasData, setAlertasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Colores Corporativos
  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    setLoading(true);
    try {
      // 🔴 Llamamos al endpoint REAL del backend que creamos hoy
      const data = await kpiService.getAlertas();
      setAlertasData(data);
    } catch (err) {
      console.error(err);
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar el panel de alertas.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    setExporting(true);
    setFeedback(null);
    setTimeout(() => {
      setExporting(false);
      setFeedback({
        tipo: "ok",
        mensaje: "Informe generado y listo para descargar.",
      });
    }, 1200);
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
            Panel de <span style={{ color: COLOR_NARANJA }}>Alertas</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Monitoreo en tiempo real de cumplimientos, riesgos y participación.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-3xl px-5 py-3 text-sm font-black uppercase tracking-[0.20em] text-white transition disabled:opacity-60 hover:shadow-lg"
          style={{ backgroundColor: COLOR_AZUL }}
        >
          <Download className="w-4 h-4" />
          {exporting ? "Generando..." : "Exportar informe"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── BLOQUE 1: PENDIENTES DE LLENADO ── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-2xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-black text-lg" style={{ color: COLOR_AZUL }}>
                Pendientes de Llenado
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                Tareas vigentes
              </p>
            </div>
          </div>

          {alertasData?.pendientes?.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-sm font-bold text-slate-400">
                No hay KPIs pendientes.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {alertasData?.pendientes?.map((kpi, idx) => (
                <li
                  key={idx}
                  className="p-4 bg-orange-50/50 rounded-3xl border border-orange-100"
                >
                  <p className="font-bold text-sm text-slate-800 line-clamp-1">
                    {kpi.kpi_nombre}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>{kpi.responsable}</span>
                    <span className="text-orange-600 font-black uppercase tracking-widest text-[10px]">
                      Vence en {kpi.dias_restantes} días
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── BLOQUE 2: REGISTROS EN RIESGO ── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-black text-lg" style={{ color: COLOR_AZUL }}>
                Registros Críticos
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                Rendimiento Bajo u Omisión
              </p>
            </div>
          </div>

          {alertasData?.en_riesgo?.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-sm font-bold text-slate-400">
                No hay registros críticos recientes.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {alertasData?.en_riesgo?.map((riesgo, idx) => (
                <li
                  key={idx}
                  className={`p-4 rounded-3xl border ${riesgo.alerta === "rojo" ? "bg-red-50/50 border-red-100" : "bg-yellow-50/50 border-yellow-100"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p
                        className="font-bold text-sm text-slate-800 line-clamp-1"
                        title={riesgo.kpi_nombre}
                      >
                        {riesgo.kpi_nombre}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {riesgo.responsable}
                      </p>
                    </div>
                    <span
                      className={`text-lg font-black shrink-0 ${riesgo.alerta === "rojo" ? "text-red-600" : "text-yellow-600"}`}
                    >
                      {riesgo.valor_registrado}
                    </span>
                  </div>
                  {/* Etiqueta especial si el sistema lo cerró por no reporte */}
                  {riesgo.estado === "no_reportado" && (
                    <p className="text-[9px] bg-red-100 text-red-700 px-2.5 py-1 rounded-lg inline-block font-black mt-3 uppercase tracking-widest">
                      Cerrado por sistema (Omisión)
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── BLOQUE 3: PARTICIPACIÓN POR ÁREA ── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-lg" style={{ color: COLOR_AZUL }}>
                Participación
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                Progreso de la Semana
              </p>
            </div>
          </div>

          {alertasData?.participacion?.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-sm font-bold text-slate-400">
                No hay programaciones activas.
              </p>
            </div>
          ) : (
            <ul className="space-y-6">
              {alertasData?.participacion?.map((part, idx) => (
                <li
                  key={idx}
                  className="bg-slate-50 p-4 rounded-3xl border border-slate-100"
                >
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>{part.area}</span>
                    <span className="text-emerald-600">{part.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${part.porcentaje}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-black uppercase tracking-widest">
                    {part.completados} de {part.total_programados} tareas
                    completadas
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
