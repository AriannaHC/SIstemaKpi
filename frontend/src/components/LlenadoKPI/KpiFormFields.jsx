import { ChevronDown } from "lucide-react";
import { COLOR_AZUL } from "./constants";

export default function KpiFormFields({
  camposUsuario,
  valores,
  onChange,
  textoExpandido,
  onToggleTexto,
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-slate-50 p-4 md:p-6 shadow-sm">
      <div className="mb-3 md:mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base md:text-lg font-bold" style={{ color: COLOR_AZUL }}>
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
            <div key={c.id} className={esTextoLargo ? "md:col-span-2" : ""}>
              {esTextoLargo ? (
                <>
                  {/* Mobile: accordion */}
                  <button
                    type="button"
                    onClick={() => onToggleTexto(c.campo_key)}
                    className="lg:hidden w-full flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <span>{c.campo_label}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                        textoExpandido[c.campo_key] ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {textoExpandido[c.campo_key] && (
                    <div className="lg:hidden mt-2">
                      <textarea
                        name={c.campo_key}
                        value={valores[c.campo_key] || ""}
                        onChange={onChange}
                        rows={4}
                        className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 md:py-3 text-sm text-slate-700 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all resize-none"
                      />
                    </div>
                  )}
                  {/* Desktop: always visible */}
                  <div className="hidden lg:block">
                    <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                      {c.campo_label} <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      name={c.campo_key}
                      value={valores[c.campo_key] || ""}
                      onChange={onChange}
                      rows={4}
                      className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 md:py-3 text-sm text-slate-700 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/10 transition-all resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-[0.18em]">
                    {c.campo_label} <span className="text-red-600">*</span>
                  </label>
                  <input
                    type={
                      c.campo_label.toLowerCase().trim().startsWith("fecha")
                        ? "date"
                        : c.tipo === "numero"
                          ? "number"
                          : "text"
                    }
                    step="any"
                    name={c.campo_key}
                    value={valores[c.campo_key] || ""}
                    onChange={onChange}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-[#123498]/20 bg-white border-slate-200 focus:border-[#123498]"
                    placeholder={`Ingresa ${c.campo_label}...`}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
