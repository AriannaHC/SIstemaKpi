// src/pages/MiEquipo.jsx
// Vista exclusiva del Jefe de Área (rol 2):
// - Lista los trabajadores de su área
// - Muestra SOLO los KPIs activos de la semana (activo_semanal = true)
// - Permite asignar hasta 3 KPIs por persona (útil para áreas unipersonales)

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { kpiService } from "../services/kpiService";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

export default function MiEquipo() {
  const { user } = useAuth();

  const [equipo, setEquipo] = useState([]);
  const [kpisActivos, setKpisActivos] = useState([]); // solo activo_semanal=true
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState(null);

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
      setEquipo(miEquipoRes.data);
      // Solo los KPIs marcados como activos esta semana
      setKpisActivos((kpisRes.kpis || []).filter((k) => k.activo_semanal));
    } catch (err) {
      console.error(err);
      mostrarToast("err", "Error al cargar datos del equipo.");
    } finally {
      setLoading(false);
    }
  };

  // Devuelve los KPIs asignados a un trabajador específico
  const kpisDePersona = (trabajadorId) =>
    kpisActivos.filter((k) => k.responsable_id === trabajadorId);

  // KPIs que aún no tienen responsable asignado O que están asignados a esta persona
  // (para mostrar solo opciones disponibles en el selector)
  const kpisDisponiblesParaPersona = (trabajadorId) =>
    kpisActivos.filter(
      (k) => !k.responsable_id || k.responsable_id === trabajadorId,
    );

  const asignarKpi = async (trabajadorId, kpiId) => {
    if (!kpiId) return;
    const yaAsignados = kpisDePersona(trabajadorId);
    if (yaAsignados.length >= 3) {
      mostrarToast(
        "err",
        "Una persona no puede tener más de 3 KPIs asignados.",
      );
      return;
    }
    setSaving(trabajadorId);
    try {
      await apiClient.patch(`/kpis/${kpiId}/responsable`, {
        responsable_id: trabajadorId,
      });
      mostrarToast("ok", "KPI asignado correctamente.");
      await cargarDatos();
    } catch (err) {
      mostrarToast(
        "err",
        err?.response?.data?.detail || "Error al asignar KPI.",
      );
    } finally {
      setSaving(null);
    }
  };

  // Quitar responsable de un KPI (lo deja libre)
  const quitarKpi = async (kpiId) => {
    setSaving(kpiId);
    try {
      await apiClient.patch(`/kpis/${kpiId}/responsable`, {
        responsable_id: null,
      });
      mostrarToast("ok", "KPI desasignado.");
      await cargarDatos();
    } catch (err) {
      mostrarToast(
        "err",
        err?.response?.data?.detail || "Error al desasignar.",
      );
    } finally {
      setSaving(null);
    }
  };

  const mostrarToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-sm font-semibold">Cargando equipo…</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
          ${
            toast.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-azul/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-azul" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Mi Equipo</h1>
          <p className="text-xs text-gray-400 font-semibold">
            {user?.area_nombre || "Tu área"} · {equipo.length} colaborador
            {equipo.length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      {/* Banner KPIs de la semana */}
      {kpisActivos.length === 0 ? (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            No hay KPIs activos esta semana. El administrador debe activarlos
            desde Selección Semanal.
          </span>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <UserCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            <strong>{kpisActivos.length}</strong> KPI
            {kpisActivos.length !== 1 ? "s" : ""} activo
            {kpisActivos.length !== 1 ? "s" : ""} esta semana. Asigna
            responsables — una persona puede recibir hasta{" "}
            <strong>3 KPIs</strong>.
          </span>
        </div>
      )}

      {/* Lista colaboradores */}
      {equipo.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No hay colaboradores en tu área aún.</p>
          <p className="text-xs mt-1">
            El administrador debe asignarlos desde Gestión de Usuarios.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-azul/10 text-azul flex items-center justify-center font-bold text-base border-2 border-azul/10 shrink-0">
                    {trabajador.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {trabajador.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {trabajador.email}
                    </p>
                  </div>

                  {/* Badge conteo */}
                  <span
                    className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tight
                    ${
                      asignados.length > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {asignados.length}/3 KPIs
                  </span>
                </div>

                {/* KPIs ya asignados */}
                {asignados.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 pl-[60px]">
                    {asignados.map((k) => (
                      <span
                        key={k.id}
                        className="flex items-center gap-1.5 bg-azul/10 text-azul text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {k.nombre}
                        <button
                          onClick={() => quitarKpi(k.id)}
                          disabled={saving === k.id}
                          className="ml-1 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Quitar asignación"
                        >
                          {saving === k.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Selector para agregar KPI */}
                {kpisActivos.length > 0 && puedeAsignarMas && (
                  <div className="mt-3 pl-[60px]">
                    <select
                      value=""
                      onChange={(e) =>
                        asignarKpi(trabajador.id, e.target.value)
                      }
                      disabled={saving === trabajador.id}
                      className="appearance-none px-3 py-2 text-xs font-semibold border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-azul/30 focus:border-azul cursor-pointer disabled:opacity-50 w-full max-w-xs"
                    >
                      <option value="">+ Agregar KPI…</option>
                      {disponibles
                        .filter((k) => k.responsable_id !== trabajador.id)
                        .map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Si ya tiene 3 KPIs */}
                {asignados.length >= 3 && (
                  <p className="mt-2 pl-[60px] text-[10px] text-gray-400 font-semibold">
                    Máximo alcanzado — quita uno para reasignar.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
