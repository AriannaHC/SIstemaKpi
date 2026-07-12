// frontend/src/pages/LlenadoRegistroDiario.jsx
import React, { useState, useEffect } from "react";
import { registroDiarioService } from "../services/registroDiarioService";
import { userService } from "../services/userService";
import {
  Send,
  NotebookPen,
  CalendarRange,
  UserCheck,
  ClipboardList,
  Layers,
  Briefcase,
} from "lucide-react";
import Toast from "../components/Toast";
import confetti from "canvas-confetti";

// ── Arrays de opciones ───────────────────────────────────────────────────────
const PROCESOS_OPCIONES = [
  "Conciliación Bancaria",
  "Cierre Contable",
  "Evaluación de Clima",
  "Onboarding",
  "Diseño de Campaña",
  "Edición de video",
  "Code Review",
  "Portafolio",
  "Informe / Reporte",
  "Pieza para RR.SS",
  "Mascota Corporativa",
  "Pautas de Contenido",
  "Página Web / Landing Page",
  "Prototipo / Flujo Web",
  "Reporte Administrativo / Financiero",
  "Presentación",
  "Propuesta para cliente",
];

const TIPOS_ACTIVIDAD_OPCIONES = [
  "Creación",
  "Corrección",
  "Edición",
  "Revisión",
  "Publicación",
  "Validación",
  "Redacción",
  "Desarrollo",
  "Prototipado",
  "Análisis",
  "Elaboración",
  "Registro",
];

const TIPOS_TAREA_OPCIONES = [
  "Administrativa",
  "Entrega de informes y reuniones",
  "Reuniones",
  "Publicación de redes sociales",
  "Desarrollo/Programación",
  "Diseño audiovisual",
  "Creación de Flyer/Posts",
  "Análisis de Datos",
  "Iniciativa propia",
  "Investigación",
  "Capacitación",
  "Mejoras en la Tarea",
  "Realización / entrega de informe",
];

// ── Colores corporativos ─────────────────────────────────────────────────────
const COLOR_AZUL = "#123498";
const COLOR_NARANJA = "#F46F0B";
const COLOR_DESHABILITADO = "#cbd5e1";

