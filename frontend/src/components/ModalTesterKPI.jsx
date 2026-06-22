// frontend/src/components/ModalTesterKPI.jsx
import React, { useState, useEffect, useMemo } from "react";
import { kpiService } from "../services/kpiService";
import {
  CheckCircle2,
  ChevronRight,
  Calculator,
  AlertTriangle,
  Eye,
  Loader2,
} from "lucide-react";

// ── Semáforo (Colores Corporativos) ────────────────────────────────────────
function SemaforoDisplay({ cumplimiento }) {
  if (
    cumplimiento === null ||
    cumplimiento === undefined ||
    isNaN(cumplimiento)
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Sin calcular
      </span>
    );
  }
  if (cumplimiento >= 0.8)
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" /> Verde
        (Óptimo)
      </span>
    );
  if (cumplimiento >= 0.6)
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-700" /> Amarillo
        (Problemas)
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-700" /> Rojo (Peligro)
    </span>
  );
}

// ── Formateador ──────────────────────────────────────────────────────────────
function formatearValor(label, valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const lbl = label.toLowerCase().trim();

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

  if (lbl.includes("productividad")) {
    const num = parseFloat(valor);
    return isNaN(num) ? String(valor) : num.toFixed(2);
  }

  const num = parseFloat(valor);
  return isNaN(num) ? String(valor) : num.toFixed(2);
}

// ── Motor matemático ─────────────────────────────────────────────────────────
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
        if (!/[^0-9+\-*/().,\sMathmaxinul=<>?!|&:]/i.test(formula)) {
          try {
            const evaluador = new Function("return " + formula);
            const resultado = evaluador();
            const valorFinal =
              !isNaN(resultado) && isFinite(resultado) ? resultado : null;
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

export default function ModalTesterKPI({
  isOpen,
  onClose,
  selectedKpi,
  camposConfigurados,
}) {
  const [valores, setValores] = useState({});
  const [contexto, setContexto] = useState({});
  const [kpiMeta, setKpiMeta] = useState(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";

  // Solo mostramos al usuario sus campos (Ocultamos los del sistema)
  const camposUsuario = useMemo(() => {
    return camposConfigurados.filter((c) => c.origen === "usuario");
  }, [camposConfigurados]);

  // ── Efecto principal: cuando el modal se abre, llamamos a getCampos para obtener kpi_meta ──
  useEffect(() => {
    if (!isOpen) {
      setValores({});
      setContexto({});
      setKpiMeta(null);
      return;
    }

    if (!selectedKpi?.id) return;

    const cargarMetas = async () => {
      setIsLoadingMeta(true);
      try {
        const res = await kpiService.getCampos(selectedKpi.id);
        const meta = res.kpi_meta;
        setKpiMeta(meta);

        // PRE-LLENAR DATOS DEL SISTEMA (Metas) exactamente como en LlenadoKPI
        const valoresIniciales = {};
        camposConfigurados.forEach((c) => {
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
        setValores(valoresIniciales);
      } catch (err) {
        // Si falla, inicializamos vacío para que el usuario al menos pueda escribir
        const valoresIniciales = {};
        camposConfigurados.forEach((c) => {
          valoresIniciales[c.campo_key] = "";
        });
        setValores(valoresIniciales);
      } finally {
        setIsLoadingMeta(false);
      }
    };

    cargarMetas();
  }, [isOpen, selectedKpi?.id, camposConfigurados]);

  // ── Motor matemático se ejecuta cada vez que cambian los valores ──
  useEffect(() => {
    if (camposConfigurados.length === 0) return;
    setContexto(ejecutarMotor(camposConfigurados, valores));
  }, [valores, camposConfigurados]);

  const handleChange = (e) => {
    setValores((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const cumplimientoValue = (() => {
    // Búsqueda ESTRICTA: Solo chapa "Cumplimiento (%)" o "Cumplimiento"
    const key = Object.keys(contexto).find(
      (k) => k.trim() === "Cumplimiento (%)" || k.trim() === "Cumplimiento",
    );
    return key ? contexto[key] : null;
  })();

  // Lógica inteligente idéntica a LlenadoKPI.jsx
  const buscarValorDisplay = (labelBuscada) => {
    const lb = labelBuscada.toLowerCase().trim();
    let campoEncontrado;

    // Regla de oro: Si el resumen pide "Cumplimiento", buscar SOLO el campo exacto
    if (lb === "cumplimiento") {
      campoEncontrado = camposConfigurados.find((c) => {
        if (!c.campo_label) return false;
        const clean = c.campo_label.toLowerCase().trim();
        return clean === "cumplimiento (%)" || clean === "cumplimiento";
      });
    } else {
      // Para el resto de métricas (Eficiencia, Productividad, etc.)
      campoEncontrado = camposConfigurados.find((c) => {
        if (!c.campo_label) return false;
        const clean = c.campo_label.toLowerCase().trim();
        return clean === lb || clean === `${lb} (%)`;
      });
      if (!campoEncontrado) {
        campoEncontrado = camposConfigurados.find(
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
      if (selectedKpi?.meta_valor != null)
        return formatearValor(labelBuscada, selectedKpi.meta_valor);
    }
    if (lb.includes("meta producc") && selectedKpi?.meta_produccion != null) {
      return formatearValor(labelBuscada, selectedKpi.meta_produccion);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-[#123498] leading-tight">
                Modo Prueba
              </h2>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                {selectedKpi?.nombre || "KPI"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoadingMeta ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2
                className="w-8 h-8 animate-spin mb-4"
                style={{ color: COLOR_AZUL }}
              />
              <p className="text-sm font-semibold text-slate-500">
                Cargando estructura del KPI...
              </p>
            </div>
          ) : (
            <>
              {/* Inputs Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-[#F46F0B]" />
                  <h3 className="font-bold text-slate-700 text-sm">
                    Simular Ingreso de Datos
                  </h3>
                </div>
                {camposUsuario.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                    No hay campos configurados con el origen "Usuario".
                  </p>
                ) : (
                  camposUsuario.map((c) => (
                    <div key={c.id} className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest justify-between">
                        {c.campo_label}
                      </label>
                      <input
                        type={c.tipo === "numero" ? "number" : "text"}
                        step="any"
                        name={c.campo_key}
                        value={valores[c.campo_key] || ""}
                        onChange={handleChange}
                        className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 bg-white border-slate-200 focus:border-[#123498]"
                        placeholder={`Ingresa ${c.campo_label}...`}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Results Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-4">
                  Resultados en vivo
                </p>

                {/* Semáforo */}
                <div className="mb-6 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p
                      className="text-3xl font-black"
                      style={{ color: COLOR_AZUL }}
                    >
                      {cumplimientoValue !== null &&
                      cumplimientoValue !== undefined
                        ? `${(cumplimientoValue * 100).toFixed(0)}%`
                        : "--"}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                      Cumplimiento
                    </p>
                  </div>
                  <SemaforoDisplay cumplimiento={cumplimientoValue} />
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-1 gap-3">
                  {resumenLabels.map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-xs text-slate-500 font-medium">
                        {label}
                      </span>
                      <span
                        className="text-sm font-black"
                        style={{ color: COLOR_AZUL }}
                      >
                        {buscarValorDisplay(label)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
