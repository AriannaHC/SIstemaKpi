import { useEffect, useMemo, useState } from "react";
import { kpiService } from "../services/kpiService";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Search,
} from "lucide-react";
import Toast from "../components/Toast";
import SelectCustom from "../components/SelectCustom";

const COLOR_AZUL = "#123498";
const COLOR_NARANJA = "#F46F0B";

function normalizar(texto) {
  return String(texto || "").toLowerCase();
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function reportHtml(alertasData, resumen) {
  const pendientes = alertasData?.pendientes || [];
  const riesgos = alertasData?.en_riesgo || [];
  const participacion = alertasData?.participacion || [];
  const hoy = new Date().toLocaleString("es-PE");

  const rowsPendientes = pendientes
    .map(
      (kpi) => `
        <tr>
          <td>${kpi.kpi_nombre}</td>
          <td>${kpi.area_nombre || "-"}</td>
          <td>${kpi.responsable || "-"}</td>
          <td>${kpi.dias_restantes ?? "-"} dias</td>
        </tr>`,
    )
    .join("");

  const rowsRiesgo = riesgos
    .map(
      (kpi) => `
        <tr>
          <td>${kpi.kpi_nombre}</td>
          <td>${kpi.area_nombre || "-"}</td>
          <td>${kpi.responsable || "-"}</td>
          <td>${kpi.alerta || "-"}</td>
          <td>${kpi.valor_registrado ?? "-"}</td>
        </tr>`,
    )
    .join("");

  const rowsParticipacion = participacion
    .map(
      (area) => `
        <tr>
          <td>${area.area}</td>
          <td>${area.completados}</td>
          <td>${area.total_programados}</td>
          <td>${area.porcentaje}%</td>
        </tr>`,
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <title>Informe Auditoria KPI JB</title>
        <style>
          body { font-family: Arial, sans-serif; color: #123498; margin: 32px; }
          h1 { margin: 0; font-size: 28px; }
          h2 { margin-top: 28px; font-size: 18px; color: #F46F0B; }
          p { color: #475569; }
          .brand { color: #F46F0B; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
          .stat { border: 1px solid #dbe3f0; border-radius: 12px; padding: 14px; }
          .label { font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: #64748b; }
          .value { font-size: 24px; font-weight: 800; margin-top: 6px; color: #123498; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { text-align: left; background: #f8fafc; color: #123498; }
          th, td { border: 1px solid #e2e8f0; padding: 9px; }
          .footer { margin-top: 28px; font-size: 11px; color: #64748b; }
          @media print { body { margin: 18px; } .stats { grid-template-columns: repeat(4, 1fr); } }
        </style>
      </head>
      <body>
        <h1>Sistema <span class="brand">KPI JB</span></h1>
        <p>Informe de auditoria generado el ${hoy}</p>
        <div class="stats">
          <div class="stat"><div class="label">KPIs revisados</div><div class="value">${resumen.total}</div></div>
          <div class="stat"><div class="label">Pendientes</div><div class="value">${resumen.pendientes}</div></div>
          <div class="stat"><div class="label">Criticos</div><div class="value">${resumen.criticos}</div></div>
          <div class="stat"><div class="label">Participacion</div><div class="value">${resumen.promedio}%</div></div>
        </div>
        <h2>Pendientes de llenado</h2>
        <table>
          <thead><tr><th>KPI</th><th>Area</th><th>Responsable</th><th>Vence</th></tr></thead>
          <tbody>${rowsPendientes || "<tr><td colspan='4'>Sin pendientes</td></tr>"}</tbody>
        </table>
        <h2>Registros criticos</h2>
        <table>
          <thead><tr><th>KPI</th><th>Area</th><th>Responsable</th><th>Alerta</th><th>Valor</th></tr></thead>
          <tbody>${rowsRiesgo || "<tr><td colspan='5'>Sin registros criticos</td></tr>"}</tbody>
        </table>
        <h2>Participacion por area</h2>
        <table>
          <thead><tr><th>Area</th><th>Completados</th><th>Total</th><th>Avance</th></tr></thead>
          <tbody>${rowsParticipacion || "<tr><td colspan='4'>Sin programaciones activas</td></tr>"}</tbody>
        </table>
        <p class="footer">Use la opcion Guardar como PDF del dialogo de impresion.</p>
      </body>
    </html>`;
}

export default function Reportes() {
  const [alertasData, setAlertasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const cargarAlertas = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getAlertas();
      setAlertasData(data);
    } catch {
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar el panel de alertas.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(cargarAlertas);
  }, []);

  const resumen = useMemo(() => {
    const pendientes = alertasData?.pendientes?.length || 0;
    const criticos = alertasData?.en_riesgo?.length || 0;
    const participacion = alertasData?.participacion || [];
    const promedio = participacion.length
      ? Math.round(
          participacion.reduce(
            (acc, item) => acc + Number(item.porcentaje || 0),
            0,
          ) / participacion.length,
        )
      : 0;

    return {
      pendientes,
      criticos,
      areas: participacion.length,
      promedio,
      total: pendientes + criticos,
    };
  }, [alertasData]);

  const auditoriaItems = useMemo(() => {
    const pendientes = (alertasData?.pendientes || []).map((kpi, index) => ({
      id: `pendiente-${index}`,
      tipo: "pendiente",
      titulo: kpi.kpi_nombre,
      area: kpi.area_nombre || "Sin area",
      responsable: kpi.responsable || "Sin asignar",
      detalle: `Vence en ${kpi.dias_restantes ?? "-"} dias`,
      fecha: kpi.fecha_fin,
      valor: "Pendiente",
    }));

    const riesgos = (alertasData?.en_riesgo || []).map((kpi, index) => ({
      id: `riesgo-${kpi.id_registro || index}`,
      tipo: kpi.alerta === "rojo" ? "critico" : "riesgo",
      titulo: kpi.kpi_nombre,
      area: kpi.area_nombre || "Sin area",
      responsable: kpi.responsable || "Sin asignar",
      detalle:
        kpi.estado === "no_reportado"
          ? "Cerrado por omision"
          : `Valor registrado: ${kpi.valor_registrado ?? "-"}`,
      fecha: kpi.fecha,
      valor: kpi.alerta || "riesgo",
    }));

    return [...pendientes, ...riesgos];
  }, [alertasData]);

  const itemsFiltrados = useMemo(() => {
    const query = normalizar(busqueda);
    return auditoriaItems.filter((item) => {
      const coincideFiltro = filtro === "todos" || item.tipo === filtro;
      const coincideBusqueda = [item.titulo, item.area, item.responsable].some(
        (value) => normalizar(value).includes(query),
      );
      return coincideFiltro && coincideBusqueda;
    });
  }, [auditoriaItems, busqueda, filtro]);

  const handleExport = () => {
    setExporting(true);
    const ventana = window.open("", "_blank", "width=1100,height=800");

    if (!ventana) {
      setExporting(false);
      setFeedback({
        tipo: "error",
        mensaje: "El navegador bloqueo la ventana de exportacion.",
      });
      return;
    }

    ventana.document.write(reportHtml(alertasData, resumen));
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
      setExporting(false);
      setFeedback({
        tipo: "ok",
        mensaje:
          "Informe listo. Guardalo como PDF desde la ventana de impresion.",
      });
    }, 350);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLOR_AZUL, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-turquesa">
            Auditoria y reportes
          </p>
          <h1
            className="text-3xl font-extrabold font-heading mt-2"
            style={{ color: COLOR_AZUL }}
          >
            Panel de <span style={{ color: COLOR_NARANJA }}>Alertas</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Vista compacta para revisar todos los KPIs activos y exportar el
            informe.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="min-h-12 inline-flex items-center justify-center gap-2 rounded-3xl px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition disabled:opacity-60 hover:shadow-lg"
          style={{ backgroundColor: COLOR_AZUL }}
        >
          <Download className="w-4 h-4" />
          {exporting ? "Generando..." : "Exportar PDF"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "KPIs revisados",
            value: resumen.total,
            icon: FileText,
            color: "text-azul",
            bg: "bg-azul/10",
          },
          {
            label: "Pendientes",
            value: resumen.pendientes,
            icon: Clock,
            color: "text-naranja",
            bg: "bg-naranja/10",
          },
          {
            label: "Criticos",
            value: resumen.criticos,
            icon: AlertTriangle,
            color: "text-rojo-persa",
            bg: "bg-rojo-persa/10",
          },
          {
            label: "Participacion",
            value: `${resumen.promedio}%`,
            icon: Activity,
            color: "text-turquesa",
            bg: "bg-turquesa/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-black text-azul font-heading">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_0.85fr] gap-6">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-azul font-heading">
                  KPIs de seguimiento
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar KPI, area o responsable"
                    className="w-full sm:w-72 h-11 rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-azul focus:ring-4 focus:ring-azul/10"
                  />
                </div>
                <SelectCustom
                  value={filtro}
                  onChange={setFiltro}
                  options={[
                    { value: "todos", label: "Todos" },
                    { value: "pendiente", label: "Pendientes" },
                    { value: "riesgo", label: "Riesgo" },
                    { value: "critico", label: "Criticos" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-slate-50/70">
            {itemsFiltrados.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-12 h-12 text-turquesa mx-auto mb-3" />
                <p className="text-sm font-black text-azul">
                  No hay KPIs para este filtro.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 max-h-140 overflow-y-auto pr-1">
                {itemsFiltrados.map((item) => {
                  const isCritico = item.tipo === "critico";
                  const isRiesgo = item.tipo === "riesgo";
                  return (
                    <article
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-azul-profundo truncate">
                            {item.titulo}
                          </p>
                          <p className="text-xs font-bold text-slate-500 mt-1 truncate">
                            {item.area} - {item.responsable}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                            isCritico
                              ? "bg-rojo-persa/10 text-rojo-persa"
                              : isRiesgo
                                ? "bg-amarillo-hansa/20 text-azul"
                                : "bg-naranja/10 text-naranja"
                          }`}
                        >
                          {item.tipo}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Detalle
                          </p>
                          <p className="text-xs font-black text-slate-700 mt-1">
                            {item.detalle}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Fecha
                          </p>
                          <p className="text-xs font-black text-slate-700 mt-1">
                            {formatDate(item.fecha)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-turquesa/10 rounded-2xl">
                <Activity className="w-6 h-6 text-turquesa" />
              </div>
              <div>
                <h2 className="text-xl font-black text-azul font-heading">
                  Participacion
                </h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                  Progreso semanal por area
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-50/70 space-y-4 max-h-155 overflow-y-auto">
            {(alertasData?.participacion || []).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-400">
                  No hay programaciones activas.
                </p>
              </div>
            ) : (
              alertasData.participacion.map((part, idx) => (
                <div
                  key={`${part.area}-${idx}`}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between gap-3 text-sm font-bold text-slate-700 mb-3">
                    <span className="truncate">{part.area}</span>
                    <span className="text-turquesa shrink-0">
                      {part.porcentaje}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-turquesa h-full rounded-full transition-all duration-1000"
                      style={{ width: `${part.porcentaje}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-black uppercase tracking-widest">
                    {part.completados} de {part.total_programados} tareas
                    completadas
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
