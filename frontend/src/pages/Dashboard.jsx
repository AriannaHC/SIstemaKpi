import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { kpiService } from "../services/kpiService";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trash2,
  FileSpreadsheet,
  Settings,
  AlertTriangle,
  Folder,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LIMIT = 12;

export default function Dashboard() {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Filtros y Paginación
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para el Drill-down
  const [selectedArea, setSelectedArea] = useState(null);

  const [deleteModal, setDeleteModal] = useState({ open: false, area: null });
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getDashboardData();
      setAreas(data);
      // Actualizar el área seleccionada si existe para refrescar sus KPIs
      if (selectedArea) {
        const updated = data.find((a) => a.id === selectedArea.id);
        if (updated) setSelectedArea(updated);
        else setSelectedArea(null);
      }
    } catch (e) {
      console.error("Error cargando dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploadArea = async (e) => {
    e.preventDefault();
    if (!e.target[0].files[0]) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", e.target[0].files[0]);
    try {
      await kpiService.uploadExcel(formData);
      alert("Área importada con éxito");
      loadData();
    } catch (error) {
      alert(error?.response?.data?.detail || "Error al importar área");
    } finally {
      setIsUploading(false);
      e.target.reset();
    }
  };

  const handleUploadSmart = async (e) => {
    e.preventDefault();
    if (!e.target[0].files[0]) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", e.target[0].files[0]);
    try {
      const res = await kpiService.uploadSmart(formData);
      alert(res.message || "Diccionario SMART procesado con éxito");
      loadData();
    } catch (error) {
      alert(error?.response?.data?.detail || "Error al procesar diccionario");
    } finally {
      setIsUploading(false);
      e.target.reset();
    }
  };

  const handleDeleteKpi = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar el KPI "${nombre}"?`)) {
      try {
        await kpiService.deleteKpi(id);
        loadData();
      } catch (e) {
        alert("Error al eliminar KPI");
      }
    }
  };

  const handleDeleteAreaClick = (area) => {
    setDeleteModal({ open: true, area });
  };

  const confirmDeleteArea = async () => {
    if (!deleteModal.area) return;
    setDeleting(true);
    try {
      await kpiService.deleteArea(deleteModal.area.id);
      setDeleteModal({ open: false, area: null });
      if (selectedArea && selectedArea.id === deleteModal.area.id) {
        setSelectedArea(null);
      }
      loadData();
    } catch (e) {
      alert("Error al eliminar el Área");
    } finally {
      setDeleting(false);
    }
  };

  // LÓGICA DE BÚSQUEDA Y DRILL-DOWN EN VIVO
  const globalMatchingKpis = searchTerm
    ? areas.flatMap((a) =>
        a.kpis
          .filter((k) =>
            k.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .map((k) => ({ ...k, area_nombre: a.nombre, area_id: a.id })),
      )
    : [];

  const selectedAreaKpis = selectedArea
    ? selectedArea.kpis.filter((k) =>
        k.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const itemsToPaginate = selectedArea
    ? selectedAreaKpis
    : searchTerm
      ? globalMatchingKpis
      : areas;

  const totalPages = Math.ceil(itemsToPaginate.length / LIMIT) || 1;
  const currentItems = itemsToPaginate.slice((page - 1) * LIMIT, page * LIMIT);

  const getTipoColor = (tipo) => {
    if (tipo === "Positivo") {
      return "bg-turquesa/10 text-turquesa border-turquesa/20";
    }
    return "bg-rojo-persa/10 text-rojo-persa border-rojo-persa/20";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Panel de Control <span className="text-naranja">Maestro</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Gestión centralizada de áreas, carga de estructuras y catálogo de
            KPIs.
          </p>
        </div>
      </div>

      {/* Centro de Importación */}
      <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30">
          <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-2 mb-6">
            <FileSpreadsheet className="w-6 h-6 text-naranja" /> Centro de
            Importación
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subida 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-azul mb-1">
                1. Subir Excel de Área
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                Crea las estructuras, cálculos automáticos y campos base.
              </p>
              <form
                onSubmit={handleUploadArea}
                className="flex flex-col sm:flex-row gap-3 items-center"
              >
                <input
                  type="file"
                  accept=".xlsx"
                  required
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-azul/10 file:text-azul hover:file:bg-azul/20 file:cursor-pointer file:uppercase file:tracking-wider file:transition-colors"
                />
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full sm:w-auto shrink-0 bg-azul text-white font-black py-2.5 px-6 rounded-xl hover:bg-azul-profundo transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Interpretar Área
                </button>
              </form>
            </div>

            {/* Subida 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-azul mb-1">
                2. Subir Diccionario SMART
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                Autoconfigura KPIs Positivos/Negativos matemáticamente.
              </p>
              <form
                onSubmit={handleUploadSmart}
                className="flex flex-col sm:flex-row gap-3 items-center"
              >
                <input
                  type="file"
                  accept=".xlsx"
                  required
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-naranja/10 file:text-naranja hover:file:bg-naranja/20 file:cursor-pointer file:uppercase file:tracking-wider file:transition-colors"
                />
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full sm:w-auto shrink-0 bg-naranja text-white font-black py-2.5 px-6 rounded-xl hover:bg-orange-600 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Vincular SMART
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Principal de Áreas / KPIs */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Filtros y Breadcrumbs */}
        <div className="p-6 md:p-8 border-b border-slate-50 bg-white">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-center justify-between">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-bold text-azul-profundo shrink-0 self-start md:self-center">
              <button
                onClick={() => {
                  setSelectedArea(null);
                  setSearchTerm("");
                  setPage(1);
                }}
                className={`hover:text-azul transition-colors flex items-center gap-2 ${
                  !selectedArea ? "text-azul" : "text-slate-400"
                }`}
              >
                <Folder className="w-5 h-5" /> Todas las Áreas
              </button>
              {selectedArea && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                  <span className="text-azul">{selectedArea.nombre}</span>
                </>
              )}
            </div>

            {/* Búsqueda en vivo */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    selectedArea
                      ? "Buscar KPI en esta área..."
                      : "Buscar en todas las áreas..."
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:outline-none focus:border-azul focus:bg-white transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal: Grid de Cards */}
        <div className="bg-slate-50/50 min-h-[300px]">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-azul border-t-naranja rounded-full animate-spin mx-auto" />
            </div>
          ) : itemsToPaginate.length === 0 ? (
            <div className="py-32 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100 shadow-sm">
                <Activity className="w-8 h-8" />
              </div>
              <p className="text-azul font-black uppercase tracking-widest text-sm">
                No se encontraron resultados
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 md:p-8">
              {selectedArea === null && searchTerm === ""
                ? currentItems.map((area) => (
                    <div
                      key={area.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-48"
                      onClick={() => {
                        setSelectedArea(area);
                        setSearchTerm("");
                        setPage(1);
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-azul/5 flex items-center justify-center text-azul group-hover:bg-azul group-hover:text-white transition-colors">
                          <Folder className="w-7 h-7" />
                        </div>
                        {user?.kpi_rol_id === 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAreaClick(area);
                            }}
                            className="p-2.5 text-rojo-persa bg-rojo-persa/5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rojo-persa hover:text-white transition-all border border-rojo-persa/10"
                            title="Eliminar Área"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-azul-profundo mb-2 line-clamp-1">
                          {area.nombre}
                        </h3>
                        <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                          {area.kpis.length} KPI
                          {area.kpis.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))
                : currentItems.map((kpi) => (
                    <div
                      key={kpi.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col h-56"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              kpi.tipo_kpi === "Positivo"
                                ? "bg-turquesa/10 text-turquesa"
                                : "bg-rojo-persa/10 text-rojo-persa"
                            }`}
                          >
                            <Activity className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span
                              className={`self-start px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getTipoColor(
                                kpi.tipo_kpi,
                              )}`}
                            >
                              {kpi.tipo_kpi}
                            </span>
                            {!selectedArea && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                                {kpi.area_nombre}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            className="p-2 text-azul bg-azul/5 rounded-lg hover:bg-azul hover:text-white transition-colors border border-azul/10"
                            title="Configuración"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteKpi(kpi.id, kpi.nombre)}
                            className="p-2 text-rojo-persa bg-rojo-persa/5 rounded-lg hover:bg-rojo-persa hover:text-white transition-colors border border-rojo-persa/10"
                            title="Eliminar KPI"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 justify-end">
                        <h3
                          className="text-sm font-bold text-slate-800 leading-snug mb-3 line-clamp-2"
                          title={kpi.nombre}
                        >
                          {kpi.nombre}
                        </h3>
                        <p
                          className="text-[10px] font-mono text-gray-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                          title={kpi.formula_texto}
                        >
                          {kpi.formula_texto || "Fórmula no especificada"}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            {itemsToPaginate.length} resultado
            {itemsToPaginate.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-azul hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" /> Anterior
            </button>
            <span className="px-3 py-2 text-[10px] font-black text-gray-500">
              {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-azul hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Eliminación Área */}
      {deleteModal.open &&
        deleteModal.area &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-0">
              {/* Cabecera roja */}
              <div className="bg-rojo-persa p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter font-heading">
                  Eliminar Área
                </h3>
              </div>

              {/* Cuerpo */}
              <div className="p-8 text-center space-y-4">
                <p className="text-gray-600 font-semibold text-sm leading-relaxed">
                  ¿Estás seguro de que deseas eliminar esta área?
                </p>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center">
                    <Folder className="w-5 h-5 text-azul" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-azul font-heading">
                      {deleteModal.area.nombre}
                    </p>
                    <p className="text-[10px] text-naranja font-black uppercase tracking-widest mt-0.5">
                      Área de Trabajo
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Todos los KPIs pertenecientes a esta área y sus registros de
                  llenado serán eliminados permanentemente. Esta acción no se
                  puede deshacer.
                </p>
              </div>

              {/* Botones */}
              <div className="px-8 pb-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, area: null })}
                  disabled={deleting}
                  className="py-4 rounded-2xl border-2 border-slate-200 text-gray-500 font-black text-xs uppercase tracking-widest font-heading hover:bg-slate-50 transition-all disabled:opacity-60"
                >
                  CANCELAR
                </button>
                <button
                  onClick={confirmDeleteArea}
                  disabled={deleting}
                  className="py-4 rounded-2xl bg-rojo-persa text-white font-black text-xs uppercase tracking-widest font-heading hover:bg-red-700 transition-all shadow-lg shadow-rojo-persa/20 disabled:opacity-60"
                >
                  {deleting ? "ELIMINANDO..." : "SÍ, ELIMINAR"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
