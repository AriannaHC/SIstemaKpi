import { ChevronDown } from "lucide-react";
import { COLOR_AZUL, RESUMEN_LABELS } from "./constants";
import SemaforoDisplay from "./SemaforoDisplay";

export default function KpiResultsPanel({
  camposResultado,
  verResultados,
  onToggleResultados,
  cumplimientoValue,
  buscarValorDisplay,
}) {
  if (camposResultado.length === 0) return null;

  return (
    <>
      {/* Botón toggle para mobile */}
      <button
        type="button"
        onClick={onToggleResultados}
        className="lg:hidden w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-white transition-all"
      >
        <span>Ver resultados en vivo</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
            verResultados ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Panel de resultados */}
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
            {/* Semáforo */}
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
                    {cumplimientoValue !== null && cumplimientoValue !== undefined
                      ? `${(cumplimientoValue * 100).toFixed(0)}%`
                      : "--"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Evaluación actual</p>
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

            {/* Tabla de métricas */}
            <div className="rounded-3xl bg-white border border-slate-200 p-3 md:p-5 space-y-2 md:space-y-4">
              <div className="grid grid-cols-1 gap-2 md:gap-4">
                {RESUMEN_LABELS.map((label) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500 font-medium">{label}</span>
                    <span className="text-sm font-bold" style={{ color: COLOR_AZUL }}>
                      {buscarValorDisplay(label)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
