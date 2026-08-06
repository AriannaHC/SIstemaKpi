import { FileText, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { COLOR_AZUL, COLOR_NARANJA } from "./constants";

export default function KpiCard({ kpi, onLlenar }) {
  const isCompletado = kpi.completado;
  const isVencido = kpi.fecha_fin && new Date() > new Date(kpi.fecha_fin);

  const cardClass = isCompletado
    ? "bg-slate-50 border border-slate-200 opacity-80"
    : isVencido
      ? "bg-red-50 border border-red-200"
      : kpi.es_mi_kpi
        ? "bg-white border-2 border-orange-300 shadow-sm hover:shadow-lg"
        : "bg-white border border-slate-100 hover:shadow-lg";

  const headerClass = isCompletado
    ? "bg-slate-200"
    : isVencido
      ? "bg-red-100"
      : kpi.es_mi_kpi
        ? "bg-linear-to-br from-[#F46F0B]/10 to-[#F46F0B]/5"
        : "bg-linear-to-br from-[#123498]/10 to-[#F46F0B]/10";

  const badgeClass = isCompletado
    ? "text-slate-500 border-slate-300"
    : isVencido
      ? "text-red-600 border-red-300"
      : kpi.es_mi_kpi
        ? "text-[#F46F0B] border-[#F46F0B]"
        : "text-[#123498] border-[#123498]/30";

  const fechaVence = kpi.fecha_fin
    ? `Vence: ${new Date(
        typeof kpi.fecha_fin === "string"
          ? kpi.fecha_fin.replace(" ", "T") + (!kpi.fecha_fin.endsWith("Z") ? "Z" : "")
          : kpi.fecha_fin,
      ).toLocaleString("es-PE", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`
    : "Sin fecha";

  return (
    <div
      className={`rounded-2xl transition-all duration-300 overflow-hidden flex flex-col ${cardClass}`}
    >
      {/* Cabecera */}
      <div className={`relative h-24 p-5 flex items-start justify-between ${headerClass}`}>
        <span
          className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border bg-white flex items-center gap-1.5 ${badgeClass}`}
        >
          {isCompletado ? (
            "Completado"
          ) : isVencido ? (
            "Plazo Expirado"
          ) : kpi.es_mi_kpi ? (
            <>
              <AlertCircle className="w-3 h-3 text-[#F46F0B]" />
              Tu responsabilidad
            </>
          ) : (
            "KPI de equipo"
          )}
        </span>
        <FileText
          className={`w-8 h-8 ${isCompletado ? "text-slate-400" : kpi.es_mi_kpi ? "text-[#F46F0B]/40" : "text-[#123498]/20"}`}
        />
      </div>

      {/* Cuerpo */}
      <div className={`p-5 flex-1 flex flex-col ${isCompletado ? "bg-slate-50" : "bg-white"}`}>
        <h3
          className={`text-base font-black font-heading leading-tight mb-4 flex-1 ${isCompletado ? "text-slate-500" : ""}`}
          style={{ color: isCompletado ? "" : COLOR_AZUL }}
        >
          {kpi.nombre}
        </h3>

        <div className="space-y-3 bg-white/50 rounded-xl p-3 border border-slate-100/50">
          {/* Encargado */}
          <div className="flex items-start gap-2">
            <User
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: isCompletado ? "#94a3b8" : COLOR_AZUL }}
            />
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: isCompletado ? "#94a3b8" : COLOR_AZUL }}
              >
                Encargado
              </p>
              <p className="text-xs text-slate-600 font-medium">
                {kpi.responsable_nombre || "Equipo"}
              </p>
            </div>
          </div>

          {/* Vigencia */}
          <div className="flex items-start gap-2">
            <Clock
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{
                color: isCompletado ? "#94a3b8" : isVencido ? "#ef4444" : COLOR_NARANJA,
              }}
            />
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{
                  color: isCompletado ? "#94a3b8" : isVencido ? "#ef4444" : COLOR_NARANJA,
                }}
              >
                Vigencia
              </p>
              <p className={`text-xs font-bold ${isVencido && !isCompletado ? "text-red-600" : "text-slate-600"}`}>
                {fechaVence}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Botón */}
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
            onClick={() => onLlenar(kpi)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: COLOR_AZUL }}
          >
            📝 Llenar Reporte
          </button>
        )}
      </div>
    </div>
  );
}
