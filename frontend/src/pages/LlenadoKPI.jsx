// pages/LlenadoKPI.jsx
import { useState, useEffect, useCallback } from "react";
import { kpiService } from "../services/kpiService";
import {
  FileText,
  Clock,
  User,
  CheckCircle2,
  ChevronLeft,
  Activity,
  Target,
} from "lucide-react";
// 🔴 IMPORTANTE: Importamos el nuevo componente Toast
import Toast from "../components/Toast";

// ── Semáforo ──────────────────────────────────────────────────────────────────
function SemaforoDisplay({ cumplimiento }) {
  if (
    cumplimiento === null ||
    cumplimiento === undefined ||
    isNaN(cumplimiento)
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
        Sin calcular
      </span>
    );
  }
  if (cumplimiento >= 0.8)
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
        Verde (Óptimo)
      </span>
    );
  if (cumplimiento >= 0.6)
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-700" />
        Amarillo (Problemas)
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-700" />
      Rojo (Peligro)
    </span>
  );
}

// ── Formateador de resultados ─────────────────────────────────────────────────
function formatearValor(label, valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const lbl = label.toLowerCase();
  if (
    lbl.includes("cumplimiento") ||
    lbl.includes("eficiencia") ||
    lbl.includes("eficacia") ||
    lbl.includes("efectividad") ||
    lbl.includes("rendimiento") ||
    lbl.includes("productividad")
  ) {
    return (parseFloat(valor) * 100).toFixed(2) + "%";
  }
  const num = parseFloat(valor);
  return isNaN(num) ? String(valor) : num.toFixed(2);
}

