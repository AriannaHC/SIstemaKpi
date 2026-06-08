// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
  Trash2,
  Edit,
  FileSpreadsheet,
  Settings
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LIMIT = 10;

export default function Dashboard() {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [allKpis, setAllKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Filtros y Paginación
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getDashboardData();
      
      const areasList = data.map(d => ({ id: d.id, nombre: d.nombre }));
      setAreas(areasList);

      const kpisFlat = [];
      data.forEach(area => {
        area.kpis.forEach(kpi => {
          kpisFlat.push({
            ...kpi,
            area_id: area.id,
            area_nombre: area.nombre
          });
        });
      });
      setAllKpis(kpisFlat);
    } catch (e) {
      console.error("Error cargando dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleAreaChange = (e) => {
    setFilterArea(e.target.value);
    setPage(1);
  };

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

  const handleDeleteArea = async (id, nombre) => {
    if (window.confirm(`⚠️ ¡CUIDADO!\n\n¿Seguro que deseas eliminar el área "${nombre}" y todos sus KPIs?`)) {
      try {
        await kpiService.deleteArea(id);
        loadData();
      } catch (e) {
        alert("Error al eliminar el Área");
      }
    }
  };

  const filteredKpis = allKpis.filter((kpi) => {
    const matchesSearch = kpi.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea ? kpi.area_id.toString() === filterArea : true;
    return matchesSearch && matchesArea;
  });

  const totalPages = Math.ceil(filteredKpis.length / LIMIT) || 1;
  const currentKpis = filteredKpis.slice((page - 1) * LIMIT, page * LIMIT);

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
            Gestión centralizada de áreas, carga de estructuras y catálogo de KPIs.
          </p>
        </div>
      </div>

      {/* Centro de Importación */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30">
          <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-2 mb-6">
            <FileSpreadsheet className="w-6 h-6 text-naranja" /> Centro de Importación
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subida 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-azul mb-1">1. Subir Excel de Área</h3>
              <p className="text-xs text-gray-500 mb-5">Crea las estructuras, cálculos automáticos y campos base.</p>
              <form onSubmit={handleUploadArea} className="flex flex-col sm:flex-row gap-3 items-center">
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
              <h3 className="font-bold text-azul mb-1">2. Subir Diccionario SMART</h3>
              <p className="text-xs text-gray-500 mb-5">Autoconfigura KPIs Positivos/Negativos matemáticamente.</p>
              <form onSubmit={handleUploadSmart} className="flex flex-col sm:flex-row gap-3 items-center">
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

      {/* Tabla */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Filtros */}
        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-center justify-between">
            <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-2 shrink-0 self-start md:self-center">
              Catálogo de KPIs
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Búsqueda */}
              <div className="flex gap-2 w-full sm:w-80">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar KPI..."
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:outline-none focus:border-azul transition-all shadow-sm"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-azul text-white rounded-2xl text-xs font-black hover:bg-azul-profundo transition-all"
                >
                  Buscar
                </button>
              </div>

              {/* Filtro área (solo admin) */}
              {user?.kpi_rol_id === 1 && (
                <div className="relative w-full sm:w-64">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={filterArea}
                    onChange={handleAreaChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:outline-none focus:border-azul appearance-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">TODAS LAS ÁREAS</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id.toString()}>
                        {a.nombre.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest">
                  KPI
                </th>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest">
                  Área
                </th>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest">
                  Fórmula Base
                </th>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-azul border-t-naranja rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (
                currentKpis.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-2 h-2 rounded-full ${kpi.tipo_kpi === 'Positivo' ? 'bg-turquesa' : 'bg-rojo-persa'}`} />
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            {kpi.nombre}
                          </p>
                          <div className="mt-1 flex gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getTipoColor(kpi.tipo_kpi)}`}>
                              {kpi.tipo_kpi}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-between group">
                        <p className="text-xs font-bold text-slate-600">
                          {kpi.area_nombre}
                        </p>
                        {user?.kpi_rol_id === 1 && (
                          <button 
                            onClick={() => handleDeleteArea(kpi.area_id, kpi.area_nombre)}
                            className="opacity-0 group-hover:opacity-100 text-[10px] text-rojo-persa font-bold hover:underline transition-opacity flex items-center gap-1"
                            title="Eliminar toda el área y sus KPIs"
                          >
                            Borrar Área
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-mono text-gray-500 line-clamp-2 max-w-[250px]" title={kpi.formula_texto}>
                        {kpi.formula_texto || "-"}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
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
                    </td>
                  </tr>
                ))
              )}
              {!loading && currentKpis.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                        <Activity className="w-8 h-8" />
                      </div>
                      <p className="text-azul font-black uppercase tracking-widest text-sm">
                        No hay KPIs registrados
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Sube un Excel de Área para comenzar.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            {filteredKpis.length} registro{filteredKpis.length !== 1 ? "s" : ""} encontrado{filteredKpis.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-azul hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" /> Anterior
            </button>
            <span className="px-3 py-2 text-[10px] font-black text-gray-500">
              {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-azul hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}