// src/pages/MiEquipo.jsx
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  RefreshCw,
  X,
  Target,
  User,
  Activity,
} from "lucide-react";
import { kpiService } from "../services/kpiService";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function MiEquipo() {
  const { user } = useAuth();

  const [equipo, setEquipo] = useState([]);
  const [kpisActivos, setKpisActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [miEquipoRes, kpisRes] = await Promise.all([
        apiClient.get("/users/mi-equipo"),
        kpiService.getKpisSemanales(user.kpi_area_id),
      ]);
      let equipoData = miEquipoRes.data || [];
      const jefeIncluido = equipoData.some((t) => t.id === user.id);

      if (!jefeIncluido) {
        equipoData = [
          {
            id: user.id,
            name: `${user.name} (Tú - Jefe de Área)`, // Distintivo visual
            email: user.email,
            kpi_rol_id: user.kpi_rol_id,
            kpi_area_id: user.kpi_area_id,
          },
          ...equipoData,
        ];
      }

      setEquipo(equipoData);

      setKpisActivos((kpisRes.kpis || []).filter((k) => k.is_programado));
    } catch (err) {
      console.error(err);
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar datos del equipo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const kpisDePersona = (trabajadorId) =>
    kpisActivos.filter((k) => k.responsable_id === trabajadorId);

  const kpisDisponiblesParaPersona = (trabajadorId) =>
    kpisActivos.filter(
      (k) => !k.responsable_id || k.responsable_id === trabajadorId,
    );

  // OPTIMIZADO: Actualiza el estado local en vez de hacer refetch
  const asignarKpi = async (trabajadorId, kpiId) => {
    if (!kpiId) return;
    const kpiIdNumber = parseInt(kpiId, 10);
    const yaAsignados = kpisDePersona(trabajadorId);

    if (yaAsignados.length >= 3) {
      setFeedback({
        tipo: "error",
        mensaje: "Una persona no puede tener más de 3 KPIs asignados.",
      });
      return;
    }

    setSaving(trabajadorId);
    try {
      await apiClient.patch(`/kpis/${kpiIdNumber}/responsable`, {
        responsable_id: trabajadorId,
      });

      // Actualizamos la memoria de React directamente
      setKpisActivos((prev) =>
        prev.map((kpi) =>
          kpi.id === kpiIdNumber
            ? { ...kpi, responsable_id: trabajadorId }
            : kpi,
        ),
      );

      setFeedback({
        tipo: "success",
        mensaje: "✅ KPI asignado correctamente al trabajador.",
      });
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: err?.response?.data?.detail || "Error al asignar KPI.",
      });
    } finally {
      setSaving(null);
    }
  };

  // OPTIMIZADO: Actualiza el estado local en vez de hacer refetch
  const quitarKpi = async (kpiId) => {
    setSaving(kpiId);
    try {
      await apiClient.patch(`/kpis/${kpiId}/responsable`, {
        responsable_id: null,
      });

      // Actualizamos la memoria de React directamente
      setKpisActivos((prev) =>
        prev.map((kpi) =>
          kpi.id === kpiId ? { ...kpi, responsable_id: null } : kpi,
        ),
      );

      setFeedback({
        tipo: "success",
        mensaje: "✅ KPI liberado exitosamente.",
      });
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: err?.response?.data?.detail || "Error al liberar KPI.",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#123498] font-heading">
            Mi <span className="text-[#F46F0B]">Equipo</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {user?.area_nombre || "Tu área"} · {equipo.length} colaborador
            {equipo.length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      {/* Banner de KPIs de la semana */}
      {kpisActivos.length === 0 ? (
        <div className="flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
            <Activity className="w-6 h-6 text-[#F46F0B]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest mb-0.5">
              Sin KPIs Programados
            </h3>
            <p className="text-sm text-orange-700 font-medium">
              El administrador debe programar los KPIs en "Selección Semanal"
              antes de poder asignarlos.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
            <UserCheck className="w-6 h-6 text-[#123498]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-0.5">
              Asignación Semanal
            </h3>
            <p className="text-sm text-blue-700 font-medium">
              Hay <strong>{kpisActivos.length}</strong> KPIs activos esta
              semana. Distribúyelos en tu equipo (Máximo 3 por persona).
            </p>
          </div>
        </div>
      )}

      {/* Área Principal */}
      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#123498] border-t-[#F46F0B] rounded-full animate-spin"></div>
        </div>
      ) : equipo.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Users className="w-14 h-14 text-slate-200 mb-4" />
          <p className="text-[#123498] font-black text-lg uppercase tracking-widest font-heading">
            Sin Colaboradores
          </p>
          <p className="text-gray-500 text-sm mt-1">
            El administrador aún no ha asignado personal a esta área.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {equipo.map((trabajador) => {
            const asignados = kpisDePersona(trabajador.id);
            const disponibles = kpisDisponiblesParaPersona(trabajador.id);
            const puedeAsignarMas =
              asignados.length < 3 &&
              disponibles.filter((k) => k.responsable_id !== trabajador.id)
                .length > 0;

            return (
              <div
                key={trabajador.id}
                className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full relative overflow-hidden group"
              >
                {/* Info Personal */}
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#123498]/10 to-[#F46F0B]/10 flex items-center justify-center text-[#123498] text-xl font-bold shrink-0 border border-white shadow-sm">
                    {trabajador.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-black text-[#123498] leading-tight truncate mb-1"
                      title={trabajador.name}
                    >
                      {trabajador.name}
                    </h3>
                    <p
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate"
                      title={trabajador.email}
                    >
                      {trabajador.email.split("@")[0]}
                    </p>
                  </div>
                </div>

                {/* Zona de KPIs Asignados */}
                <div className="flex-1 relative z-10 bg-slate-50/50 rounded-2xl p-4 border border-slate-100/80">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Carga de Trabajo
                    </h4>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${asignados.length > 0 ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}
                    >
                      {asignados.length}/3 KPIs
                    </span>
                  </div>

                  {asignados.length > 0 ? (
                    <div className="space-y-2">
                      {asignados.map((k) => (
                        <div
                          key={k.id}
                          className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-xl hover:border-emerald-300 transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-2 overflow-hidden pr-2">
                            <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span
                              className="text-xs font-bold text-slate-700 truncate"
                              title={k.nombre}
                            >
                              {k.nombre}
                            </span>
                          </div>
                          <button
                            onClick={() => quitarKpi(k.id)}
                            disabled={saving === k.id}
                            className="text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                            title="Desasignar KPI"
                          >
                            {saving === k.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center text-center bg-white/50">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        Sin Tareas
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón Selector Agregar */}
                <div className="mt-5 relative z-10">
                  {kpisActivos.length > 0 && puedeAsignarMas ? (
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) =>
                          asignarKpi(trabajador.id, e.target.value)
                        }
                        disabled={saving === trabajador.id}
                        className="w-full appearance-none px-4 py-3 text-xs font-black uppercase tracking-widest border border-slate-200 rounded-xl bg-white text-[#123498] hover:bg-[#123498]/5 focus:outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/20 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                      >
                        <option value="" disabled>
                          + Asignar Tarea
                        </option>
                        {disponibles
                          .filter((k) => k.responsable_id !== trabajador.id)
                          .map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : asignados.length >= 3 ? (
                    <div className="bg-orange-50 border border-orange-100 text-[#F46F0B] px-4 py-3 rounded-xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Carga Máxima (3/3)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 text-slate-400 px-4 py-3 rounded-xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Sin tareas libres
                      </p>
                    </div>
                  )}
                </div>

                {/* Decoración de fondo */}
                <User className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-50 opacity-50 group-hover:scale-110 transition-transform z-0 pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
