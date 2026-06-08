// frontend/src/pages/Usuarios.jsx
import { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { kpiService } from "../services/kpiService";
import { Search, Filter, ChevronLeft, ChevronRight, Users } from "lucide-react";

const LIMIT = 10;

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Paginación
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resUsers, resAreas] = await Promise.all([
        userService.getUsers(),
        kpiService.getAreas(),
      ]);
      setUsuarios(resUsers);
      setAreas(resAreas);
    } catch (error) {
      console.error("Error cargando datos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, nuevoRolId, areaIdActual) => {
    try {
      await userService.updateUser(userId, nuevoRolId || null, areaIdActual);
      alert("✅ Rol actualizado con éxito");
      cargarDatos();
    } catch (e) {
      alert("❌ Error al actualizar rol");
    }
  };

  const handleAreaChange = async (userId, rolIdActual, nuevaAreaId) => {
    try {
      await userService.updateUser(userId, rolIdActual, nuevaAreaId || null);
      alert("✅ Área asignada con éxito");
      cargarDatos();
    } catch (e) {
      alert("❌ Error al actualizar área");
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleAreaFilterChange = (e) => {
    setFilterArea(e.target.value);
    setPage(1);
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesName = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea
      ? u.kpi_area_id?.toString() === filterArea
      : true;
    return matchesName && matchesArea;
  });

  const totalPages = Math.ceil(filteredUsuarios.length / LIMIT) || 1;
  const currentUsuarios = filteredUsuarios.slice(
    (page - 1) * LIMIT,
    page * LIMIT,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Gestión de <span className="text-naranja">Usuarios</span>
          </h1>
        </div>
      </div>

      {/* Contenedor Principal */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Filtros */}
        <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-between items-center">
            <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-2 shrink-0 self-start sm:self-center">
              Directorio de Personal
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Búsqueda */}
              <div className="flex gap-2 w-full sm:w-80">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:outline-none focus:border-azul transition-all shadow-sm"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-azul text-white rounded-2xl text-xs font-black hover:bg-azul-profundo transition-all shrink-0"
                >
                  Buscar
                </button>
              </div>

              {/* Filtro Área */}
              <div className="relative w-full sm:w-64">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterArea}
                  onChange={handleAreaFilterChange}
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
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest w-1/4">
                  Colaborador
                </th>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest w-1/4">
                  Correo Electrónico
                </th>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest w-1/4">
                  Nivel de Acceso (Rol)
                </th>
                <th className="px-8 py-5 text-[11px] font-black text-azul uppercase tracking-widest w-1/4">
                  Asignación de Área
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="w-8 h-8 border-4 border-azul border-t-naranja rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (
                currentUsuarios.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Colaborador */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-azul/10 text-azul flex items-center justify-center font-bold text-sm border-2 border-azul/10 shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            {u.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Correo */}
                    <td className="px-8 py-5">
                      <p className="text-xs font-semibold text-gray-500">
                        {u.email}
                      </p>
                    </td>

                    {/* Rol */}
                    <td className="px-8 py-5">
                      <select
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-azul/20 focus:border-azul outline-none transition-all cursor-pointer hover:bg-white"
                        value={u.kpi_rol_id || ""}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            parseInt(e.target.value) || null,
                            u.kpi_area_id,
                          )
                        }
                      >
                        <option value="">-- Sin Acceso --</option>
                        <option value="1">Administrador</option>
                        <option value="2">Jefe de Área</option>
                        <option value="3">Trabajador</option>
                      </select>
                    </td>

                    {/* Área */}
                    <td className="px-8 py-5">
                      <select
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-azul/20 focus:border-azul outline-none transition-all cursor-pointer hover:bg-white disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        value={u.kpi_area_id || ""}
                        onChange={(e) =>
                          handleAreaChange(
                            u.id,
                            u.kpi_rol_id,
                            parseInt(e.target.value),
                          )
                        }
                        disabled={!u.kpi_rol_id || u.kpi_rol_id === 1}
                      >
                        <option value="">-- Seleccionar Área --</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
              {!loading && currentUsuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                        <Users className="w-8 h-8" />
                      </div>
                      <p className="text-azul font-black uppercase tracking-widest text-sm">
                        No se encontraron usuarios
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Intenta con otros términos de búsqueda.
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
            {filteredUsuarios.length} registro
            {filteredUsuarios.length !== 1 ? "s" : ""} encontrado
            {filteredUsuarios.length !== 1 ? "s" : ""}
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
