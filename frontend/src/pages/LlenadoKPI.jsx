import { useState, useEffect, useCallback, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import {
  FileText,
  Clock,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Target,
} from "lucide-react";
import Toast from "../components/Toast";

// ── Semáforo (Colores Corporativos) ────────────────────────────────────────
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

// ── Formateador ──────────────────────────────────────────────────────────────
function formatearValor(label, valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const lbl = label.toLowerCase().trim();

  // FIX: Búsqueda exacta para evitar que "Puntuación de cumplimiento técnico"
  // sufra un falso positivo y se multiplique por 100.
  const esPorcentaje =
    lbl === "cumplimiento" ||
    lbl === "cumplimiento (%)" ||
    lbl === "eficiencia" ||
    lbl === "eficiencia (%)" ||
    lbl === "eficacia" ||
    lbl === "eficacia (%)" ||
    lbl === "efectividad" ||
    lbl === "efectividad (%)" ||
    lbl === "rendimiento" ||
    lbl === "rendimiento (%)";

  if (esPorcentaje) {
    return (parseFloat(valor) * 100).toFixed(2) + "%";
  }

  // FIX: Productividad se muestra como número normal.
  // (Si en algún momento lo quieres sin decimales, cambia num.toFixed(2) a Math.round(num).toString())
  if (lbl.includes("productividad")) {
    const num = parseFloat(valor);
    return isNaN(num) ? String(valor) : num.toFixed(2);
  }

  // Cualquier otro campo numérico (ej. Puntuación de cumplimiento técnico)
  const num = parseFloat(valor);
  return isNaN(num) ? String(valor) : num.toFixed(2);
}

// ── Motor matemático Optimizado y Seguro ──────────────────────────────────────
function ejecutarMotor(campos, valores) {
  let contexto = {};
  campos.forEach((c) => {
    const raw = valores[c.campo_key];
    const lbl = c.campo_label.toLowerCase();

    // MAGIA: Si el campo es una fecha, lo convertimos a "días totales"
    if (
      lbl.includes("fecha") &&
      raw &&
      typeof raw === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(raw)
    ) {
      contexto[c.campo_label] = new Date(raw).getTime() / 86400000;
    } else if (c.tipo === "texto") {
      contexto[c.campo_label] = raw ?? "";
    } else {
      contexto[c.campo_label] =
        raw === "" || raw === undefined || raw === null
          ? null
          : parseFloat(raw);
    }
  });

  // OPTIMIZACIÓN: Añadimos un indicador "huboCambios" (Early Exit).
  // Si en un pase no se calculó nada nuevo, no hacemos los pases restantes.
  let huboCambios = true;
  for (let pase = 1; pase <= 4 && huboCambios; pase++) {
    huboCambios = false;

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
        // SEGURIDAD: Expresión regular que solo permite matemáticas válidas (Números, operadores y Math.max/min)
        // Bloquea cualquier inyección de código JavaScript (XSS).
        if (!/[^0-9+\-*/().,\sMathmaxinul=<>?!|&:]/i.test(formula)) {
          try {
            // Usamos new Function en lugar de eval() por ser más restrictivo
            const evaluador = new Function("return " + formula);
            const resultado = evaluador();
            const valorFinal =
              !isNaN(resultado) && isFinite(resultado) ? resultado : null;

            // Si el valor cambió en este pase, marcamos que hubo cambios para dar otra vuelta si es necesario
            if (contexto[c.campo_label] !== valorFinal) {
              contexto[c.campo_label] = valorFinal;
              huboCambios = true;
            }
          } catch (_) {
            if (contexto[c.campo_label] !== null) {
              contexto[c.campo_label] = null;
              huboCambios = true;
            }
          }
        }
      } else {
        if (contexto[c.campo_label] !== null) {
          contexto[c.campo_label] = null;
          huboCambios = true;
        }
      }
    });
  }
  return contexto;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LlenadoKPI() {
  const [kpisActivos, setKpisActivos] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [kpiSeleccionado, setKpiSeleccionado] = useState(null);
  const [kpiMeta, setKpiMeta] = useState(null);
  const [campos, setCampos] = useState([]);
  const [valores, setValores] = useState({});
  const [contexto, setContexto] = useState({});
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verResultados, setVerResultados] = useState(false);
  const [textoExpandido, setTextoExpandido] = useState({});
  const [feedback, setFeedback] = useState(null);

  // Colores Corporativos
  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";
  const COLOR_DESHABILITADO = "#cbd5e1";

  // ── 1. Cargar KPIs ───────────────────────────────────────────────────────
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

      setKpiMeta(meta);

      const valoresIniciales = {};

      if (kpi.completado) {
        if (kpi.valores_guardados) {
          Object.keys(kpi.valores_guardados).forEach((key) => {
            valoresIniciales[key] = kpi.valores_guardados[key];
          });
        }
      }

      dataCampos.forEach((c) => {
        if (valoresIniciales[c.campo_key] === undefined) {
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
        }
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

  // ── 3. Motor ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (campos.length === 0) return;
    setContexto(ejecutarMotor(campos, valores));
  }, [valores, campos]);

  const handleChange = useCallback((e) => {
    setValores((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const toggleTexto = useCallback((key) => {
    setTextoExpandido((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const cumplimientoValue = (() => {
    const key = Object.keys(contexto).find(
      (k) => k.trim() === "Cumplimiento (%)" || k.trim() === "Cumplimiento",
    );
    return key ? contexto[key] : null;
  })();

  const buscarValorDisplay = (labelBuscada) => {
    const lb = labelBuscada.toLowerCase().trim();
    let campoEncontrado;

    // Regla de oro: Si el resumen pide "Cumplimiento", buscar SOLO el campo exacto
    if (lb === "cumplimiento") {
      campoEncontrado = campos.find((c) => {
        if (!c.campo_label) return false;
        const clean = c.campo_label.toLowerCase().trim();
        return clean === "cumplimiento (%)" || clean === "cumplimiento";
      });
    } else {
      // Para el resto de métricas (Eficiencia, Productividad, etc.)
      campoEncontrado = campos.find((c) => {
        if (!c.campo_label) return false;
        const clean = c.campo_label.toLowerCase().trim();
        return clean === lb || clean === `${lb} (%)`;
      });
      if (!campoEncontrado) {
        campoEncontrado = campos.find(
          (c) => c.campo_label && c.campo_label.toLowerCase().includes(lb),
        );
      }
    }

    if (campoEncontrado) {
      const val = contexto[campoEncontrado.campo_label];
      if (val !== undefined && val !== null) {
        return formatearValor(campoEncontrado.campo_label, val);
      }
    }

    if (lb.includes("meta kpi")) {
      if (kpiMeta?.meta_valor != null)
        return formatearValor(labelBuscada, kpiMeta.meta_valor);
    }
    if (lb.includes("meta producc") && kpiMeta?.meta_produccion != null) {
      return formatearValor(labelBuscada, kpiMeta.meta_produccion);
    }

    for (const [key, val] of Object.entries(contexto)) {
      if (
        key.toLowerCase().trim() === lb &&
        val !== null &&
        val !== undefined
      ) {
        return formatearValor(key, val);
      }
    }

    return "-";
  };

  // ── VALIDACIÓN ESTRICTA FORZADA ──────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    if (!campos || campos.length === 0) return false;

    const camposUsuario = campos.filter((c) => c.origen === "usuario");

    if (camposUsuario.length === 0) return false;

    return camposUsuario.every((c) => {
      const val = valores[c.campo_key];
      if (val === undefined || val === null) return false;
      if (String(val).trim() === "") return false;
      return true;
    });
  }, [valores, campos]);

  // ── 4. Enviar ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setFeedback({
        tipo: "error",
        mensaje: "Por favor completa todos los campos visibles.",
      });
      return;
    }

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
        mensaje: `✅ Registro exitoso.`,
      });

      if (!kpiSeleccionado.completado) {
        const valoresReset = {};
        campos.forEach((c) => {
          const lbl = c.campo_label.toLowerCase();
          valoresReset[c.campo_key] =
            lbl.includes("meta") || lbl.includes("horas planificadas")
              ? valores[c.campo_key]
              : "";
        });
        setValores(valoresReset);
      }
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
  // ── RENDERIZADO
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
          <h1
            className="text-3xl font-extrabold font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Tus Indicadores{" "}
            <span style={{ color: COLOR_NARANJA }}>Pendientes</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Estos son los KPIs programados que debes completar en esta fecha.
          </p>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-20">
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: COLOR_AZUL, borderTopColor: "transparent" }}
            ></div>
          </div>
        ) : kpisActivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Target className="w-14 h-14 text-slate-200 mb-4" />
            <p
              className="font-black text-lg uppercase tracking-widest font-heading"
              style={{ color: COLOR_AZUL }}
            >
              Todo al día
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpisActivos.map((kpi) => {
              const isCompletado = kpi.completado;
              const isVencido =
                kpi.fecha_fin && new Date() > new Date(kpi.fecha_fin);

              return (
                <div
                  key={kpi.id}
                  className={`rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden flex flex-col ${
                    isCompletado
                      ? "bg-slate-50 border-slate-200 opacity-80"
                      : isVencido
                        ? "bg-red-50 border-red-200"
                        : "bg-white border-slate-100 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`relative h-24 p-5 flex items-start justify-between ${
                      isCompletado
                        ? "bg-slate-200"
                        : isVencido
                          ? "bg-red-100"
                          : "bg-linear-to-br from-[#123498]/10 to-[#F46F0B]/10"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border bg-white ${
                        isCompletado
                          ? "text-slate-500 border-slate-300"
                          : isVencido
                            ? "text-red-600 border-red-300"
                            : kpi.es_mi_kpi
                              ? "text-[#F46F0B] border-[#F46F0B]/30"
                              : "text-[#123498] border-[#123498]/30"
                      }`}
                    >
                      {isCompletado
                        ? "Completado"
                        : isVencido
                          ? "Plazo Expirado"
                          : kpi.es_mi_kpi
                            ? "Tu responsabilidad"
                            : "KPI de equipo"}
                    </span>
                    <FileText
                      className={`w-8 h-8 ${isCompletado ? "text-slate-400" : "text-[#123498]/20"}`}
                    />
                  </div>

                  <div
                    className={`p-5 flex-1 flex flex-col ${isCompletado ? "bg-slate-50" : "bg-white"}`}
                  >
                    <h3
                      className={`text-base font-black font-heading leading-tight mb-4 flex-1 ${isCompletado ? "text-slate-500" : ""}`}
                      style={{ color: isCompletado ? "" : COLOR_AZUL }}
                    >
                      {kpi.nombre}
                    </h3>
                    <div className="space-y-3 bg-white/50 rounded-xl p-3 border border-slate-100/50">
                      <div className="flex items-start gap-2">
                        <User
                          className={`w-4 h-4 shrink-0 mt-0.5`}
                          style={{
                            color: isCompletado ? "#94a3b8" : COLOR_AZUL,
                          }}
                        />
                        <div>
                          <p
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{
                              color: isCompletado ? "#94a3b8" : COLOR_AZUL,
                            }}
                          >
                            Encargado
                          </p>
                          <p className="text-xs text-slate-600 font-medium">
                            {kpi.responsable_nombre || "Equipo"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock
                          className={`w-4 h-4 shrink-0 mt-0.5`}
                          style={{
                            color: isCompletado
                              ? "#94a3b8"
                              : isVencido
                                ? "#ef4444"
                                : COLOR_NARANJA,
                          }}
                        />
                        <div>
                          <p
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{
                              color: isCompletado
                                ? "#94a3b8"
                                : isVencido
                                  ? "#ef4444"
                                  : COLOR_NARANJA,
                            }}
                          >
                            Vigencia
                          </p>
                          <p
                            className={`text-xs font-bold ${isVencido && !isCompletado ? "text-red-600" : "text-slate-600"}`}
                          >
                            {kpi.fecha_fin
                              ? `Vence: ${new Date(kpi.fecha_fin).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}`
                              : "Sin fecha"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-t ${isCompletado ? "border-slate-200 bg-slate-100" : "border-slate-50 bg-slate-50/50"}`}
                  >
                    {isCompletado ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Entregado
                      </button>
                    ) : isVencido ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-100 text-red-500 font-black text-xs uppercase tracking-widest cursor-not-allowed"
                      >
                        Cerrado por Sistema
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLlenarClick(kpi)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
                        style={{ backgroundColor: COLOR_AZUL }}
                      >
                        📝 Llenar Reporte
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      <div className="h-full max-w-5xl mx-auto flex flex-col px-3 py-2 lg:px-0 animate-in slide-in-from-right-8 duration-500 relative">
        <Toast
          message={feedback?.mensaje}
          type={feedback?.tipo}
          onClose={() => setFeedback(null)}
        />

        <button
          onClick={cerrarFormulario}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-3 transition-colors hover:text-[#123498]"
        >
          <ChevronLeft className="w-4 h-4" /> Volver a mis KPIs
        </button>

        <div className="bg-white rounded-4xl shadow-xl border border-slate-100 p-4 md:p-6">
          <div className="mb-4 md:mb-8">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.24em] text-white"
              style={{ backgroundColor: COLOR_AZUL }}
            >
              Ingreso Semanal
            </span>
            <h2
              className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight font-heading"
              style={{ color: COLOR_AZUL }}
            >
              {kpiSeleccionado.nombre}
            </h2>
            <p className="mt-1 md:mt-3 text-xs md:text-sm text-slate-500 max-w-2xl leading-6">
              Completa los datos clave para este KPI.
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
              className="grid gap-4 md:gap-8 lg:grid-cols-[1.75fr_1.1fr]"
            >
              <div className="space-y-8">
                <div className="rounded-4xl border border-slate-200 bg-slate-50 p-4 md:p-6 shadow-sm">
                  <div className="mb-3 md:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3
                        className="text-base md:text-lg font-bold"
                        style={{ color: COLOR_AZUL }}
                      >
                        Datos a completar
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Ingresa la información necesaria.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-slate-500 border border-slate-200">
                      {camposUsuario.length} campos
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 flex-1 min-h-0 overflow-y-auto pr-2 pb-1 md:pb-3">
                    {camposUsuario.map((c) => {
                      const esTextoLargo =
                        c.campo_label.toLowerCase().includes("observaciones") ||
                        c.campo_label.toLowerCase().includes("acciones");
                      return (
                        <div
                          key={c.id}
                          className={esTextoLargo ? "md:col-span-2" : ""}
                        >
                          {esTextoLargo ? (
                            <>
                              {/* Mobile: toggle button */}
                              <button
                                type="button"
                                onClick={() => toggleTexto(c.campo_key)}
                                className="lg:hidden w-full flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                              >
                                <span>{c.campo_label}</span>
                                <ChevronDown
                                  className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                                    textoExpandido[c.campo_key]
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              </button>
                              {textoExpandido[c.campo_key] && (
                                <div className="lg:hidden mt-2">
                                  <textarea
                                    name={c.campo_key}
                                    value={valores[c.campo_key] || ""}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 md:py-3 text-sm text-slate-700 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all resize-none"
                                  />
                                </div>
                              )}
                              {/* Desktop: label + textarea siempre visible */}
                              <div className="hidden lg:block">
                                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                                  {c.campo_label}{" "}
                                  <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                  name={c.campo_key}
                                  value={valores[c.campo_key] || ""}
                                  onChange={handleChange}
                                  rows={4}
                                  className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 md:py-3 text-sm text-slate-700 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all resize-none"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                                {c.campo_label}{" "}
                                <span className="text-red-600">*</span>
                              </label>
                              <input
                                type={
                                  c.campo_label.toLowerCase().includes("fecha")
                                    ? "date"
                                    : c.tipo === "numero"
                                      ? "number"
                                      : "text"
                                }
                                step="any"
                                name={c.campo_key}
                                value={valores[c.campo_key] || ""}
                                onChange={handleChange}
                                required
                                className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 md:py-3 text-sm text-slate-700 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="w-full rounded-3xl text-white font-black text-sm uppercase tracking-[0.3em] py-3 md:py-4 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-100"
                  style={{
                    backgroundColor:
                      !isFormValid || isSubmitting
                        ? COLOR_DESHABILITADO
                        : COLOR_AZUL,
                    color: !isFormValid || isSubmitting ? "#64748b" : "white",
                    boxShadow:
                      !isFormValid || isSubmitting
                        ? "none"
                        : `0 10px 15px -3px ${COLOR_AZUL}40`,
                  }}
                >
                  {isSubmitting
                    ? "Guardando..."
                    : !isFormValid
                      ? "Debes completar todos los campos"
                      : "Guardar Registro"}
                </button>
              </div>

              {/* Botón toggle solo en mobile */}
              {camposResultado.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVerResultados(!verResultados)}
                  className="lg:hidden w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-white transition-all"
                >
                  <span>Ver resultados en vivo</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
                      verResultados ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}

              {camposResultado.length > 0 && (
                <div
                  className={`${verResultados ? "block" : "hidden"} lg:block lg:sticky lg:top-6 lg:self-start`}
                >
                  <div className="rounded-4xl border border-slate-200 bg-linear-to-br from-[#123498]/5 via-slate-50 to-[#F46F0B]/5 p-4 md:p-6 shadow-sm">
                    <div className="mb-3 md:mb-6">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-black mb-3">
                        Resultados en tiempo real
                      </p>
                      <h3
                        className="text-lg md:text-2xl font-extrabold"
                        style={{ color: COLOR_AZUL }}
                      >
                        Estado de tu KPI
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-3xl bg-white border border-slate-200 p-3 md:p-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-black mb-1 md:mb-2">
                          Semáforo de cumplimiento
                        </p>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p
                              className="text-2xl md:text-4xl font-black"
                              style={{ color: COLOR_AZUL }}
                            >
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
                        <div className="mt-4 h-2 md:h-3 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-[#123498] to-[#3b82f6]"
                            style={{
                              width: cumplimientoValue
                                ? `${Math.max(5, Math.min(cumplimientoValue * 100, 100))}%`
                                : "5%",
                            }}
                          />
                        </div>
                      </div>

                      <div className="rounded-3xl bg-white border border-slate-200 p-3 md:p-5 space-y-2 md:space-y-4">
                        <div className="grid grid-cols-1 gap-2 md:gap-4">
                          {resumenLabels.map((label) => (
                            <div
                              key={label}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-sm text-slate-500 font-medium">
                                {label}
                              </span>
                              <span
                                className="text-sm font-bold"
                                style={{ color: COLOR_AZUL }}
                              >
                                {buscarValorDisplay(label)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
