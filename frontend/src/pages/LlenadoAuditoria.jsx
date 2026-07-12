import React, { useState, useEffect } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import LlenadoOperaciones from "../components/LlenadoOperaciones";
import LlenadoCalidad from "../components/LlenadoCalidad";
import { useAuth } from "../context/AuthContext";
import { registroDiarioService } from "../services/registroDiarioService";

const AREA_CALIDAD_ID = 25;
const AREA_OPERACIONES_ID = 26;

/** Formatea un string ISO datetime a "dd/mm/aaaa hh:mm AM/PM" */
const formatFechaHora = (isoStr) => {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function LlenadoAuditoria({
  registroId,
  setActivePage,
  setAuditoriaFeedback,
}) {
  const COLOR_AZUL = "#123498";
  const { user } = useAuth();

  const [detalle, setDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (registroId) {
      setIsLoading(true);
      registroDiarioService
        .getRegistroDetalle(registroId)
        .then((data) => setDetalle(data))
        .catch((err) =>
          console.error("Error al cargar detalle del registro", err),
        )
        .finally(() => setIsLoading(false));
    }
  }, [registroId]);

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col px-3 py-4 lg:px-0 animate-in slide-in-from-right-8 duration-500 relative">
        {/* Cabecera (Patrón Z: Titulo a la izq, Botón a la der) */}
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-2xl font-extrabold tracking-tight font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Evaluación de Registro #{registroId || "104"}
          </h2>
          <button
            onClick={() =>
              setActivePage(
                user?.kpi_area_id === AREA_CALIDAD_ID
                  ? "panel-calidad"
                  : "panel-operaciones",
              )
            }
            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-[#123498] bg-white border border-slate-200 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow"
          >
            <ChevronLeft className="w-4 h-4" /> Volver al Panel
          </button>
        </div>

        {/* Renderizado condicional: Loading o Tarjeta de Resumen Base */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-[#123498] mb-4" />
            <p className="text-sm font-semibold">
              Cargando información del registro...
            </p>
          </div>
        ) : (
          <>
            {/* Contexto del Registro (Barra Horizontal Ultra Compacta) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-col gap-3">
              <div
                className={`grid grid-cols-2 gap-4 divide-x divide-slate-100 ${user?.kpi_area_id === AREA_OPERACIONES_ID ? "md:grid-cols-6" : "md:grid-cols-5"}`}
              >
                <div className="px-2">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">
                    Colaborador
                  </p>
                  <p
                    className="text-sm font-bold text-slate-800 truncate"
                    title={detalle?.trabajador_nombre}
                  >
                    {detalle?.trabajador_nombre || "Cargando..."}
                  </p>
                </div>
                <div className="px-2 md:px-4">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">
                    Área
                  </p>
                  <p
                    className="text-sm font-bold text-slate-800 truncate"
                    title={detalle?.area_nombre}
                  >
                    {detalle?.area_nombre || "Cargando..."}
                  </p>
                </div>

                {/* AQUI ESTÁ EL CAMBIO: Tarea vs Actividad según el rol */}
                <div className="px-2 md:px-4">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">
                    {user?.kpi_area_id === AREA_OPERACIONES_ID
                      ? "Tipo de Tarea"
                      : "Tipo de Actividad"}
                  </p>
                  <p
                    className="text-sm font-bold text-slate-800 truncate"
                    title={
                      user?.kpi_area_id === AREA_OPERACIONES_ID
                        ? detalle?.tipo_tarea
                        : detalle?.tipo_actividad
                    }
                  >
                    {user?.kpi_area_id === AREA_OPERACIONES_ID
                      ? detalle?.tipo_tarea
                      : detalle?.tipo_actividad}
                  </p>
                </div>

                <div className="px-2 md:px-4">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">
                    Fecha Inicio
                  </p>
                  <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
                    {formatFechaHora(detalle?.fecha_inicio)}
                  </p>
                </div>
                <div className="px-2 md:px-4">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">
                    Fecha Límite
                  </p>
                  <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
                    {formatFechaHora(detalle?.fecha_entrega)}
                  </p>
                </div>
                {user?.kpi_area_id === AREA_OPERACIONES_ID && (
                  <div className="px-2 md:px-4">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">
                      Responsable
                    </p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {detalle?.responsable_asigna}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">
                  Entregable Específico
                </p>
                <p className="text-sm text-slate-700 leading-snug">
                  {detalle?.entregable}
                </p>
              </div>
            </div>

            {/* INYECCIÓN DEL COMPONENTE DE FORMULARIO */}
            {user?.kpi_area_id === AREA_OPERACIONES_ID ? (
              <LlenadoOperaciones
                registroId={registroId}
                detalle={detalle}
                onAuditoriaGuardada={(mensaje) => {
                  setAuditoriaFeedback({ tipo: "ok", mensaje });
                  setActivePage("panel-operaciones");
                }}
              />
            ) : user?.kpi_area_id === AREA_CALIDAD_ID ? (
              <LlenadoCalidad
                registroId={registroId}
                detalle={detalle}
                onAuditoriaGuardada={(mensaje) => {
                  setAuditoriaFeedback({ tipo: "ok", mensaje });
                  setActivePage("panel-calidad");
                }}
              />
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-sm font-bold text-red-600">
                  No tienes permisos para realizar auditorías en esta área.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
