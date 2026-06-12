import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { kpiService } from "../services/kpiService";
import {
  Calendar,
  Clock,
  X,
  CheckCircle2,
  ChevronLeft,
  Folder,
  Activity,
} from "lucide-react";
import Toast from "../components/Toast";

export default function EscogerKPI() {
  // Estados de Áreas (Master)
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // Estados de KPIs (Detail)
  const [selectedArea, setSelectedArea] = useState(null);
  const [kpisData, setKpisData] = useState(null);
  const [loadingKpis, setLoadingKpis] = useState(false);

  // Estados Globales
  const [feedback, setFeedback] = useState(null);

  // Estado para el Modal Lateral (Side Drawer)
  const [modalSide, setModalSide] = useState({ open: false, kpi: null });
  const [formData, setFormData] = useState({ fecha_inicio: "", fecha_fin: "" });

  // ── 1. Cargar Áreas y sus Estadísticas ──
  const cargarAreasConStats = async () => {
    setLoadingAreas(true);
    try {
      const areasList = await kpiService.getAreas();

      const areasConStats = await Promise.all(
        areasList.map(async (area) => {
          try {
            const stats = await kpiService.getKpisSemanales(area.id);
            return {
              ...area,
              total: stats.kpis.length,
              activos: stats.activos_count,
              max: stats.max_activos,
            };
          } catch (error) {
            return { ...area, total: 0, activos: 0, max: 3 };
          }
        }),
      );
      setAreas(areasConStats);
    } catch (err) {
      setFeedback({ tipo: "error", mensaje: "Error al cargar las áreas." });
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    cargarAreasConStats();
  }, []);

  // ── 2. Navegación ──
  const handleAreaSelect = async (area) => {
    setSelectedArea(area);
    setKpisData(null);
    setLoadingKpis(true);
    try {
      const data = await kpiService.getKpisSemanales(area.id);
      setKpisData(data);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar los KPIs del área.",
      });
    } finally {
      setLoadingKpis(false);
    }
  };

  const volverAreas = () => {
    setSelectedArea(null);
    cargarAreasConStats();
  };

  // ── 3. Modal Lateral ──
  const abrirModalProgramacion = (kpi) => {
    if (kpisData.activos_count >= kpisData.max_activos) {
      setFeedback({
        tipo: "error",
        mensaje: `Límite de ${kpisData.max_activos} KPIs alcanzado en esta fecha.`,
      });
      return;
    }
    const now = new Date();
    setFormData({
      fecha_inicio: new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
      fecha_fin: new Date(
        now.getTime() -
          now.getTimezoneOffset() * 60000 +
          7 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .slice(0, 16),
    });
    setModalSide({ open: true, kpi });
  };

  const cerrarModal = () => setModalSide({ open: false, kpi: null });

  const handleProgramar = async (e) => {
    e.preventDefault();
    try {
      await kpiService.programarKpi(modalSide.kpi.id, formData);
      setFeedback({ tipo: "success", mensaje: "KPI Programado exitosamente." });
      cerrarModal();

      const data = await kpiService.getKpisSemanales(selectedArea.id);
      setKpisData(data);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: err?.response?.data?.detail || "Error al programar KPI.",
      });
    }
  };

  const formatFecha = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      {/* Cabecera Global (Igual que Dashboard) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Programación de <span className="text-naranja">KPIs</span>
          </h1>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* VISTA 1: CARDS DE ÁREAS (MASTER)                          */}
      {/* ───────────────────────────────────────────────────────── */}
      {!selectedArea && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-50 bg-white">
            <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-2">
              <Folder className="w-6 h-6 text-naranja" /> Directorio de Áreas
            </h2>
          </div>

          <div className="p-6 md:p-8 bg-slate-50/50 min-h-[400px]">
            {loadingAreas ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-azul border-t-naranja rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => handleAreaSelect(area)}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-48 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-azul/5 flex items-center justify-center text-azul group-hover:bg-azul group-hover:text-white transition-colors">
                        <Folder className="w-7 h-7" />
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center ${
                          area.activos >= area.max
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-naranja"
                        }`}
                      >
                        {area.activos} / {area.max} ACTIVOS
                      </div>
                    </div>

                    <div className="mt-auto relative z-10">
                      <h3 className="text-lg font-black text-azul-profundo line-clamp-1 mb-1">
                        {area.nombre}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold">
                        {area.total} KPIs en total registrados
                      </p>
                    </div>

                    <div className="absolute -bottom-6 -right-6 text-slate-50 opacity-50 group-hover:scale-110 transition-transform">
                      <Folder className="w-32 h-32" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* VISTA 2: LISTA DE KPIS DEL ÁREA (DETAIL)                  */}
      {/* ───────────────────────────────────────────────────────── */}
      {selectedArea && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-right-8 duration-500">
          <div className="p-6 md:p-8 border-b border-slate-50 bg-white relative">
            <button
              onClick={volverAreas}
              className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 text-xs font-black text-gray-400 hover:text-azul transition-colors uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>

            <div className="pr-24">
              <span className="text-[10px] bg-azul/10 text-azul px-3 py-1 rounded-full font-black uppercase tracking-widest mb-3 inline-block">
                Área Seleccionada
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-azul-profundo font-heading">
                {selectedArea.nombre}
              </h2>
            </div>

            {kpisData && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl border w-max ${
                    kpisData.activos_count >= kpisData.max_activos
                      ? "bg-green-50 border-green-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Activity
                    className={`w-5 h-5 ${
                      kpisData.activos_count >= kpisData.max_activos
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Cupo Semanal
                    </p>
                    <p
                      className={`text-lg font-black leading-none ${
                        kpisData.activos_count >= kpisData.max_activos
                          ? "text-green-700"
                          : "text-azul-profundo"
                      }`}
                    >
                      {kpisData.activos_count}{" "}
                      <span className="text-sm text-slate-400 font-bold">
                        / {kpisData.max_activos}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 bg-slate-50/50 min-h-[400px]">
            {loadingKpis ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-4 border-azul border-t-naranja rounded-full animate-spin mx-auto"></div>
              </div>
            ) : kpisData?.kpis?.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {kpisData.kpis.map((kpi) => {
                  const isCompletado = kpi.completado;
                  const isVencido =
                    kpi.fecha_fin && new Date() > new Date(kpi.fecha_fin);

                  return (
                    <div
                      key={kpi.id}
                      className={`p-4 border rounded-xl flex justify-between items-center transition-all duration-300 ${
                        kpi.is_programado
                          ? isCompletado || isVencido
                            ? "border-emerald-300 bg-emerald-50/60 shadow-sm" // Verde oscuro si está completado o vencido
                            : "border-green-200 bg-green-50/60 shadow-sm" // Verde claro si está vivo y activo
                          : "bg-white border-slate-200 hover:shadow-md hover:border-azul/30"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
                        <h4
                          className="font-bold text-azul-profundo text-sm md:text-base truncate"
                          title={kpi.nombre}
                        >
                          {kpi.nombre}
                        </h4>
                        {kpi.is_programado ? (
                          <p
                            className={`text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5 truncate ${isCompletado || isVencido ? "text-emerald-700" : "text-green-700"}`}
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" /> Vence:{" "}
                            {formatFecha(kpi.fecha_fin)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                            ⚪ Esperando programación
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center">
                        {kpi.is_programado ? (
                          isCompletado || isVencido ? (
                            <span className="h-10 px-4 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded-xl uppercase tracking-widest flex items-center justify-center gap-1.5 border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4" /> Finalizado
                            </span>
                          ) : (
                            <span className="h-10 px-4 bg-green-100 text-green-700 font-black text-[10px] rounded-xl uppercase tracking-widest flex items-center justify-center gap-1.5 border border-green-200">
                              <Activity className="w-4 h-4" /> Activo
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => abrirModalProgramacion(kpi)}
                            className="h-10 px-5 bg-slate-100 text-azul font-black text-[10px] rounded-xl hover:bg-azul hover:text-white transition-all shadow-sm uppercase tracking-widest flex items-center justify-center"
                          >
                            Programar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 font-semibold">
                  No hay KPIs registrados para esta área.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* VISTA 3: MODAL LATERAL (PORTAL)                           */}
      {/* ───────────────────────────────────────────────────────── */}
      {typeof window !== "undefined" &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 bg-slate-900/40 z-9990 transition-opacity duration-300 ${
                modalSide.open ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onClick={cerrarModal}
            />

            <div
              className={`fixed top-0 right-0 h-dvh w-full md:w-[450px] bg-white z-9999 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
                modalSide.open ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <p className="text-[10px] font-black text-naranja uppercase tracking-widest">
                    Configurar Tiempos
                  </p>
                  <h3 className="font-black text-azul text-lg font-heading leading-none mt-1">
                    Programar KPI
                  </h3>
                </div>
                <button
                  onClick={cerrarModal}
                  className="p-2 bg-white text-slate-400 hover:text-rojo-persa hover:bg-rojo-persa/10 rounded-full transition-colors border border-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {modalSide.kpi && (
                  <div className="mb-8">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      KPI Seleccionado
                    </label>
                    <div className="bg-azul/5 border border-azul/10 p-4 rounded-2xl">
                      <p className="text-sm font-black text-azul-profundo">
                        {modalSide.kpi.nombre}
                      </p>
                    </div>
                  </div>
                )}

                <form
                  id="programar-form"
                  onSubmit={handleProgramar}
                  className="space-y-6"
                >
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                      <Calendar className="w-4 h-4 text-azul" /> Fecha y Hora de
                      Inicio
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.fecha_inicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_inicio: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm outline-none focus:border-azul focus:ring-4 focus:ring-azul/10 transition-all font-medium text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                      <Clock className="w-4 h-4 text-naranja" /> Fecha y Hora
                      Límite
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.fecha_fin}
                      onChange={(e) =>
                        setFormData({ ...formData, fecha_fin: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm outline-none focus:border-naranja focus:ring-4 focus:ring-naranja/10 transition-all font-medium text-slate-700"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <button
                  form="programar-form"
                  type="submit"
                  className="w-full bg-naranja hover:bg-orange-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-naranja/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Guardar y Activar
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="w-full mt-3 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
