import React, { useEffect, useState } from "react";
import {
  X,
  ClipboardCheck,
  User,
  Calendar,
  Loader2,
  Layers,
  Tag,
} from "lucide-react";
import { registroDiarioService } from "../services/registroDiarioService";

/** Formatea un string ISO datetime a "dd/mm/aaaa hh:mm AM/PM" */
const formatFechaHora = (isoStr) => {
  if (!isoStr) return "—";
  
  let cleanIso = isoStr;
  if (typeof cleanIso === "string") {
    cleanIso = cleanIso.replace(" ", "T");
    if (!cleanIso.endsWith("Z")) {
      cleanIso += "Z";
    }
  }

  const d = new Date(cleanIso);
  if (isNaN(d.getTime())) return isoStr;
  
  return d.toLocaleString("es-PE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function RegistroDiarioDetalleModal({
  isOpen,
  onClose,
  registroId,
  onAuditar,
  area,
}) {
  const [detalle, setDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const COLOR_AZUL = "#123498";

  useEffect(() => {
    if (isOpen && registroId) {
      setIsLoading(true);
      registroDiarioService
        .getRegistroDetalle(registroId)
        .then((data) => setDetalle(data))
        .catch((err) => console.error("Error al cargar detalle", err))
        .finally(() => setIsLoading(false));
    } else {
      setDetalle(null);
    }
  }, [isOpen, registroId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-black" style={{ color: COLOR_AZUL }}>
              Detalles del Registro
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Revisión previa a la auditoría
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2
                className="w-8 h-8 animate-spin mb-4"
                style={{ color: COLOR_AZUL }}
              />
              <p className="text-sm font-semibold">
                Cargando información completa...
              </p>
            </div>
          ) : detalle ? (
            <div className="space-y-6">
              {/* FILA 1: FECHAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3" /> Fecha y Hora de Inicio
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatFechaHora(detalle.fecha_inicio)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3" /> Fecha y Hora Límite
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatFechaHora(detalle.fecha_entrega)}
                  </p>
                </div>
              </div>

              {/* FILA 2: RESPONSABLE Y PROCESO */}
              <div className="grid grid-cols-1 gap-4">
                {area === "operaciones" && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                      <User className="w-3 h-3" /> Responsable Asignador
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {detalle.responsable_asigna}
                    </p>
                  </div>
                )}
                {area === "calidad" && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                      <Layers className="w-3 h-3" /> Proceso
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {detalle.proceso}
                    </p>
                  </div>
                )}
              </div>

              {/* FILA 3: TIPO Y ENTREGABLE */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5 mb-1">
                    <Tag className="w-3 h-3" />{" "}
                    {area === "operaciones"
                      ? "Tipo de Tarea"
                      : "Tipo de Actividad"}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {area === "operaciones"
                      ? detalle.tipo_tarea
                      : detalle.tipo_actividad}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                    Entregable Específico
                  </p>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed">
                    {detalle.entregable}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-red-500 py-10">
              No se encontraron datos.
            </p>
          )}
        </div>

        {/* Footer (Botones) */}
        <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => {
              onClose();
              onAuditar(registroId);
            }}
            disabled={isLoading || !detalle}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: COLOR_AZUL }}
          >
            <ClipboardCheck className="w-4 h-4" />
            Realizar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
}
