import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Loader2,
  Copy,
  ClipboardPaste,
  ImagePlus,
} from "lucide-react";
import { registroDiarioService } from "../services/registroDiarioService";
import Toast from "./Toast";

export default function LlenadoOperaciones({
  registroId,
  detalle,
  onAuditoriaGuardada,
}) {
  const COLOR_AZUL = "#123498";
  const CACHE_KEY = "audit_operaciones_cache";

  const [valores, setValores] = useState({
    prioridad: "",
    tiempo_real_utilizado: "",
    estado_tarea: "",
    motivo_retraso: "",
    enlace_evidencia: "",
    validacion_lider: "",
    actitud_colaborador: "",
    observaciones: "",
    unidad_medida: "",
    tiempo_estimado: "",
  });

  // NUEVO ESTADO PARA EL ARCHIVO DE IMAGEN
  const [imagenFile, setImagenFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hasCache, setHasCache] = useState(false);

  // Verificar si hay algo en el portapapeles al cargar
  useEffect(() => {
    if (localStorage.getItem(CACHE_KEY)) {
      setHasCache(true);
    }
  }, []);

  // Pre-llenar para edición
  useEffect(() => {
    if (detalle && detalle.auditado_operaciones) {
      setValores({
        prioridad: detalle.prioridad || "",
        tiempo_real_utilizado: detalle.tiempo_real_operaciones || "",
        estado_tarea: detalle.estado_tarea_operaciones || "",
        motivo_retraso: detalle.motivo_retraso || "",
        enlace_evidencia: detalle.enlace_evidencia || "",
        validacion_lider: detalle.validacion_lider || "",
        actitud_colaborador: detalle.actitud_colaborador || "",
        observaciones: detalle.observaciones_operaciones || "",
        unidad_medida: detalle.unidad_medida || "Horas",
        tiempo_estimado: detalle.tiempo_estimado || "",
      });
    }
  }, [detalle]);

  const handleChange = (e) => {
    setValores({ ...valores, [e.target.name]: e.target.value });
  };

  // ── Lógica de Copiar / Pegar (Ignora la imagen) ──
  const handleCopy = () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(valores));
    setHasCache(true);
    setFeedback({
      tipo: "ok",
      mensaje: "Datos de texto copiados al portapapeles.",
    });
  };

  const handlePaste = () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      setValores(JSON.parse(cachedData));
      setFeedback({ tipo: "ok", mensaje: "Datos pegados exitosamente." });
    }
  };

  // ── Lógica de Cálculo: Días de Vencimiento ──
  let diasVencimiento = 0;
  let textEstadoVenc = "";
  let colorEstadoVenc = "";
  let colorNumVenc = COLOR_AZUL;

  if (valores.estado_tarea === "Completada") {
    diasVencimiento = "-";
    textEstadoVenc = "Tarea Finalizada";
    colorEstadoVenc = "text-emerald-500";
    colorNumVenc = COLOR_AZUL;
  } else if (detalle?.fecha_entrega) {
    const fechaLimite = new Date(detalle.fecha_entrega);
    fechaLimite.setHours(23, 59, 59, 999);
    const hoy = new Date();

    const diffTime = fechaLimite - hoy;
    diasVencimiento = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diasVencimiento > 0) {
      textEstadoVenc = "A tiempo";
      colorEstadoVenc = "text-emerald-500";
    } else if (diasVencimiento === 0) {
      textEstadoVenc = "Vence Hoy";
      colorEstadoVenc = "text-amber-500";
      colorNumVenc = "#F46F0B";
    } else {
      textEstadoVenc = "Vencido";
      colorEstadoVenc = "text-red-500";
      colorNumVenc = "#ef4444";
    }
  }

  let horasSugeridas = 0;
  if (detalle?.fecha_inicio && detalle?.fecha_entrega) {
    const inicio = new Date(detalle.fecha_inicio);
    const fin = new Date(detalle.fecha_entrega);
    const diffMs = fin - inicio;
    horasSugeridas = Math.max(0, diffMs / (1000 * 60 * 60)).toFixed(1);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!valores.prioridad || !valores.estado_tarea) {
      setFeedback({
        tipo: "error",
        mensaje: "La prioridad y el estado son obligatorios.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    // USAMOS FORMDATA PARA PODER ENVIAR EL ARCHIVO FÍSICO
    const formData = new FormData();
    formData.append("prioridad", valores.prioridad);
    formData.append(
      "tiempo_real_operaciones",
      parseFloat(valores.tiempo_real_utilizado) || 0,
    );
    formData.append("estado_tarea_operaciones", valores.estado_tarea);
    formData.append("motivo_retraso", valores.motivo_retraso);
    formData.append("actitud_colaborador", valores.actitud_colaborador);
    formData.append("enlace_evidencia", valores.enlace_evidencia);
    formData.append("validacion_lider", valores.validacion_lider);
    formData.append("observaciones_operaciones", valores.observaciones);
    formData.append(
      "dias_vencimiento",
      isNaN(diasVencimiento) ? 0 : diasVencimiento,
    );
    formData.append("unidad_medida", valores.unidad_medida || "Horas");
    formData.append(
      "tiempo_estimado",
      parseFloat(valores.tiempo_estimado) || 0,
    );

    if (imagenFile) {
      formData.append("imagen_evidencia", imagenFile);
    }

    try {
      await registroDiarioService.auditarOperaciones(registroId, formData);

      if (onAuditoriaGuardada) {
        onAuditoriaGuardada("¡Auditoría de Operaciones guardada con éxito!");
      }
    } catch (err) {
      let errorMsg = "Ocurrió un error al guardar la auditoría.";
      const detail = err?.response?.data?.detail;
      if (detail) {
        if (Array.isArray(detail)) {
          // Extraemos los mensajes de los errores de validación
          errorMsg = detail
            .map((e) => `${e.loc?.slice(-1)}: ${e.msg}`)
            .join(" | ");
        } else if (typeof detail === "string") {
          errorMsg = detail;
        }
      }

      setFeedback({
        tipo: "error",
        mensaje: errorMsg,
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
          Evaluación Logística (Operaciones)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Prioridad <span className="text-red-600">*</span>
            </label>
            <select
              required
              name="prioridad"
              value={valores.prioridad}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica / Urgente">Crítica / Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Estado de Tarea <span className="text-red-600">*</span>
            </label>
            <select
              required
              name="estado_tarea"
              value={valores.estado_tarea}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="No iniciada">No iniciada</option>
              <option value="En progreso">En progreso</option>
              <option value="Pausada">Pausada</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Completada">Completada</option>
              <option value="Atrasada">Atrasada</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Tiempo Real Utilizado
            </label>
            <input
              type="number"
              step="any"
              name="tiempo_real_utilizado"
              value={valores.tiempo_real_utilizado}
              onChange={handleChange}
              placeholder="Horas / Días"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Unidad de Medida
            </label>
            <select
              name="unidad_medida"
              value={valores.unidad_medida}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Horas">Horas</option>
              <option value="Días">Días</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Tiempo Estimado
            </label>
            <input
              type="number"
              step="any"
              name="tiempo_estimado"
              value={valores.tiempo_estimado}
              onChange={handleChange}
              placeholder={`Sugerido: ${horasSugeridas} h`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Validación del Líder
            </label>
            <select
              name="validacion_lider"
              value={valores.validacion_lider}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Pendiente a revisión">Pendiente a revisión</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Motivo de Retraso
            </label>
            <select
              name="motivo_retraso"
              value={valores.motivo_retraso}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Ninguno (A Tiempo)">Ninguno (A Tiempo)</option>
              <option value="Ninguno (Por el momento no)">
                Ninguno (Por el momento no)
              </option>
              <option value="Sobrecarga de tareas previas">
                Sobrecarga de tareas previas
              </option>
              <option value="Enfoque en otra actividad del área">
                Enfoque en otra actividad del área
              </option>
              <option value="Problema técnico">Problema técnico</option>
              <option value="Que otra área culmine">
                Que otra área culmine
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Actitud del Colaborador
            </label>
            <select
              name="actitud_colaborador"
              value={valores.actitud_colaborador}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors"
            >
              <option value="">Seleccionar...</option>
              <option value="Actitud buena">Actitud buena</option>
              <option value="Actitud desganada">Actitud desganada</option>
            </select>
          </div>

          {/* ── CELDA DE EVIDENCIA (ENLACE O IMAGEN) ── */}
          <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <label className="text-[10px] font-black text-slate-700 mb-3 uppercase tracking-[0.18em] flex items-center gap-1.5">
              <ImagePlus className="w-4 h-4 text-[#F46F0B]" />
              Evidencia (Enlace o Imagen)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <input
                type="url"
                name="enlace_evidencia"
                value={valores.enlace_evidencia}
                onChange={handleChange}
                placeholder="Pegar enlace (Drive, Docs, etc.)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
              />

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
                  Ó
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => setImagenFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#123498]/10 file:text-[#123498] hover:file:bg-[#123498]/20 transition-all"
                />
              </div>
            </div>
            {/* Mostrar si ya existe una imagen guardada (cuando entra en modo Edición) */}
            {detalle?.imagen_evidencia && !imagenFile && (
              <p className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-widest">
                ✓ Imagen adjunta actualmente:{" "}
                {detalle.imagen_evidencia.split("/").pop()}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-700 mb-1.5 uppercase tracking-[0.18em]">
              Observaciones
            </label>
            <textarea
              rows="2"
              name="observaciones"
              value={valores.observaciones}
              onChange={handleChange}
              placeholder="Anotaciones logísticas..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#123498] focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── COLUMNA DERECHA: MÉTRICAS Y BOTÓN GUARDAR ── */}
      <div className="flex flex-col gap-4 sticky top-6">
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-[#123498]/5 via-slate-50 to-[#F46F0B]/5 p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-2">
            Cálculo del Sistema
          </p>
          <h3
            className="text-xl font-extrabold mb-5"
            style={{ color: COLOR_AZUL }}
          >
            Estado Logístico
          </h3>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col items-center justify-center text-center shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">
                Días Restantes
              </p>
              <span
                className="text-5xl font-black"
                style={{ color: colorNumVenc }}
              >
                {diasVencimiento}
              </span>
              <p
                className={`text-[10px] uppercase tracking-widest font-bold mt-2 ${colorEstadoVenc}`}
              >
                {textEstadoVenc}
              </p>
            </div>
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
