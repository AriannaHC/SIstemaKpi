import { Target } from "lucide-react";
import { COLOR_AZUL } from "./constants";
import KpiCard from "./KpiCard";

export default function KpiList({ kpisActivos, loadingList, onLlenar }) {
  if (loadingList) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: COLOR_AZUL, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (kpisActivos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Target className="w-14 h-14 text-slate-200 mb-4" />
        <p
          className="font-black text-lg uppercase tracking-widest font-heading"
          style={{ color: COLOR_AZUL }}
        >
          Todo al día
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpisActivos.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} onLlenar={onLlenar} />
      ))}
    </div>
  );
}
