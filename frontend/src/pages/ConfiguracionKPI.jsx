import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import {
  Settings,
  ChevronLeft,
  Folder,
  Activity,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Database,
} from "lucide-react";
import Toast from "../components/Toast";

const ORIGEN_OPTIONS = [
  { value: "usuario", label: "Usuario" },
  { value: "calculado", label: "Calculado" },
  { value: "sistema", label: "Sistema" },
];

const DEFAULT_FORMULA = "N/A";

export default function ConfiguracionKPI() {
  const [areas, setAreas] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [campos, setCampos] = useState([]);
  const [formulaOriginal, setFormulaOriginal] = useState("");

  const [selectedArea, setSelectedArea] = useState(null); // Guardará el objeto área
  const [selectedKpi, setSelectedKpi] = useState(null); // Guardará el objeto KPI

  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadAreas = async () => {
    setIsLoadingAreas(true);
    setFeedback(null);
    try {
      const data = await kpiService.getAreas();
      setAreas(data);
    } catch {
      setFeedback({
        tipo: "error",
        mensaje: "No se pudieron cargar las áreas.",
      });
    } finally {
      setIsLoadingAreas(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleAreaChange = async (e) => {
    const areaId = e.target.value;
    const areaObj = areas.find((a) => a.id.toString() === areaId);
    setSelectedArea(areaObj || null);
    setFeedback(null);
    setSelectedKpi(null);
    setKpis([]);

    if (!areaId) return;

    setIsLoadingKpis(true);
    try {
      const data = await kpiService.getKpisPorArea(areaId);
      setKpis(data);
    } catch {
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar los KPIs del área.",
      });
    } finally {
      setIsLoadingKpis(false);
    }
  };

  const loadKpiConfiguration = async (kpi) => {
    setSelectedKpi(kpi);
    setFeedback(null);
    setCampos([]);
    setFormulaOriginal("");
    setIsLoadingCampos(true);

    try {
      const data = await kpiService.getConfiguracion(kpi.id);
      setFormulaOriginal(data.formula_original ?? DEFAULT_FORMULA);
      setCampos(data.campos ?? []);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje:
          err?.response?.data?.detail || "Error al cargar configuración.",
      });
    } finally {
      setIsLoadingCampos(false);
    }
  };

  const volverAKpis = () => {
    setSelectedKpi(null);
    setCampos([]);
  };

  const updateCampo = (index, field, value) => {
    setCampos((prev) =>
      prev.map((campo, idx) => {
        if (idx !== index) return campo;
        const nextCampo = { ...campo, [field]: value };
        if (field === "origen" && value !== "calculado") {
          nextCampo.formula_personalizada = "";
        }
        return nextCampo;
      }),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        campos: campos.map(({ id, origen, formula_personalizada }) => ({
          id,
          origen,
          formula_personalizada:
            origen === "calculado" ? formula_personalizada : "",
        })),
      };

      const result = await kpiService.saveConfiguracion(
        selectedKpi.id,
        payload,
      );
      setFeedback({
        tipo: "ok",
        mensaje: result.message || "Configuración guardada exitosamente.",
      });
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: err?.response?.data?.detail || "Error al guardar.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const origenBadge = (origen) => {
    const badges = {
      usuario: "bg-orange-100 text-naranja border-orange-200",
      calculado: "bg-blue-100 text-azul border-blue-200",
      sistema: "bg-slate-100 text-slate-500 border-slate-200",
    };
    const labels = {
      usuario: "Usuario",
      calculado: "Calculado",
      sistema: "Sistema",
    };
    return (
      <span
        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${badges[origen] || badges.sistema}`}
      >
        {labels[origen] || "Desconocido"}
      </span>
    );
  };

  const resumenCampos = useMemo(() => {
    const totals = {
      usuario: 0,
      calculado: 0,
      sistema: 0,
      requeridos: 0,
      formulasFaltantes: 0,
    };
    campos.forEach((campo) => {
      totals[campo.origen] += 1;
      if (campo.es_requerido) totals.requeridos += 1;
      if (campo.origen === "calculado" && !campo.formula_personalizada)
        totals.formulasFaltantes += 1;
    });
    return totals;
  }, [campos]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Modelador de <span className="text-naranja">KPIs</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Configura las fórmulas y orígenes de datos de los indicadores.
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* VISTA 1: SELECCIÓN DE ÁREA Y LISTA DE KPIS                */}
      {/* ───────────────────────────────────────────────────────── */}
      {!selectedKpi && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Selector de Área */}
          <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 lg:gap-6 justify-between items-center">
            <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-2 shrink-0 self-start md:self-center">
              <Folder className="w-6 h-6 text-naranja" /> Área a Configurar
            </h2>

            <div className="w-full md:w-80 relative">
              <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:outline-none focus:border-azul appearance-none transition-all shadow-sm cursor-pointer disabled:opacity-50"
                value={selectedArea ? selectedArea.id : ""}
                onChange={handleAreaChange}
                disabled={isLoadingAreas}
              >
                <option value="">-- Selecciona un área --</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cuadrícula de KPIs */}
          <div className="p-6 md:p-8 bg-slate-50/50 min-h-[400px]">
            {!selectedArea ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Database className="w-14 h-14 text-slate-200 mb-4" />
                <p className="text-azul font-black text-lg uppercase tracking-widest font-heading">
                  Sin Selección
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Selecciona un área en el menú superior para ver sus KPIs.
                </p>
              </div>
            ) : isLoadingKpis ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-azul border-t-naranja rounded-full animate-spin"></div>
              </div>
            ) : kpis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Activity className="w-14 h-14 text-slate-200 mb-4" />
                <p className="text-azul font-black text-lg uppercase tracking-widest font-heading">
                  Sin KPIs
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  El área seleccionada no tiene KPIs activos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-48 group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-azul/5 flex items-center justify-center text-azul group-hover:bg-azul group-hover:text-white transition-colors">
                        <Settings className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest border border-slate-200 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                        Editable
                      </span>
                    </div>

                    <div className="mt-auto relative z-10">
                      <h3
                        className="text-sm font-black text-azul-profundo line-clamp-2 mb-3 leading-tight"
                        title={kpi.nombre}
                      >
                        {kpi.nombre}
                      </h3>
                      <button
                        onClick={() => loadKpiConfiguration(kpi)}
                        className="w-full bg-slate-100 text-azul font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl hover:bg-azul hover:text-white transition-colors"
                      >
                        Configurar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* VISTA 2: EDITOR DEL KPI SELECCIONADO                      */}
      {/* ───────────────────────────────────────────────────────── */}
      {selectedKpi && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-right-8 duration-500">
          {/* Cabecera del Editor */}
          <div className="p-6 md:p-8 border-b border-slate-50 bg-white relative">
            <button
              onClick={volverAKpis}
              className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 text-xs font-black text-gray-400 hover:text-azul transition-colors uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>

            <div className="pr-24">
              <span className="text-[10px] bg-naranja/10 text-naranja px-3 py-1 rounded-full font-black uppercase tracking-widest mb-3 inline-block">
                Configurando Estructura
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-azul-profundo font-heading leading-tight">
                {selectedKpi.nombre}
              </h2>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50/50">
            {isLoadingCampos ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-azul border-t-naranja rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-semibold text-sm">
                  Cargando estructura...
                </p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                {/* Columna Izquierda: Editor de Campos */}
                <div className="space-y-6">
                  {/* Banner de Fórmula Original */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-turquesa" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">
                          Fórmula Excel Original
                        </h4>
                      </div>
                    </div>
                    <code className="block font-mono text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-x-auto">
                      {formulaOriginal}
                    </code>
                    <p className="text-[11px] font-semibold text-slate-400 mt-3">
                      Referencia para replicar la lógica en las variables de
                      abajo usando{" "}
                      <span className="text-azul">[Corchetes]</span>.
                    </p>
                  </div>

                  {/* Tabla de Configuración */}
                  <form
                    id="config-form"
                    onSubmit={handleSubmit}
                    className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm bg-white"
                  >
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-azul uppercase tracking-widest w-1/3">
                            Nombre de Variable
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-azul uppercase tracking-widest w-40">
                            Origen de Datos
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-azul uppercase tracking-widest">
                            Lógica / Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {campos.map((c, index) => (
                          <tr
                            key={c.id}
                            className={`transition-colors hover:bg-slate-50 ${c.origen === "calculado" && !c.formula_personalizada ? "bg-red-50/50" : ""}`}
                          >
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-sm mb-2">
                                {c.campo_label}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono font-bold tracking-wider">
                                  {c.campo_key}
                                </span>
                                {origenBadge(c.origen)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-azul/20 focus:border-azul outline-none transition-all cursor-pointer hover:bg-white"
                                value={c.origen}
                                onChange={(e) =>
                                  updateCampo(index, "origen", e.target.value)
                                }
                              >
                                {ORIGEN_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              {c.origen === "calculado" ? (
                                <input
                                  type="text"
                                  placeholder="Ej: ([Numerador] / [Denominador])"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-azul/20 focus:border-azul font-mono text-slate-700 transition-all outline-none"
                                  value={c.formula_personalizada || ""}
                                  onChange={(e) =>
                                    updateCampo(
                                      index,
                                      "formula_personalizada",
                                      e.target.value,
                                    )
                                  }
                                  required
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                                  {c.origen === "sistema"
                                    ? "Valor de Base de Datos"
                                    : "Ingresado por Usuario"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </form>
                </div>

                {/* Columna Derecha: Insights & Guardar */}
                <aside className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                      <span>Análisis de Estructura</span>
                      <Activity className="w-4 h-4 text-azul" />
                    </div>

                    <div className="space-y-4">
                      {/* Cajas de info */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                          Variables Calculadas
                        </p>
                        <p className="mt-1 text-2xl font-black text-azul">
                          {resumenCampos.calculado}
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl border p-4 ${resumenCampos.formulasFaltantes ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
                      >
                        <p
                          className={`text-[10px] uppercase font-black tracking-widest ${resumenCampos.formulasFaltantes ? "text-red-600" : "text-green-600"}`}
                        >
                          Integridad Lógica
                        </p>
                        <p
                          className={`mt-1 text-xl font-black flex items-center gap-2 ${resumenCampos.formulasFaltantes ? "text-rojo-persa" : "text-green-700"}`}
                        >
                          {resumenCampos.formulasFaltantes ? (
                            <>
                              <AlertTriangle className="w-5 h-5" />{" "}
                              {resumenCampos.formulasFaltantes} Incompleta(s)
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" /> Fórmulas
                              Listas
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <button
                        form="config-form"
                        type="submit"
                        disabled={
                          isSubmitting || resumenCampos.formulasFaltantes > 0
                        }
                        className="w-full bg-naranja hover:bg-orange-600 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-naranja/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Guardando..." : "Guardar Estructura"}
                      </button>
                      {resumenCampos.formulasFaltantes > 0 && (
                        <p className="text-[10px] text-rojo-persa text-center font-bold mt-3">
                          Rellena las fórmulas faltantes para guardar.
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
