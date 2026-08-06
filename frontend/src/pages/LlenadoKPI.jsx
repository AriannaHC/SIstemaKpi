import { useState, useEffect, useCallback, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import confetti from "canvas-confetti";
import { ChevronLeft } from "lucide-react";
import Toast from "../components/Toast";
import {
  KpiList,
  KpiFormFields,
  KpiResultsPanel,
  ejecutarMotor,
  formatearValor,
  COLOR_AZUL,
  COLOR_NARANJA,
  COLOR_DESHABILITADO,
} from "../components/LlenadoKPI";

export default function LlenadoKPI() {
  // ── Lista ──────────────────────────────────────────────────────────────────
  const [kpisActivos, setKpisActivos] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // ── Formulario ─────────────────────────────────────────────────────────────
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
  // Toast que se muestra en el listado tras un guardado exitoso
  const [listSuccessMsg, setListSuccessMsg] = useState(null);

  // ── 1. Cargar KPIs ─────────────────────────────────────────────────────────
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

  // ── 2. Abrir Formulario ───────────────────────────────────────────────────
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
      if (kpi.completado && kpi.valores_guardados) {
        Object.keys(kpi.valores_guardados).forEach((key) => {
          valoresIniciales[key] = kpi.valores_guardados[key];
        });
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
    // listSuccessMsg se conserva para mostrarse en el listado
  };

  // ── 3. Motor de cálculo ───────────────────────────────────────────────────
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

  // ── Valor de cumplimiento ─────────────────────────────────────────────────
  const cumplimientoValue = (() => {
    const key = Object.keys(contexto).find(
      (k) => k.trim() === "Cumplimiento (%)" || k.trim() === "Cumplimiento",
    );
    return key ? contexto[key] : null;
  })();

  // ── Buscar valor para el panel de resumen ─────────────────────────────────
  const buscarValorDisplay = (labelBuscada) => {
    const lb = labelBuscada.toLowerCase().trim();
    let campoEncontrado;

    if (lb === "cumplimiento") {
      campoEncontrado = campos.find((c) => {
        if (!c.campo_label) return false;
        const clean = c.campo_label.toLowerCase().trim();
        return clean === "cumplimiento (%)" || clean === "cumplimiento";
      });
    } else {
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

    if (lb.includes("meta kpi") && kpiMeta?.meta_valor != null)
      return formatearValor(labelBuscada, kpiMeta.meta_valor);
    if (lb.includes("meta producc") && kpiMeta?.meta_produccion != null)
      return formatearValor(labelBuscada, kpiMeta.meta_produccion);

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

  // ── Validación ────────────────────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    if (!campos || campos.length === 0) return false;
    const camposUsuario = campos.filter((c) => c.origen === "usuario");
    if (camposUsuario.length === 0) return false;
    return camposUsuario.every((c) => {
      const val = valores[c.campo_key];
      return val !== undefined && val !== null && String(val).trim() !== "";
    });
  }, [valores, campos]);

  // ── 4. Enviar ─────────────────────────────────────────────────────────────
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
      await kpiService.registrar({
        kpi_id: kpiSeleccionado.id,
        valores: valoresCompletos,
      });

      confetti({
        particleCount: 700,
        spread: 240,
        origin: { y: 0.6 },
        colors: ["#123498", "#F46F0B", "#ffffff"],
      });

      cargarKpisDiarios();

      // Navegar al listado con el toast de éxito
      setListSuccessMsg("✅ ¡KPI guardado correctamente!");
      setKpiSeleccionado(null);
      setFeedback(null);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: err?.response?.data?.detail || "Error al guardar datos.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── RENDERIZADO: Lista ────────────────────────────────────────────────────
  if (!kpiSeleccionado) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
        <Toast
          message={feedback?.mensaje}
          type={feedback?.tipo}
          onClose={() => setFeedback(null)}
        />
        <Toast
          message={listSuccessMsg}
          type="ok"
          onClose={() => setListSuccessMsg(null)}
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
        <KpiList
          kpisActivos={kpisActivos}
          loadingList={loadingList}
          onLlenar={handleLlenarClick}
        />
      </div>
    );
  }

  // ── RENDERIZADO: Formulario ───────────────────────────────────────────────
  const camposUsuario = campos.filter((c) => c.origen === "usuario");
  const camposResultado = campos.filter(
    (c) =>
      c.origen === "calculado" ||
      c.origen === "sistema" ||
      c.campo_label.toLowerCase().includes("semáforo") ||
      c.campo_label.toLowerCase().includes("alerta"),
  );

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="h-full max-w-5xl mx-auto flex flex-col px-3 py-2 lg:px-0 animate-in slide-in-from-right-8 duration-500 relative">
        <Toast
          message={feedback?.mensaje}
          type={feedback?.tipo}
          onClose={() => setFeedback(null)}
        />

        <div className="bg-white rounded-4xl shadow-xl border border-slate-100 p-4 md:p-6">
          <div className="mb-4 md:mb-8">
            {/* Fila superior: badge + botón volver */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.24em] text-white"
                style={{ backgroundColor: COLOR_AZUL }}
              >
                Ingreso Semanal
              </span>

              <button
                type="button"
                onClick={cerrarFormulario}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-[#123498] text-[#123498] text-xs font-black uppercase tracking-widest hover:bg-[#123498] hover:text-white transition-all duration-200 shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Volver a mis KPIs
              </button>
            </div>

            <h2
              className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading"
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
              <span className="animate-spin inline-block mr-2 text-xl">⏳</span>
              Cargando estructura...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:gap-8 lg:grid-cols-[1.75fr_1.1fr]"
            >
              <div className="space-y-8">
                <KpiFormFields
                  camposUsuario={camposUsuario}
                  valores={valores}
                  onChange={handleChange}
                  textoExpandido={textoExpandido}
                  onToggleTexto={toggleTexto}
                />

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

              <KpiResultsPanel
                camposResultado={camposResultado}
                verResultados={verResultados}
                onToggleResultados={() => setVerResultados(!verResultados)}
                cumplimientoValue={cumplimientoValue}
                buscarValorDisplay={buscarValorDisplay}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
