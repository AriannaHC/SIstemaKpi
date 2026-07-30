import React, { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";
import { useAuth } from "../context/AuthContext";
import { Activity, Clock, Folder, ShieldAlert } from "lucide-react";

export default function KpisArea() {
  const { user } = useAuth();
  const [data, setData] = useState({
    kpis: [],
    area_nombre: "",
    activos_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAreaKpis = async () => {
      setLoading(true);
      try {
        if (!user?.kpi_area_id) {
          throw new Error("No tienes un área asignada.");
        }
        const response = await kpiService.getKpisSemanales(user.kpi_area_id);
        setData(response);
      } catch (err) {
        console.error("Error al cargar KPIs del área:", err);
        setError(
          err?.response?.data?.detail ||
            "Error al cargar la información del área.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAreaKpis();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#123498] border-t-[#F46F0B] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-red-100 shadow-sm max-w-7xl mx-auto">
        <ShieldAlert className="w-14 h-14 text-red-200 mb-4" />
        <p className="text-red-500 font-black text-lg uppercase tracking-widest font-heading">
          Acceso Denegado
        </p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#123498] font-heading">
            Catálogo de <span className="text-[#F46F0B]">KPIs</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
            <Folder className="w-4 h-4" /> {data.area_nombre || "Tu Área"}
          </p>
        </div>

        {/* Resumen del Área */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="text-center px-4 border-r border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              Total KPIs
            </p>
            <p className="text-xl font-black text-[#123498]">
              {data.kpis.length}
            </p>
          </div>
          <div className="text-center px-4">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              Activos Hoy
            </p>
            <p className="text-xl font-black text-[#F46F0B]">
              {data.activos_count} / 3
            </p>
          </div>
        </div>
      </div>

      {/* Grid de KPIs (Solo Lectura) */}
      {data.kpis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Activity className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-[#123498] font-black text-lg uppercase tracking-widest font-heading">
            Catálogo Vacío
          </p>
          <p className="text-gray-500 text-sm mt-1">
            El administrador aún no ha importado los KPIs para tu área.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.kpis.map((kpi) => (
            <div
              key={kpi.id}
              className={`bg-white border rounded-[2.5rem] p-6 shadow-sm flex flex-col h-full overflow-hidden ${
                kpi.is_programado ? "border-blue-200" : "border-slate-200"
              }`}
            >
              {/* Título y Píldora en la misma línea */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3
                  className="text-base font-bold text-slate-800 leading-snug line-clamp-2 flex-1"
                  title={kpi.nombre}
                >
                  {kpi.nombre}
                </h3>
                {kpi.is_programado && (
                  <div className="bg-[#123498]/10 text-[#123498] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> Seleccionada esta semana
                  </div>
                )}
              </div>

              {/* Caja de Fórmula (ocupa el resto del espacio) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Fórmula de Cálculo
                </p>
                <p className="text-[11px] font-mono text-slate-600 line-clamp-3">
                  {kpi.formula_texto || "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
