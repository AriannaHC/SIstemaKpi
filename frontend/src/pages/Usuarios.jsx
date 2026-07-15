// frontend/src/pages/Usuarios.jsx
import { useState, useEffect, useRef } from "react";
import { userService } from "../services/userService";
import { kpiService } from "../services/kpiService";
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Users } from "lucide-react";
import SelectCustom from "../components/SelectCustom";

const ROLES = [
  { value: 1, label: "Administrador", color: "#123498" },
  { value: 2, label: "Jefe de Área", color: "#F46F0B" },
  { value: 3, label: "Trabajador", color: "#41C4C0" },
];

function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = ROLES.find((r) => r.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold outline-none transition-all cursor-pointer hover:bg-white"
      >
        {selected ? (
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
        )}
        <span className="flex-1 text-left truncate" style={{ color: selected?.color || "#94a3b8" }}>
          {selected ? selected.label : "Sin Acceso"}
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
            <span className="text-gray-400">Sin Acceso</span>
          </button>
          {ROLES.map((rol) => (
            <button
              key={rol.value}
              type="button"
              onClick={() => { onChange(rol.value); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: rol.color }} />
              <span style={{ color: rol.color }}>{rol.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AreaDropdown({ areas, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = areas.find((a) => a.id === value);
  const isDisabled = disabled;

  return (
    <div className={`relative ${isDisabled ? "opacity-50" : ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => !isDisabled && setOpen(!open)}
        className={`w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold outline-none transition-all cursor-pointer hover:bg-white text-left ${isDisabled ? "cursor-not-allowed" : ""}`}
        disabled={isDisabled}
      >
        <span className="flex-1 truncate text-slate-700">
          {selected ? selected.nombre : "-- Sin área --"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>
      {open && !isDisabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors text-gray-400"
          >
            -- Sin área --
          </button>
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { onChange(a.id); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors text-slate-700"
            >
              {a.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [filterRol, setFilterRol] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resUsers, resAreas] = await Promise.all([
        userService.getUsers(),
        kpiService.getAreasStats(),
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
    const nuevaArea = nuevoRolId === null ? null : (nuevoRolId === 1 ? null : areaIdActual);

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, kpi_rol_id: nuevoRolId, kpi_area_id: nuevaArea } : u,
      ),
    );

    try {
      await userService.updateUser(userId, nuevoRolId, nuevaArea);
    } catch {
      alert("❌ Error al actualizar rol, recargando datos...");
      cargarDatos();
    }
  };

  const handleAreaChange = async (userId, rolIdActual, nuevaAreaId) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, kpi_area_id: nuevaAreaId } : u,
      ),
    );

    try {
      await userService.updateUser(userId, rolIdActual, nuevaAreaId);
    } catch {
      alert("❌ Error al actualizar área, recargando datos...");
      cargarDatos();
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleAreaFilterChange = (value) => {
    setFilterArea(value);
    setPage(1);
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesName = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea
      ? u.kpi_area_id?.toString() === filterArea
      : true;
    const matchesRol = filterRol
      ? u.kpi_rol_id?.toString() === filterRol
      : true;
    return matchesName && matchesArea && matchesRol;
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
              <div className="w-full sm:w-64">
                <SelectCustom
                  value={filterArea}
                  onChange={handleAreaFilterChange}
                  options={[
                    { value: "", label: "TODAS LAS ÁREAS" },
                    ...areas.map((a) => ({
                      value: a.id.toString(),
                      label: a.nombre.toUpperCase(),
                    })),
                  ]}
                  placeholder="TODAS LAS ÁREAS"
                  icon={<Filter className="w-4 h-4" />}
                />
              </div>

              {/* Filtro Rol */}
              <div className="w-full sm:w-48">
                <SelectCustom
                  value={filterRol}
                  onChange={(v) => { setFilterRol(v); setPage(1); }}
                  options={[
                    { value: "", label: "TODOS LOS ROLES" },
                    ...ROLES.map((r) => ({
                      value: r.value.toString(),
                      label: r.label.toUpperCase(),
                    })),
                  ]}
                  placeholder="TODOS LOS ROLES"
                  icon={<Users className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla — Desktop */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
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
                      <RoleDropdown
                        value={u.kpi_rol_id}
                        onChange={(nuevoRolId) =>
                          handleRoleChange(u.id, nuevoRolId, u.kpi_area_id)
                        }
                      />
                    </td>

                    {/* Área */}
                    <td className="px-8 py-5">
                      <AreaDropdown
                        areas={areas}
                        value={u.kpi_area_id}
                        onChange={(nuevaAreaId) =>
                          handleAreaChange(u.id, u.kpi_rol_id, nuevaAreaId)
                        }
                        disabled={!u.kpi_rol_id || u.kpi_rol_id === 1}
                      />
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

        {/* Tabla — Mobile */}
        <div className="md:hidden space-y-3 p-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-azul border-t-naranja rounded-full animate-spin" />
            </div>
          ) : (
            currentUsuarios.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-azul font-black uppercase tracking-widest text-sm">No se encontraron usuarios</p>
                <p className="text-gray-500 text-xs mt-1">Intenta con otros términos de búsqueda.</p>
              </div>
            ) : (
              currentUsuarios.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <button
                    onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-azul/10 text-azul flex items-center justify-center font-bold text-sm border-2 border-azul/10 shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-left text-sm font-bold text-slate-800 truncate">
                      Colaborador: {u.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandedId === u.id ? "rotate-180" : ""}`} />
                  </button>
                  {expandedId === u.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Correo</p>
                        <p className="text-xs font-semibold text-gray-600">{u.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nivel de Acceso</p>
                        <RoleDropdown
                          value={u.kpi_rol_id}
                          onChange={(nuevoRolId) => handleRoleChange(u.id, nuevoRolId, u.kpi_area_id)}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Asignación de Área</p>
                        <AreaDropdown
                          areas={areas}
                          value={u.kpi_area_id}
                          onChange={(nuevaAreaId) => handleAreaChange(u.id, u.kpi_rol_id, nuevaAreaId)}
                          disabled={!u.kpi_rol_id || u.kpi_rol_id === 1}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )
          )}
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
