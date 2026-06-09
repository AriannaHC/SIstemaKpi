// pages/ConfiguracionKPI.jsx
import { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import Toast from "../components/Toast";

const ORIGEN_BADGES = {
  usuario: { label: "Usuario", cls: "bg-naranja/10 text-naranja" },
  calculado: { label: "Calculado", cls: "bg-azul/10 text-azul" },
  sistema: { label: "Sistema", cls: "bg-slate-100 text-slate-500" },
};

const ORIGEN_OPTIONS = [
  { value: "usuario", label: "Usuario" },
  { value: "calculado", label: "Calculado" },
  { value: "sistema", label: "Sistema" },
];

const DEFAULT_FORMULA = "N/A";
const initialFeedback = null;

export default function ConfiguracionKPI() {
  const [areas, setAreas] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [campos, setCampos] = useState([]);
  const [formulaOriginal, setFormulaOriginal] = useState("");

  const [selectedArea, setSelectedArea] = useState("");
  const [selectedKpi, setSelectedKpi] = useState("");

  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback);

  const isKpiSelectDisabled = !selectedArea || isLoadingAreas || kpis.length === 0;
  const hasCampos = campos.length > 0;

  const getErrorMessage = (error, fallback) =>
    error?.response?.data?.detail ?? fallback;

  const clearFeedback = () => setFeedback(initialFeedback);

  const resetKpiConfiguration = () => {
    setSelectedKpi("");
    setCampos([]);
    setFormulaOriginal("");
  };

  const loadAreas = async () => {
    setIsLoadingAreas(true);
    clearFeedback();

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
    setSelectedArea(areaId);
    clearFeedback();
    resetKpiConfiguration();
    setKpis([]);

    if (!areaId) {
      return;
    }

    try {
      const data = await kpiService.getKpisPorArea(areaId);
      setKpis(data);
    } catch {
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar los KPIs del área.",
      });
    }
  };

  const loadKpiConfiguration = async (kpiId) => {
    if (!kpiId) return;

    setSelectedKpi(kpiId);
    clearFeedback();
    setCampos([]);
    setFormulaOriginal("");
    setIsLoadingCampos(true);

    try {
      const data = await kpiService.getConfiguracion(kpiId);
      setFormulaOriginal(data.formula_original ?? DEFAULT_FORMULA);
      setCampos(data.campos ?? []);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: getErrorMessage(err, "Error al cargar la configuración del KPI."),
      });
    } finally {
      setIsLoadingCampos(false);
    }
  };

  const handleKpiChange = (e) => {
    loadKpiConfiguration(e.target.value);
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
    clearFeedback();

    try {
      const payload = {
        campos: campos.map(({ id, origen, formula_personalizada }) => ({
          id,
          origen,
          formula_personalizada:
            origen === "calculado" ? formula_personalizada : "",
        })),
      };

      const result = await kpiService.saveConfiguracion(selectedKpi, payload);
      setFeedback({
        tipo: "ok",
        mensaje: result.message || "Configuración guardada exitosamente.",
      });
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: getErrorMessage(err, "Error al guardar la configuración."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const origenBadge = (origen) => {
    const { label, cls } = ORIGEN_BADGES[origen] ?? ORIGEN_BADGES.sistema;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cls}`}>
        {label}
      </span>
    );
  };

  const resumenCampos = useMemo(() => {
    const totals = { usuario: 0, calculado: 0, sistema: 0, requeridos: 0, formulasFaltantes: 0 };
    campos.forEach((campo) => {
      totals[campo.origen] += 1;
      if (campo.es_requerido) totals.requeridos += 1;
      if (campo.origen === "calculado" && !campo.formula_personalizada) totals.formulasFaltantes += 1;
    });
    return totals;
  }, [campos]);

  const origenOptions = useMemo(
    () =>
      ORIGEN_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )),
    [],
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 font-sans">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={clearFeedback}
      />

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-azul-profundo tracking-tight">
              Modelador de KPIs
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-azul font-bold text-xs uppercase tracking-wide">1. Selección</span>
              <h2 className="text-2xl font-extrabold text-azul-profundo mt-3">Selecciona un área</h2>
            </div>

            <div className="w-full md:w-80">
              <label className="sr-only">Área</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-2xl focus:ring-2 focus:ring-azul/30 focus:border-azul block p-3 transition-colors"
                value={selectedArea}
                onChange={handleAreaChange}
                disabled={isLoadingAreas}
              >
                <option value="">
                  {isLoadingAreas ? "Cargando..." : "Selecciona un área"}
                </option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoadingCampos && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-azul mb-3"></div>
            <p className="text-slate-500 text-sm font-medium">Cargando configuración del KPI...</p>
          </div>
        )}

        {!isLoadingCampos && !selectedKpi && (
          <div className="grid gap-6">
            {selectedArea ? (
              kpis.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {kpis.map((kpi) => (
                    <button
                      key={kpi.id}
                      type="button"
                      onClick={() => loadKpiConfiguration(kpi.id)}
                      className="text-left rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-azul/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-azul">{kpi.nombre}</h3>
                          <p className="text-sm text-slate-500 mt-2">Haz clic para cargar la configuración del KPI.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                          Disponible
                        </span>
                      </div>
                      <div className="mt-4 text-sm text-slate-500">
                        {kpi.formula_texto ? (
                          <p>Fórmula base reconocida.</p>
                        ) : (
                          <p>Sin fórmula base definida aún.</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">No hay KPIs disponibles</h3>
                  <p className="text-sm text-slate-500 mt-2">Esta área no contiene KPIs activos para configurar en este momento.</p>
                </div>
              )
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <h3 className="text-xl font-bold text-azul">Selecciona un área</h3>
              </div>
            )}
          </div>
        )}

        {!isLoadingCampos && hasCampos && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Referencia Excel</p>
                      <h4 className="mt-2 text-lg font-bold text-azul">Copiar la fórmula oficial</h4>
                    </div>
                    <span className="text-[10px] rounded-full bg-naranja/10 px-3 py-1 font-semibold uppercase tracking-[0.24em] text-naranja">
                      Original
                    </span>
                  </div>
                  <code className="block font-mono text-sm text-slate-700 bg-white p-3 rounded-2xl border border-slate-100 mt-4 overflow-x-auto">
                    {formulaOriginal}
                  </code>
                  <p className="text-xs text-slate-400 mt-3">
                    Usa las variables entre <strong className="text-slate-600">[corchetes]</strong> y valida que cada campo de origen exista en la tabla.
                  </p>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3 border-b border-slate-200">Nombre del Campo</th>
                        <th className="px-4 py-3 border-b border-slate-200 w-48">Origen</th>
                        <th className="px-4 py-3 border-b border-slate-200">Fórmula / Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {campos.map((c, index) => (
                        <tr
                          key={c.id}
                          className={`transition-colors hover:bg-slate-50 ${
                            c.origen === "calculado" && !c.formula_personalizada
                              ? "bg-amber-50"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{c.campo_label}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                {c.campo_key}
                              </span>
                              {origenBadge(c.origen)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="w-full border border-slate-200 text-slate-600 rounded text-xs focus:ring-1 focus:ring-azul/30 focus:border-azul bg-white"
                              value={c.origen}
                              onChange={(e) => updateCampo(index, "origen", e.target.value)}
                            >
                              {origenOptions}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {c.origen === "calculado" ? (
                              <input
                                type="text"
                                placeholder="Ej: ([Numerador] / [Denominador])"
                                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-azul/30 focus:border-azul font-mono text-slate-700 bg-white"
                                value={c.formula_personalizada || ""}
                                onChange={(e) => updateCampo(index, "formula_personalizada", e.target.value)}
                              />
                            ) : (
                              <span className="text-xs text-slate-400 italic block py-1.5">
                                {c.origen === "sistema" ? "Solo lectura" : "Entrada de usuario"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-azul">Sugerencias inteligentes</p>
                  <ul className="mt-3 space-y-3">
                    <li className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                      Usa una fórmula por campo calculado y prueba con valores de origen reales.
                    </li>
                    <li className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                      Mantén el nombre del campo simple y consistente para el equipo.
                    </li>
                    <li className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
                      Verifica las fórmulas antes de guardar para evitar cálculos erróneos.
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-azul hover:bg-azul-profundo text-white text-sm font-medium py-2.5 px-6 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar configuración"}
                  </button>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400 mb-4">
                    <span>Estado del modelo</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Insights</span>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Campos calculados</p>
                      <p className="mt-2 text-3xl font-black text-azul">{resumenCampos.calculado}</p>
                      <p className="text-xs text-slate-500 mt-1">Cantidad de campos que dependen de fórmulas.</p>
                    </div>
                    <div className={`rounded-3xl border p-4 ${resumenCampos.formulasFaltantes ? "border-rojo-persa/20 bg-rojo-persa/10" : "border-turquesa/20 bg-turquesa/10"}`}>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-700">Salud de fórmulas</p>
                      <p className={`mt-2 text-2xl font-black ${resumenCampos.formulasFaltantes ? "text-rojo-persa" : "text-turquesa"}`}>
                        {resumenCampos.formulasFaltantes ? `${resumenCampos.formulasFaltantes} pendiente(s)` : "Lista"}
                      </p>
                      <p className="text-xs text-slate-700 mt-1">
                        {resumenCampos.formulasFaltantes
                          ? "Completa las fórmulas para evitar cálculos faltantes."
                          : "Las fórmulas están listas para calcular."}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-azul">Acción recomendada</p>
                      <p className="mt-2 text-slate-500">
                        Si cambias origen a calculado, revisa el campo antes de guardar para mantener el modelo consistente.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
