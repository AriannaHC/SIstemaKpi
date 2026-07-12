import React, { useState, useEffect } from "react";
import { ClipboardCheck, Loader2, Copy, ClipboardPaste } from "lucide-react";
import { registroDiarioService } from "../services/registroDiarioService";
import Toast from "./Toast";

export default function LlenadoCalidad({
  registroId,
  detalle,
  onAuditoriaGuardada,
}) {
  const COLOR_AZUL = "#123498";
  const CACHE_KEY = "audit_calidad_cache"; // Llave única para calidad

  const [valores, setValores] = useState({
    estado_entregable: "",
    estado_animo: "",
    tiempo_estandar: "",
    tiempo_real: "",
    errores_observaciones: "0",
    observaciones: "",
    rubrica_final: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hasCache, setHasCache] = useState(false);

  // Verificar si hay algo en el portapapeles al cargar
  useEffect(() => {
    if (localStorage.getItem(CACHE_KEY)) {
      setHasCache(true);
    }
  }, []);

  // Si el detalle ya tiene datos de calidad, pre-llenar para edición
  useEffect(() => {
    if (detalle && detalle.auditado_calidad) {
      setValores({
        estado_entregable: detalle.estado_entregable_calidad || "",
        estado_animo: detalle.estado_animo || "",
        tiempo_estandar: detalle.tiempo_estandar || "",
        tiempo_real: detalle.tiempo_real_calidad || "",
        errores_observaciones: detalle.errores_observaciones || "0",
        observaciones: detalle.observaciones_calidad || "",
        rubrica_final: detalle.rubrica_final || "",
      });
    }
  }, [detalle]);

  const handleChange = (e) => {
    setValores({ ...valores, [e.target.name]: e.target.value });
  };

  // ── Lógica de Copiar / Pegar ──
  const handleCopy = () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(valores));
    setHasCache(true);
    setFeedback({
      tipo: "ok",
      mensaje: "Datos copiados al portapapeles temporal.",
    });
  };

  const handlePaste = () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      setValores(JSON.parse(cachedData));
      setFeedback({ tipo: "ok", mensaje: "Datos pegados exitosamente." });
    }
  };

  // Cálculos automáticos en vivo
  const tEstandar = parseFloat(valores.tiempo_estandar) || 0;
  const tReal = parseFloat(valores.tiempo_real) || 0;
  const errores = parseFloat(valores.errores_observaciones) || 0;

  const eficiencia = tReal > 0 ? (tEstandar / tReal) * 100 : 0;
  const tasaCalidad = 1 > 0 ? ((1 - errores) / 1) * 100 : 0;

  let horasSugeridas = 0;
  if (detalle?.fecha_inicio && detalle?.fecha_entrega) {
    const inicio = new Date(detalle.fecha_inicio);
    const fin = new Date(detalle.fecha_entrega);
    const diffMs = fin - inicio;
    horasSugeridas = Math.max(0, diffMs / (1000 * 60 * 60)).toFixed(1);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !valores.estado_entregable ||
      !valores.estado_animo ||
      !valores.rubrica_final
    ) {
      setFeedback({
        tipo: "error",
        mensaje: "El estado, estado de ánimo y la rúbrica son obligatorios.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload = {
      estado_entregable_calidad: valores.estado_entregable,
      estado_animo: valores.estado_animo,
      tiempo_estandar: tEstandar,
      tiempo_real_calidad: tReal,
      errores_observaciones: valores.errores_observaciones.toString(),
      observaciones_calidad: valores.observaciones,
      rubrica_final: valores.rubrica_final,
      eficiencia: eficiencia,
      tasa_calidad: tasaCalidad,
    };

    try {
      await registroDiarioService.auditarCalidad(registroId, payload);

      if (onAuditoriaGuardada) {
        onAuditoriaGuardada("¡Auditoría de Calidad guardada con éxito!");
      }
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje:
          err?.response?.data?.detail ||
          "Ocurrió un error al guardar la auditoría.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 md:gap-6 lg:grid-cols-[2fr_1fr] items-start relative"
    >
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      {/* ── COLUMNA IZQUIERDA: FORMULARIO ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4" style={{ color: COLOR_AZUL }}>
          Evaluación Técnica (Calidad)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Estado del Entregable <span className="text-red-600">*</span>
            </label>
            <select
              required
              name="estado_entregable"
              value={valores.estado_entregable}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Aprobado">Aprobado</option>
              <option value="En proceso">En proceso</option>
              <option value="En revisión">En revisión</option>
              <option value="Observado">Observado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Estado de Ánimo <span className="text-red-600">*</span>
            </label>
            <select
              required
              name="estado_animo"
              value={valores.estado_animo}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Bueno">Bueno</option>
              <option value="Regular">Regular</option>
              <option value="Malo">Malo</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Tiempo Estándar (Horas)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="tiempo_estandar"
              value={valores.tiempo_estandar}
              onChange={handleChange}
              placeholder={`Sugerido: ${horasSugeridas} h`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Tiempo Real (Horas)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="tiempo_real"
              value={valores.tiempo_real}
              onChange={handleChange}
              placeholder="Ej. 3.0"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Cantidad de Errores
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="errores_observaciones"
              value={valores.errores_observaciones}
              onChange={handleChange}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Rúbrica Final <span className="text-red-600">*</span>
            </label>
            <select
              required
              name="rubrica_final"
              value={valores.rubrica_final}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar evaluación...</option>
              <option value="Excelente (90-100%)">Excelente (90-100%)</option>
              <option value="Bueno (75-89%)">Bueno (75-89%)</option>
              <option value="Regular (60-74%)">Regular (60-74%)</option>
              <option value="Deficiente (0-60%)">Deficiente (0-60%)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Observaciones de Calidad
            </label>
            <textarea
              rows="2"
              name="observaciones"
              value={valores.observaciones}
              onChange={handleChange}
              placeholder="Anotaciones adicionales sobre el entregable..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── COLUMNA DERECHA: MÉTRICAS Y BOTÓN GUARDAR ── */}
      <div className="flex flex-col gap-4 sticky top-6">
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-[#123498]/5 via-slate-50 to-[#F46F0B]/5 p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
            Métricas Automáticas
          </p>
          <h3
            className="text-xl font-extrabold mb-5"
            style={{ color: COLOR_AZUL }}
          >
            Resultados
          </h3>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-600">
                  Eficiencia (Tiempo)
                </span>
                <span
                  className="text-base font-black"
                  style={{ color: COLOR_AZUL }}
                >
                  {eficiencia.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(eficiencia, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-600">
                  Tasa de Calidad
                </span>
                <span
                  className="text-base font-black"
                  style={{ color: COLOR_AZUL }}
                >
                  {tasaCalidad.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(tasaCalidad, 100))}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-2">
              Unidades evaluadas: 1 (Fijo)
            </p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN (COPIAR/PEGAR Y GUARDAR) */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[11px] uppercase tracking-widest py-2.5 transition-all hover:bg-slate-50 hover:text-[#123498] hover:border-[#123498]"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar
            </button>
            <button
              type="button"
              onClick={handlePaste}
              disabled={!hasCache}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[11px] uppercase tracking-widest py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-[#F46F0B] hover:border-[#F46F0B]"
            >
              <ClipboardPaste className="w-3.5 h-3.5" /> Pegar
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] py-3.5 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: COLOR_AZUL }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" /> Guardar Auditoría
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
