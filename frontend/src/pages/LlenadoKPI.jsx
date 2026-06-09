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
      <span className="inline-flex items-center gap-1.5 font-bold text-gray-400">
        ⚪ Sin calcular
      </span>
    );
  }
  if (cumplimiento >= 0.8)
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-green-700">
        🟢 Verde (Óptimo)
      </span>
    );
  if (cumplimiento >= 0.6)
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-yellow-700">
        🟡 Amarillo (Problemas)
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 font-bold text-red-700">
      🔴 Rojo (Peligro)
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
  const [kpisSemanales, setKpisSemanales] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [kpiSeleccionado, setKpiSeleccionado] = useState(null);
  const [campos, setCampos] = useState([]);
  const [valores, setValores] = useState({});
  const [contexto, setContexto] = useState({});
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    kpiService
      .getDiario()
      .then(setKpisSemanales)
      .catch(() => console.error("Error cargando KPIs diarios"))
      .finally(() => setLoadingList(false));
  }, []);

  const abrirFormulario = async (kpi) => {
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
      const res = await kpiService.registrar(payload);
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
        mensaje: `❌ ${err?.response?.data?.detail || "Error al guardar datos."}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!kpiSeleccionado) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Ingreso <span className="text-naranja">Diario</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Estos son los indicadores activos para tu área esta semana.
          </p>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-azul border-t-naranja rounded-full animate-spin" />
          </div>
        ) : kpisSemanales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Activity className="w-14 h-14 text-slate-200 mb-4" />
            <p className="text-azul font-black text-lg uppercase tracking-widest font-heading">
              Sin KPIs asignados
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Tu área no tiene indicadores activos esta semana.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpisSemanales.map((kpi) => (
              <div
                key={kpi.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative h-24 bg-linear-to-br from-azul/10 to-naranja/10 p-5 flex items-start justify-between">
                  <span
                    className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border bg-white ${kpi.es_mi_kpi ? "text-naranja border-naranja/30" : "text-azul border-azul/30"}`}
                  >
                    {kpi.es_mi_kpi ? "Tu Responsabilidad" : "KPI de Equipo"}
                  </span>
                  <FileText className="w-8 h-8 text-azul/20" />
                </div>

                <div className="p-5 flex-1 bg-white">
                  <h3 className="text-lg font-black text-azul font-heading leading-tight mb-4">
                    {kpi.nombre}
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-naranja shrink-0" />
                      <span className="text-xs text-slate-600 font-medium">
                        {kpi.es_mi_kpi
                          ? "Encargado: Tú"
                          : `Encargado: ${kpi.responsable_nombre || "Tu Área"}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-turquesa shrink-0" />
                      <span className="text-xs text-slate-600 font-medium">
                        Vigencia: Esta semana
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                  <button
                    onClick={() => abrirFormulario(kpi)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-azul hover:bg-azul-profundo text-white font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-azul/20"
                  >
                    📝 Llenar Reporte
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const camposUsuario = campos.filter((c) => c.origen === "usuario");
  const camposResultado = campos.filter(
    (c) =>
      c.origen === "calculado" ||
      c.origen === "sistema" ||
      c.campo_label.toLowerCase().includes("semáforo") ||
      c.campo_label.toLowerCase().includes("alerta"),
  );

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500 relative">
      {/* 🔴 AQUÍ RENDERIZAMOS EL TOAST */}
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      <button
        onClick={cerrarFormulario}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-azul mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Volver a mis KPIs
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-azul/10 p-6 md:p-10">
        <div className="mb-8 border-b border-azul/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] bg-naranja/10 text-naranja px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
              Ingreso Semanal
            </span>
            <h2 className="text-2xl font-bold text-azul-profundo font-heading">
              {kpiSeleccionado.nombre}
            </h2>
          </div>
        </div>

        {/* ❌ Eliminamos el div estático de feedback viejo que estaba aquí */}

        {isLoadingCampos ? (
          <div className="text-center py-12 text-gray-500">
            <span className="animate-spin inline-block mr-2 text-xl">⏳</span>{" "}
            Cargando estructura...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {camposUsuario.length > 0 && (
              <div>
                <h3 className="text-sm font-black uppercase text-azul tracking-widest mb-5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-naranja" /> Completar
                  Datos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {camposUsuario.map((c) => {
                    const esTextoLargo =
                      c.campo_label.toLowerCase().includes("observaciones") ||
                      c.campo_label.toLowerCase().includes("acciones");
                    return (
                      <div
                        key={c.id}
                        className={esTextoLargo ? "md:col-span-2" : ""}
                      >
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
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
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-azul focus:bg-white transition-all text-sm resize-none"
                          />
                        ) : (
                          <input
                            type={c.tipo === "numero" ? "number" : "text"}
                            step="any"
                            name={c.campo_key}
                            value={valores[c.campo_key] || ""}
                            onChange={handleChange}
                            required={c.es_requerido}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-azul focus:bg-white transition-all text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {camposResultado.length > 0 && (
              <div className="bg-linear-to-br from-blue-50 to-slate-50 border border-blue-100 p-6 rounded-2xl">
                <h4 className="text-sm font-black uppercase text-azul tracking-widest mb-4">
                  📊 Resultados en Tiempo Real
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {camposResultado.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center text-sm bg-white border border-slate-100 px-4 py-3 rounded-xl shadow-sm"
                    >
                      <strong className="text-slate-600">
                        {c.campo_label}:
                      </strong>
                      {renderResultado(c)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-azul hover:bg-azul-profundo text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-azul/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar Registro"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
