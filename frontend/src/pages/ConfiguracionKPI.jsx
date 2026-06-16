import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import {
  Settings,
  ChevronLeft,
  ChevronDown,
  Folder,
  Activity,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Database,
  Copy,
} from "lucide-react";
import Toast from "../components/Toast";

const ORIGEN_OPTIONS = [
  { value: "usuario", label: "Usuario" },
  { value: "calculado", label: "Calculado" },
  { value: "sistema", label: "Sistema" },
];

export default function ConfiguracionKPI() {
  const [areas, setAreas] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [campos, setCampos] = useState([]);

  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedKpi, setSelectedKpi] = useState(null);

  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Estado para el Acordeón de Fórmulas
  const [isFormulasOpen, setIsFormulasOpen] = useState(false);

  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";

  useEffect(() => {
    const initConfiguracion = async () => {
      setIsLoadingAreas(true);
      setFeedback(null);
      try {
        const dataAreas = await kpiService.getAreasStats();
        setAreas(dataAreas);

        const kpiToConfigStr = sessionStorage.getItem("kpiToConfig");

        if (kpiToConfigStr) {
          const kpiToConfig = JSON.parse(kpiToConfigStr);
          sessionStorage.removeItem("kpiToConfig");

          const areaObj = dataAreas.find((a) => a.id === kpiToConfig.area_id);
          if (areaObj) {
            setSelectedArea(areaObj);

            setIsLoadingKpis(true);
            const dataKpis = await kpiService.getKpisPorArea(areaObj.id);
            setKpis(dataKpis);
            setIsLoadingKpis(false);

            const fullKpi =
              dataKpis.find((k) => k.id === kpiToConfig.id) || kpiToConfig;
            loadKpiConfiguration(fullKpi);
          }
        }
      } catch (err) {
        setFeedback({
          tipo: "error",
          mensaje: "Error al inicializar la configuración.",
        });
      } finally {
        setIsLoadingAreas(false);
      }
    };

    initConfiguracion();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    setIsFormulasOpen(false); // Cerramos el acordeón al cambiar de KPI por limpieza
    setIsLoadingCampos(true);

    try {
      const data = await kpiService.getConfiguracion(kpi.id);
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

  const copiarVariable = (label) => {
    const textoConCorchetes = `[${label}]`;
    navigator.clipboard.writeText(textoConCorchetes);
    setFeedback({
      tipo: "ok",
      mensaje: `Copiado al portapapeles: ${textoConCorchetes}`,
    });
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
      usuario: "bg-orange-100 border-orange-200",
      calculado: "bg-blue-100 border-blue-200",
      sistema: "bg-slate-100 text-slate-500 border-slate-200",
    };
    const colors = {
      usuario: COLOR_NARANJA,
      calculado: COLOR_AZUL,
      sistema: "#64748b",
    };
    const labels = {
      usuario: "Usuario",
      calculado: "Calculado",
      sistema: "Sistema",
    };
    return (
      <span
        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${badges[origen] || badges.sistema}`}
        style={{ color: colors[origen] || colors.sistema }}
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
          <h1
            className="text-3xl font-extrabold font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Modelador de <span style={{ color: COLOR_NARANJA }}>KPIs</span>
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
            <h2
              className="text-xl font-bold flex items-center gap-2 shrink-0 self-start md:self-center"
              style={{ color: COLOR_AZUL }}
            >
              <Folder className="w-6 h-6" style={{ color: COLOR_NARANJA }} />{" "}
              Área a Configurar
            </h2>

            <div className="w-full md:w-80 relative">
              <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:outline-none transition-all shadow-sm cursor-pointer disabled:opacity-50"
                style={{ borderColor: COLOR_AZUL }}
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
                <p
                  className="font-black text-lg uppercase tracking-widest font-heading"
                  style={{ color: COLOR_AZUL }}
                >
                  Sin Selección
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Selecciona un área en el menú superior para ver sus KPIs.
                </p>
              </div>
            ) : isLoadingKpis ? (
              <div className="flex justify-center py-20">
                <div
                  className="w-10 h-10 border-4 rounded-full animate-spin"
                  style={{
                    borderColor: COLOR_AZUL,
                    borderTopColor: COLOR_NARANJA,
                  }}
                ></div>
              </div>
            ) : kpis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Activity className="w-14 h-14 text-slate-200 mb-4" />
                <p
                  className="font-black text-lg uppercase tracking-widest font-heading"
                  style={{ color: COLOR_AZUL }}
                >
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
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: `${COLOR_AZUL}10`, // 10% opacity hex hack
                          color: COLOR_AZUL,
                        }}
                      >
                        <Settings className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest border border-slate-200 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                        Editable
                      </span>
                    </div>

                    <div className="mt-auto relative z-10">
                      <h3
                        className="text-sm font-black line-clamp-2 mb-3 leading-tight"
                        title={kpi.nombre}
                        style={{ color: COLOR_AZUL }}
                      >
                        {kpi.nombre}
                      </h3>
                      <button
                        onClick={() => loadKpiConfiguration(kpi)}
                        className="w-full bg-slate-100 font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl transition-colors hover:opacity-80"
                        style={{
                          color: COLOR_AZUL,
                          backgroundColor: "#f1f5f9",
                        }}
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
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-right-8 duration-500 flex flex-col">
          {/* Cabecera del Editor */}
          <div className="p-6 md:p-8 border-b border-slate-50 bg-white relative">
            <button
              onClick={volverAKpis}
              className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest transition-colors hover:text-[#123498]"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>

            <div className="pr-24">
              <span
                className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest mb-3 inline-block"
                style={{
                  backgroundColor: `${COLOR_NARANJA}10`,
                  color: COLOR_NARANJA,
                }}
              >
                Configurando Estructura
              </span>
              <h2
                className="text-2xl md:text-3xl font-black font-heading leading-tight"
                style={{ color: COLOR_AZUL }}
              >
                {selectedKpi.nombre}
              </h2>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50/50 flex-1">
            {isLoadingCampos ? (
              <div className="text-center py-20">
                <div
                  className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4"
                  style={{
                    borderColor: COLOR_AZUL,
                    borderTopColor: COLOR_NARANJA,
                  }}
                ></div>
                <p className="text-gray-500 font-semibold text-sm">
                  Cargando estructura...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ACORDEÓN DE FÓRMULAS */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setIsFormulasOpen(!isFormulasOpen)}
                    className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calculator
                        className="w-5 h-5"
                        style={{ color: COLOR_NARANJA }}
                      />
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">
                        Diccionario de Fórmulas (Referencia)
                      </h4>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isFormulasOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isFormulasOpen && (
                    <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                      {/* KPIs Positivos */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                          1. KPIs Positivos (Más es mejor)
                        </h5>
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Cumplimiento (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =Valor_Semanal / Meta_KPI
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              ([Meta KPI] === 0 || [Meta KPI] === null) ? 0 :
                              ([Valor semanal] / [Meta KPI])
                            </code>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Eficacia (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =SI(Valor {">="} Meta; 100%; Valor / Meta)
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              [Cumplimiento (%)] &gt; 1 ? 1 : [Cumplimiento (%)]
                            </code>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Rendimiento (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =Productividad / Meta_Prod
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              ([Meta Producción] === 0 || [Meta Producción] ===
                              null) ? 0 : ([Productividad] / [Meta Producción])
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* KPIs Negativos */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg inline-block">
                          2. KPIs Negativos (Menos es mejor)
                        </h5>
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Cumplimiento (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =SI(Valor {"<="} Meta; 100%; Meta / Valor)
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              ([Meta KPI] === 0 || [Meta KPI] === null) ?
                              ([Valor semanal] === 0 ? 1 : 0) : Math.max(0, 1 -
                              ([Valor semanal] / [Meta KPI]))
                            </code>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Eficacia (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =SI(Valor {"<="} Meta; 100%; 0%)
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              [Valor semanal] &lt;= [Meta KPI] ? 1 : 0
                            </code>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Rendimiento (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              Fórmula anti-bodrio
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              ([Productividad] === 0 || [Productividad] ===
                              null) ? 1 : ([Productividad] &lt;= [Meta
                              Producción] ? 1 : ([Meta Producción] /
                              [Productividad]))
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* KPIs Generales */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                          3. Fórmulas Generales
                        </h5>
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Eficiencia (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =Horas_Plan / Horas_Reales
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              ([Horas planificadas] / [Horas reales])
                            </code>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Efectividad (%)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =Eficacia * Eficiencia
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              ([Eficiencia (%)] * [Eficacia (%)])
                            </code>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Productividad (Num)
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mb-2">
                              =Dato_Principal / Horas_Reales
                            </p>
                            <code className="block text-[10px] font-mono bg-blue-50 text-blue-800 p-2 rounded-lg break-all">
                              ([Variable Principal] / [Horas reales])
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TABLA DE CONFIGURACIÓN A TODO ANCHO */}
                <form
                  id="config-form"
                  onSubmit={handleSubmit}
                  className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-x-auto w-full"
                >
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th
                          className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-1/4"
                          style={{ color: COLOR_AZUL }}
                        >
                          Nombre de Variable
                        </th>
                        <th
                          className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-1/4"
                          style={{ color: COLOR_AZUL }}
                        >
                          Origen de Datos
                        </th>
                        <th
                          className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-1/2"
                          style={{ color: COLOR_AZUL }}
                        >
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
                            {/* Variable Click-to-Copy */}
                            <div
                              onClick={() => copiarVariable(c.campo_label)}
                              className="font-bold text-slate-800 text-sm mb-2 cursor-pointer group flex items-center gap-2 w-max"
                              title="Clic para copiar con corchetes"
                            >
                              {c.campo_label}
                              <Copy className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#123498] transition-colors" />
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
                              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-3 outline-none transition-all cursor-pointer hover:bg-white focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/20"
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-700 transition-all outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/20"
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

                {/* BARRA INFERIOR HORIZONTAL: INSIGHTS & GUARDAR */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left Side: Stats */}
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex-1 md:w-48 flex flex-col justify-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                        Variables Calculadas
                      </p>
                      <p
                        className="mt-1 text-2xl font-black"
                        style={{ color: COLOR_AZUL }}
                      >
                        {resumenCampos.calculado}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl border p-4 flex-1 md:w-56 flex flex-col justify-center ${resumenCampos.formulasFaltantes ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
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
                            <CheckCircle2 className="w-5 h-5" /> Fórmulas Listas
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Button */}
                  <div className="w-full md:w-1/3 min-w-[250px]">
                    <button
                      form="config-form"
                      type="submit"
                      disabled={
                        isSubmitting || resumenCampos.formulasFaltantes > 0
                      }
                      className="w-full text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-xl hover:opacity-90"
                      style={{ backgroundColor: COLOR_NARANJA }}
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