export default function LlenadoRegistroDiario() {
  const [formData, setFormData] = useState({
    proceso: "",
    tipo_actividad: "",
    tipo_tarea: "", // <--- AÑADIDO
    entregable: "",
    responsable_asigna: "",
    fecha_inicio: "",
    fecha_entrega: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [compañeros, setCompañeros] = useState([]);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const fetchCompañeros = async () => {
      try {
        const data = await userService.getMiEquipo();
        if (Array.isArray(data)) {
          setCompañeros(data);
        } else if (data.users) {
          setCompañeros(data.users);
        }
      } catch (error) {
        console.error("Error al cargar compañeros:", error);
      }
    };
    fetchCompañeros();
  }, []);

  const handleEntregableChange = (e) => {
    const text = e.target.value;
    if (text.length <= 250) {
      setFormData({ ...formData, entregable: text });
      setCharCount(text.length);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid =
    formData.proceso &&
    formData.tipo_actividad &&
    formData.tipo_tarea && // <--- AÑADIDO
    formData.entregable.trim() &&
    formData.responsable_asigna &&
    formData.fecha_inicio &&
    formData.fecha_entrega;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await registroDiarioService.crearRegistro(formData);
      setFeedback({ tipo: "ok", mensaje: "¡Registro enviado con éxito!" });
      confetti({
        particleCount: 700,
        spread: 240,
        origin: { y: 0.6 },
        colors: ["#123498", "#F46F0B", "#ffffff"],
      });
      setFormData({
        proceso: "",
        tipo_actividad: "",
        tipo_tarea: "",
        entregable: "",
        responsable_asigna: "",
        fecha_inicio: "",
        fecha_entrega: "",
      });
      setCharCount(0);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje:
          err?.response?.data?.detail ||
          "Ocurrió un error al enviar el registro.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto relative">
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
          Formulario de{" "}
          <span style={{ color: COLOR_NARANJA }}>Actividades Diarias</span>
        </h1>
      </div>

      <div className="bg-white rounded-4xl shadow-xl border border-slate-100 p-4 md:p-6 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="rounded-4xl border border-slate-200 bg-slate-50 p-4 md:p-6 shadow-sm">
            <div className="mb-3 md:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3
                  className="text-base md:text-lg font-bold"
                  style={{ color: COLOR_AZUL }}
                >
                  Datos de la Actividad
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Registra los detalles de la tarea o entregable que realizaste.
                  Completa todos los campos obligatorios.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.3em] text-slate-500 border border-slate-200">
                7 campos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {/* PROCESO */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                  <span className="flex items-center gap-1.5">
                    <Layers
                      className="w-3.5 h-3.5"
                      style={{ color: COLOR_AZUL }}
                    />{" "}
                    Proceso <span className="text-red-600">*</span>
                  </span>
                </label>
                <select
                  required
                  name="proceso"
                  value={formData.proceso}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                >
                  <option value="">Selecciona el proceso...</option>
                  {PROCESOS_OPCIONES.map((op, idx) => (
                    <option key={idx} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO DE ACTIVIDAD (Calidad) */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                  <span className="flex items-center gap-1.5">
                    <ClipboardList
                      className="w-3.5 h-3.5"
                      style={{ color: COLOR_AZUL }}
                    />{" "}
                    Tipo de Actividad (Calidad){" "}
                    <span className="text-red-600">*</span>
                  </span>
                </label>
                <select
                  required
                  name="tipo_actividad"
                  value={formData.tipo_actividad}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                >
                  <option value="">Selecciona el tipo...</option>
                  {TIPOS_ACTIVIDAD_OPCIONES.map((op, idx) => (
                    <option key={idx} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO DE TAREA (Operaciones) */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                  <span className="flex items-center gap-1.5">
                    <Briefcase
                      className="w-3.5 h-3.5"
                      style={{ color: COLOR_AZUL }}
                    />{" "}
                    Tipo de Tarea (Operaciones){" "}
                    <span className="text-red-600">*</span>
                  </span>
                </label>
                <select
                  required
                  name="tipo_tarea"
                  value={formData.tipo_tarea}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                >
                  <option value="">Selecciona la tarea...</option>
                  {TIPOS_TAREA_OPCIONES.map((op, idx) => (
                    <option key={idx} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              {/* RESPONSABLE QUE ASIGNA */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                  <span className="flex items-center gap-1.5">
                    <UserCheck
                      className="w-3.5 h-3.5"
                      style={{ color: COLOR_AZUL }}
                    />{" "}
                    Responsable que asigna{" "}
                    <span className="text-red-600">*</span>
                  </span>
                </label>
                <select
                  required
                  name="responsable_asigna"
                  value={formData.responsable_asigna}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                >
                  <option value="">Selecciona al líder o compañero...</option>
                  {compañeros.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ENTREGABLE */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-[0.18em]">
                    <span className="flex items-center gap-1.5">
                      <NotebookPen
                        className="w-3.5 h-3.5"
                        style={{ color: COLOR_AZUL }}
                      />{" "}
                      Entregable / Tarea <span className="text-red-600">*</span>
                    </span>
                  </label>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${charCount >= 250 ? "bg-red-100 text-red-600" : charCount >= 200 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}
                  >
                    {charCount} / 250
                  </span>
                </div>
                <textarea
                  required
                  rows="3"
                  maxLength={250}
                  name="entregable"
                  value={formData.entregable}
                  onChange={handleEntregableChange}
                  placeholder="Describe detalladamente lo que hiciste..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498] resize-none"
                />
              </div>

              {/* FECHAS */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                  <span className="flex items-center gap-1.5">
                    <CalendarRange
                      className="w-3.5 h-3.5"
                      style={{ color: COLOR_NARANJA }}
                    />{" "}
                    Fecha y Hora de Inicio <span className="text-red-600">*</span>
                  </span>
                </label>
                <input
                  required
                  type="datetime-local"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                  <span className="flex items-center gap-1.5">
                    <CalendarRange
                      className="w-3.5 h-3.5"
                      style={{ color: COLOR_NARANJA }}
                    />{" "}
                    Fecha y Hora Límite / Entrega{" "}
                    <span className="text-red-600">*</span>
                  </span>
                </label>
                <input
                  required
                  type="datetime-local"
                  name="fecha_entrega"
                  value={formData.fecha_entrega}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 focus:border-[#123498]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="w-full rounded-3xl text-white font-black text-sm uppercase tracking-[0.3em] py-3 md:py-4 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-100 flex items-center justify-center gap-3"
            style={{
              backgroundColor:
                !isFormValid || isSubmitting ? COLOR_DESHABILITADO : COLOR_AZUL,
            }}
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Guardar Actividad
              </>
            )}
          </button>
        </form>

        <NotebookPen className="absolute -bottom-8 -right-8 w-40 h-40 text-slate-50 opacity-50 pointer-events-none" />
      </div>
    </div>
  );
}
