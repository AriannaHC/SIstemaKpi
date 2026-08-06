export default function SemaforoDisplay({ cumplimiento }) {
  if (
    cumplimiento === null ||
    cumplimiento === undefined ||
    isNaN(cumplimiento)
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
        Sin calcular
      </span>
    );
  }
  if (cumplimiento >= 0.8)
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
        Verde (Óptimo)
      </span>
    );
  if (cumplimiento >= 0.6)
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-700" />
        Amarillo (Problemas)
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-700" />
      Rojo (Peligro)
    </span>
  );
}