// ── Motor matemático ──────────────────────────────────────────────────────────
function ejecutarMotor(campos, valores) {
  let contexto = {};
  campos.forEach((c) => {
    const raw = valores[c.campo_key];
    if (c.tipo === "texto") {
      contexto[c.campo_label] = raw ?? "";
    } else {
      contexto[c.campo_label] =
        raw === "" || raw === undefined || raw === null
          ? null
          : parseFloat(raw);
    }
  });

  for (let pase = 1; pase <= 4; pase++) {
    campos.forEach((c) => {
      if (c.origen !== "calculado" || !c.formula_personalizada) return;
      let formula = c.formula_personalizada;
      let canCalculate = true;

      for (const [label, value] of Object.entries(contexto)) {
        const safeLabel = label.replace(/[\[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const regex = new RegExp(`\\[${safeLabel}\\]`, "g");
        if (formula.match(regex) && (value === null || value === undefined)) {
          canCalculate = false;
        }
        formula = formula.replace(
          regex,
          value !== null && value !== undefined ? value : 0,
        );
      }

      if (canCalculate) {
        try {
          const resultado = eval(formula);
          contexto[c.campo_label] =
            !isNaN(resultado) && isFinite(resultado) ? resultado : null;
        } catch (_) {
          contexto[c.campo_label] = null;
        }
      } else {
        contexto[c.campo_label] = null;
      }
    });
  }
  return contexto;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LlenadoKPI() {
  // Estado para la Vista de Lista (Cards)
  const [kpisActivos, setKpisActivos] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Estado para la Vista de Formulario (Detalle)
  const [kpiSeleccionado, setKpiSeleccionado] = useState(null);
  const [campos, setCampos] = useState([]);
  const [valores, setValores] = useState({});
  const [contexto, setContexto] = useState({});
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showResumenModal, setShowResumenModal] = useState(false);

  // ── 1. Cargar KPIs activos ───────────────────────────────────────────────
  const cargarKpisDiarios = () => {
    setLoadingList(true);
    kpiService
      .getDiario()
      .then(setKpisActivos)
      .catch(() =>
        setFeedback({ tipo: "error", mensaje: "Error al cargar tus KPIs." }),
      )
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    cargarKpisDiarios();
  }, []);

  // ── 2. Abrir Formulario ──────────────────────────────────────────────────
  const handleLlenarClick = async (kpi) => {
    setKpiSeleccionado(kpi);
    setCampos([]);
    setValores({});
    setContexto({});
    setFeedback(null);
    setIsLoadingCampos(true);

    try {
      const res = await kpiService.getCampos(kpi.id);
      const dataCampos = res.campos || [];
      const meta = res.kpi_meta;

      const valoresIniciales = {};
      dataCampos.forEach((c) => {
        const lbl = c.campo_label.toLowerCase();
        let prefill = "";
        if (meta) {
          if (lbl.includes("meta kpi") && meta.meta_valor != null)
            prefill = String(meta.meta_valor);
          else if (
            (lbl.includes("meta producción") ||
              lbl.includes("meta produccion")) &&
            meta.meta_produccion != null
          )
            prefill = String(meta.meta_produccion);
          else if (
            lbl.includes("horas planificadas") &&
            meta.horas_planificadas != null
          )
            prefill = String(meta.horas_planificadas);
        }
        valoresIniciales[c.campo_key] = prefill;
      });

      setCampos(dataCampos);
      setValores(valoresIniciales);
    } catch {
      setFeedback({
        tipo: "error",
        mensaje: "No se pudieron cargar los campos del KPI.",
      });
    } finally {
      setIsLoadingCampos(false);
    }
  };

  const cerrarFormulario = () => {
    setKpiSeleccionado(null);
    setFeedback(null);
  };

  // ── 3. Motor en tiempo real ──────────────────────────────────────────────
  useEffect(() => {
    if (campos.length === 0) return;
    setContexto(ejecutarMotor(campos, valores));
  }, [valores, campos]);

  const handleChange = useCallback((e) => {
    setValores((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const cumplimientoValue = (() => {
    for (const key of Object.keys(contexto)) {
      if (key.toLowerCase().includes("cumplimiento")) return contexto[key];
    }
    return null;
  })();

  const renderResultado = (c) => {
    const lbl = c.campo_label.toLowerCase();
    if (
      lbl.includes("alerta") ||
      lbl.includes("semáforo") ||
      lbl.includes("semaforo")
    ) {
      return <SemaforoDisplay cumplimiento={cumplimientoValue} />;
    }
    return (
      <span className="font-bold text-azul">
        {formatearValor(c.campo_label, contexto[c.campo_label])}
      </span>
    );
  };

  const resumenLabels = [
    "Valor semanal",
    "Meta KPI",
    "Cumplimiento",
    "Productividad",
    "Eficiencia",
    "Eficacia",
    "Efectividad",
    "Rendimiento",
  ];

  const buscarValorResumen = (etiqueta) => {
    const campo = camposResultado.find((c) =>
      c.campo_label.toLowerCase().includes(etiqueta.toLowerCase()),
    );
    return campo
      ? formatearValor(campo.campo_label, contexto[campo.campo_label])
      : "-";
  };

  const renderResumenPanel = () => (
    <div className="rounded-4xl border border-slate-200 bg-linear-to-br from-[#123498]/10 via-slate-50 to-[#F46F0B]/10 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold" style={{ color: "#123498" }}>
          Estado de tu KPI
        </h3>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl bg-white border border-slate-200 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-black mb-2">
            Semáforo de cumplimiento
          </p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-4xl font-black" style={{ color: "#123498" }}>
                {cumplimientoValue !== null && cumplimientoValue !== undefined
                  ? `${(cumplimientoValue * 100).toFixed(0)}%`
                  : "--"}
              </p>
              <p className="text-sm text-slate-500 mt-1">Evaluación actual</p>
            </div>
            <SemaforoDisplay cumplimiento={cumplimientoValue} />
          </div>
          <div className="mt-4 h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#123498] to-[#123498]/60"
              style={{
                width: cumplimientoValue
                  ? `${Math.max(5, Math.min(cumplimientoValue * 100, 100))}%`
                  : "5%",
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-5">
          <div className="grid grid-cols-2 gap-3">
            {resumenLabels.map((label) => (
              <div
                key={label}
                className="rounded-2xl bg-slate-50 px-3 py-3 shadow-sm"
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 mb-1">
                  {label}
                </p>
                <p className="text-sm font-semibold text-[#123498]">
                  {buscarValorResumen(label)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── 4. Enviar Datos ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const valoresCompletos = {};
    campos.forEach((c) => {
      const valMotor = contexto[c.campo_label];
      const lbl = c.campo_label.toLowerCase();

      if (
        lbl.includes("alerta") ||
        lbl.includes("semáforo") ||
        lbl.includes("semaforo")
      ) {
        let colorSemaforo = "gris";
        if (cumplimientoValue !== null && cumplimientoValue !== undefined) {
          if (cumplimientoValue >= 0.8) colorSemaforo = "verde";
          else if (cumplimientoValue >= 0.6) colorSemaforo = "amarillo";
          else colorSemaforo = "rojo";
        }
        valoresCompletos[c.campo_key] = colorSemaforo;
      } else if (c.origen === "usuario") {
        valoresCompletos[c.campo_key] = valores[c.campo_key] ?? "";
      } else if (valMotor !== null && valMotor !== undefined) {
        valoresCompletos[c.campo_key] = valMotor;
      } else {
        valoresCompletos[c.campo_key] = valores[c.campo_key] ?? "";
      }
    });

    try {
      const payload = { kpi_id: kpiSeleccionado.id, valores: valoresCompletos };
      await kpiService.registrar(payload);
      setFeedback({
        tipo: "ok",
        mensaje: `✅ Registro exitoso. Tu llenado ha sido guardado correctamente.`, // Mensaje más amigable
      });

      const valoresReset = {};
      campos.forEach((c) => {
        const lbl = c.campo_label.toLowerCase();
        valoresReset[c.campo_key] =
          lbl.includes("meta") || lbl.includes("horas planificadas")
            ? valores[c.campo_key]
            : "";
      });
      setValores(valoresReset);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: err?.response?.data?.detail || "Error al guardar datos.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ── RENDERIZADO VISTA 1: CARDS (MASTER)
  // ────────────────────────────────────────────────────────────────────────────
  if (!kpiSeleccionado) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
        <Toast
          message={feedback?.mensaje}
          type={feedback?.tipo}
          onClose={() => setFeedback(null)}
        />

        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Tus Indicadores <span className="text-naranja">Pendientes</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Estos son los KPIs programados que debes completar en esta fecha.
          </p>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-azul border-t-naranja rounded-full animate-spin"></div>
          </div>
        ) : kpisActivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Target className="w-14 h-14 text-slate-200 mb-4" />
            <p className="text-azul font-black text-lg uppercase tracking-widest font-heading">
              Todo al día
            </p>
            <p className="text-gray-500 text-sm mt-1">
              No tienes KPIs pendientes de llenado en este momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpisActivos.map((kpi) => (
              <div
                key={kpi.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative h-24 bg-linear-to-br from-azul/10 to-naranja/10 p-5 flex items-start justify-between">
                  <span
                    className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border bg-white ${kpi.es_mi_kpi ? "text-naranja border-naranja/30" : "text-azul border-azul/30"}`}
                  >
                    {kpi.es_mi_kpi ? "Tu responsabilidad" : "KPI de equipo"}
                  </span>
                  <FileText className="w-8 h-8 text-azul/20" />
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-black text-azul font-heading leading-tight mb-4 flex-1">
                    {kpi.nombre}
                  </h3>
                  <div className="space-y-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-azul shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-azul uppercase tracking-widest">
                          Encargado
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {kpi.responsable_nombre || "Equipo"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-naranja shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-naranja uppercase tracking-widest">
                          Vigencia
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          En rango de fecha programada
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleLlenarClick(kpi)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-azul hover:bg-azul-profundo text-white font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-azul/20"
                  >
                    Llenar Reporte
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── RENDERIZADO VISTA 2: FORMULARIO (DETAIL)
  // ────────────────────────────────────────────────────────────────────────────
  const camposUsuario = campos.filter((c) => c.origen === "usuario");
  const camposResultado = campos.filter(
    (c) =>
      c.origen === "calculado" ||
      c.origen === "sistema" ||
      c.campo_label.toLowerCase().includes("semáforo") ||
      c.campo_label.toLowerCase().includes("alerta"),
  );

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      <div className="h-full max-w-5xl mx-auto flex flex-col px-3 py-2 lg:px-0 animate-in slide-in-from-right-8 duration-500 relative">
        {/* 🔴 AQUÍ RENDERIZAMOS EL TOAST */}
        <Toast
          message={feedback?.mensaje}
          type={feedback?.tipo}
          onClose={() => setFeedback(null)}
        />

        <button
          onClick={cerrarFormulario}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-azul mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Volver a mis KPIs
        </button>

        <div className="bg-white rounded-4xl shadow-xl border border-slate-100 p-6 md:p-8">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-azul/10 text-azul text-[11px] font-bold uppercase tracking-[0.24em]">
              Ingreso Semanal
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-azul-profundo tracking-tight font-heading">
              {kpiSeleccionado.nombre}
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-2xl leading-6">
              Completa los datos clave para este KPI. La pantalla está diseñada
              para que el contenido principal quede junto y los resultados en
              tiempo real se vean en el costado.
            </p>
          </div>

          {isLoadingCampos ? (
            <div className="text-center py-16 text-gray-500">
              <span className="animate-spin inline-block mr-2 text-xl">⏳</span>{" "}
              Cargando estructura...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-8 lg:grid-cols-[1.75fr_1.1fr]"
            >
              <div className="space-y-8">
                <div className="rounded-4xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-azul">
                        Datos a completar
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Ingresa la información que el sistema necesita para
                        calcular los indicadores.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-slate-500 border border-slate-200">
                      {camposUsuario.length} campos
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto pr-2 pb-3">
                    {camposUsuario.map((c) => {
                      const esTextoLargo =
                        c.campo_label.toLowerCase().includes("observaciones") ||
                        c.campo_label.toLowerCase().includes("acciones");
                      return (
                        <div
                          key={c.id}
                          className={esTextoLargo ? "md:col-span-2" : ""}
                        >
                          <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                            {c.campo_label}{" "}
                            {c.es_requerido && (
                              <span className="text-rojo-persa">*</span>
                            )}
                          </label>
                          {esTextoLargo ? (
                            <textarea
                              name={c.campo_key}
                              value={valores[c.campo_key] || ""}
                              onChange={handleChange}
                              rows={4}
                              className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-azul focus:ring-2 focus:ring-azul/10 transition-all resize-none"
                            />
                          ) : (
                            <input
                              type={c.tipo === "numero" ? "number" : "text"}
                              step="any"
                              name={c.campo_key}
                              value={valores[c.campo_key] || ""}
                              onChange={handleChange}
                              required={c.es_requerido}
                              className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-azul focus:ring-2 focus:ring-azul/10 transition-all"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-3xl bg-azul text-white font-black text-sm uppercase tracking-[0.3em] py-4 transition-all shadow-lg shadow-azul/20 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-azul-profundo"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Registro"}
                </button>
              </div>

              {camposResultado.length > 0 && (
                <div className="lg:sticky lg:top-6 lg:self-start">
                  <div className="rounded-4xl border border-slate-200 bg-linear-to-br from-turquesa/5 via-slate-50 to-azul/5 p-6 shadow-sm">
                    <div className="mb-6">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-black mb-3">
                        Resultados en tiempo real
                      </p>
                      <h3 className="text-2xl font-extrabold text-azul">
                        Estado de tu KPI
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Estas métricas se actualizan mientras completas el
                        formulario.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-3xl bg-white border border-slate-200 p-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-black mb-2">
                          Semáforo de cumplimiento
                        </p>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-4xl font-black text-azul">
                              {cumplimientoValue !== null &&
                              cumplimientoValue !== undefined
                                ? `${(cumplimientoValue * 100).toFixed(0)}%`
                                : "--"}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              Evaluación actual
                            </p>
                          </div>
                          <SemaforoDisplay cumplimiento={cumplimientoValue} />
                        </div>
                        <div className="mt-4 h-3 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-azul to-turquesa"
                            style={{
                              width: cumplimientoValue
                                ? `${Math.max(5, Math.min(cumplimientoValue * 100, 100))}%`
                                : "5%",
                            }}
                          />
                        </div>
                      </div>

                      <div className="rounded-3xl bg-white border border-slate-200 p-5 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {camposResultado.slice(0, 4).map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-sm text-slate-500">
                                {c.campo_label}
                              </span>
                              <span className="text-sm font-semibold text-azul">
                                {formatearValor(
                                  c.campo_label,
                                  contexto[c.campo_label],
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        {camposResultado.length > 4 && (
                          <p className="text-xs text-slate-400 leading-5">
                            Más métricas calculadas están disponibles en el
                            panel principal después de guardar.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
        {showResumenModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4">
            <div className="w-full max-w-xl rounded-4xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-black mb-1">
                    Estado de tu KPI
                  </p>
                  <h3 className="text-2xl font-extrabold text-azul">
                    Resumen del KPI
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResumenModal(false)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
                >
                  Cerrar
                </button>
              </div>
              {renderResumenPanel()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
