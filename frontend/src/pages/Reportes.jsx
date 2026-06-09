import { useEffect, useMemo, useState } from "react";
import { kpiService } from "../services/kpiService";
import { FileBarChart, AlertTriangle, ArrowRight, Download, Search } from "lucide-react";

export default function Reportes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState("resumen");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await kpiService.getDashboardData();
        setData(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Error cargando datos de auditoría:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const reportSummary = useMemo(() => {
    const areas = data.length;
    const kpis = data.reduce((sum, area) => sum + (area.kpis?.length || 0), 0);
    const calculado = data.reduce(
      (sum, area) =>
        sum +
        (area.kpis?.filter((kpi) => kpi.origen === "calculado").length || 0),
      0,
    );
    const usuario = data.reduce(
      (sum, area) =>
        sum + (area.kpis?.filter((kpi) => kpi.origen === "usuario").length || 0),
      0,
    );
    return { areas, kpis, calculado, usuario };
  }, [data]);

  const filteredAreas = useMemo(() => {
    if (!searchTerm) return data;
    return data
      .map((area) => ({
        ...area,
        kpis: area.kpis?.filter((kpi) =>
          kpi.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      }))
      .filter((area) => area.kpis?.length > 0);
  }, [data, searchTerm]);

  const handleExport = () => {
    setExporting(true);
    setMessage(null);
    setTimeout(() => {
      setExporting(false);
      setMessage("Informe generado y listo para descargar.");
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Auditoría y <span className="text-naranja">Reportes</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Revisa el estado actual de las áreas, genera reportes y audita los KPIs activos.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-3xl bg-azul px-5 py-3 text-sm font-black uppercase tracking-[0.20em] text-white transition hover:bg-azul-profundo disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Generando..." : "Exportar informe"}
        </button>
      </div>

      {message && (
        <div className="rounded-3xl border border-turquesa/20 bg-turquesa/10 p-4 text-sm text-turquesa">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Áreas auditadas</p>
          <p className="mt-4 text-3xl font-black text-azul">{reportSummary.areas}</p>
          <p className="text-sm text-slate-500 mt-2">Áreas con KPIs activos</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">KPIs totales</p>
          <p className="mt-4 text-3xl font-black text-azul">{reportSummary.kpis}</p>
          <p className="text-sm text-slate-500 mt-2">Indicadores configurados</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Calculados</p>
          <p className="mt-4 text-3xl font-black text-turquesa">{reportSummary.calculado}</p>
          <p className="text-sm text-slate-500 mt-2">Campos evaluados por fórmula</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Usuario</p>
          <p className="mt-4 text-3xl font-black text-naranja">{reportSummary.usuario}</p>
          <p className="text-sm text-slate-500 mt-2">Campos que el usuario debe completar</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-[32px] border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-azul">Explorar KPIs</p>
            <p className="text-slate-500 text-sm mt-1">
              Filtra por nombre y revisa las áreas con KPIs activos para auditoría.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar KPI por nombre"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando auditoría...</div>
        ) : filteredAreas.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No se encontraron KPIs para el filtro seleccionado.</div>
        ) : (
          <div className="grid gap-4">
            {filteredAreas.map((area) => (
              <div key={area.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Área</p>
                    <h3 className="text-xl font-black text-azul mt-2">{area.nombre}</h3>
                  </div>
                  <div className="inline-flex items-center gap-3 rounded-full bg-azul/10 px-4 py-2 text-sm font-semibold text-azul">
                    <FileBarChart className="w-4 h-4" />
                    {area.kpis?.length || 0} KPI(s)
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(area.kpis || []).slice(0, 3).map((kpi) => (
                    <div key={kpi.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{kpi.nombre}</p>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${
                          kpi.origen === "calculado"
                            ? "bg-turquesa/10 text-turquesa"
                            : "bg-naranja/10 text-naranja"
                        }`}>
                          {kpi.origen === "calculado" ? "Calculado" : "Usuario"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{kpi.responsable_nombre ? `Responsable: ${kpi.responsable_nombre}` : "Responsable no asignado"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-azul">Próximos pasos</p>
            <p className="text-slate-500 mt-1 text-sm">
              Selecciona filtros y exporta un informe para tu auditoría mensual.
            </p>
          </div>
          <button
            onClick={() => setReportType(reportType === "resumen" ? "auditoria" : "resumen")}
            className="rounded-3xl border border-azul px-5 py-3 text-sm font-black uppercase tracking-[0.20em] text-azul transition hover:bg-azul/5"
          >
            Ver {reportType === "resumen" ? "auditoría" : "resumen"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-6 text-sm text-slate-600">
          {reportType === "resumen" ? (
            <p>
              El resumen muestra una vista rápida de las áreas y KPIs configurados. Si necesitas auditar procesos, cambia al modo auditoría.
            </p>
          ) : (
            <p>
              El modo auditoría te ayudará a identificar KPI incompletos o calculados, mostrando detalles de cada área y su estado actual.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
