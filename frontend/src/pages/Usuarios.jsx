import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { userService } from "../services/userService";
import { kpiService } from "../services/kpiService";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
  UserCheck,
  Folder,
} from "lucide-react";
import SelectCustom from "../components/SelectCustom";
import Toast from "../components/Toast";

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
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: selected.color }}
          />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
        )}
        <span
          className="flex-1 text-left truncate"
          style={{ color: selected?.color || "#94a3b8" }}
        >
          {selected ? selected.label : "Sin Acceso"}
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
            <span className="text-gray-400">Sin Acceso</span>
          </button>
          {ROLES.map((rol) => (
            <button
              key={rol.value}
              type="button"
              onClick={() => {
                onChange(rol.value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors text-left"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: rol.color }}
              />
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
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors text-gray-400"
          >
            -- Sin área --
          </button>
          {areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                onChange(a.id);
                setOpen(false);
              }}
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
  const [updating, setUpdating] = useState(false);

  // Estados de Modales y Toast
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [roleModal, setRoleModal] = useState({
    open: false,
    user: null,
    newRoleId: null,
  });
  const [areaModal, setAreaModal] = useState({
    open: false,
    user: null,
    newAreaId: null,
  });

  // Filtros y Paginación
  const [page, setPage] = useState(1);
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
        userService.getUsers().catch((err) => {
          console.error("Error cargando usuarios:", err);
          return [];
        }),
        kpiService.getAreasStats().catch((err) => {
          console.warn("Áreas no disponibles aún:", err.message);
          return [];
        }),
      ]);

      setUsuarios(resUsers);
      setAreas(resAreas);
    } catch (error) {
      console.error("Error crítico cargando datos", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE ROLES ---
  const requestRoleChange = (user, nuevoRolId) => {
    if (user.kpi_rol_id === nuevoRolId) return;
    setRoleModal({ open: true, user, newRoleId: nuevoRolId });
  };

  const confirmRoleChange = async () => {
    const { user, newRoleId } = roleModal;
    setUpdating(true);

    const nuevaArea =
      newRoleId === null ? null : newRoleId === 1 ? null : user.kpi_area_id;

    try {
      await userService.updateUser(user.id, newRoleId, nuevaArea);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, kpi_rol_id: newRoleId, kpi_area_id: nuevaArea }
            : u,
        ),
      );
      setToast({ message: "Rol actualizado correctamente.", type: "success" });
    } catch (error) {
      setToast({ message: "Error al actualizar el rol.", type: "error" });
      cargarDatos();
    } finally {
      setUpdating(false);
      setRoleModal({ open: false, user: null, newRoleId: null });
    }
  };

  // --- LÓGICA DE ÁREAS ---
  const requestAreaChange = (user, nuevaAreaId) => {
    if (user.kpi_area_id === nuevaAreaId) return;
    setAreaModal({ open: true, user, newAreaId: nuevaAreaId });
  };

  const confirmAreaChange = async () => {
    const { user, newAreaId } = areaModal;
    setUpdating(true);

    try {
      await userService.updateUser(user.id, user.kpi_rol_id, newAreaId);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, kpi_area_id: newAreaId } : u,
        ),
      );
      setToast({ message: "Área asignada correctamente.", type: "success" });
    } catch (error) {
      setToast({ message: "Error al actualizar el área.", type: "error" });
      cargarDatos();
    } finally {
      setUpdating(false);
      setAreaModal({ open: false, user: null, newAreaId: null });
    }
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

  const getRoleInfo = (roleId) => {
    return (
      ROLES.find((r) => r.value === roleId) || {
        label: "Sin Acceso",
        color: "#94a3b8",
      }
    );
  };

  const getAreaInfo = (areaId) => {
    return areas.find((a) => a.id === areaId) || { nombre: "Sin Área" };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto relative">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, message: "" })}
      />

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
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 lg:gap-6 justify-between items-start sm:items-center">
            <h2 className="text-xl font-bold text-azul-profundo flex items-center gap-2 shrink-0 self-start sm:self-center">
              Directorio de Personal
            </h2>

            <div className="flex flex-wrap gap-4 w-full sm:w-auto sm:justify-end">
              {/* Búsqueda */}
              <div className="flex gap-2 w-full sm:w-auto sm:flex-1 sm:min-w-65 sm:max-w-[320px]">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold focus:outline-none focus:border-azul transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Filtro Área */}
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-50 sm:max-w-[256px]">
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
              <div className="w-full sm:w-auto sm:flex-1 sm:min-w-42.5 sm:max-w-48">
                <SelectCustom
                  value={filterRol}
                  onChange={(v) => {
                    setFilterRol(v);
                    setPage(1);
                  }}
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
        <div className="hidden md:block overflow-x-auto min-h-100">
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
                          requestRoleChange(u, nuevoRolId)
                        }
                      />
                    </td>

                    {/* Área */}
                    <td className="px-8 py-5">
                      <AreaDropdown
                        areas={areas}
                        value={u.kpi_area_id}
                        onChange={(nuevaAreaId) =>
                          requestAreaChange(u, nuevaAreaId)
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
          ) : currentUsuarios.length === 0 ? (
            <div className="flex flex-col items-center py-16">
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
          ) : (
            currentUsuarios.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === u.id ? null : u.id)
                  }
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-azul/10 text-azul flex items-center justify-center font-bold text-sm border-2 border-azul/10 shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-slate-800 truncate">
                    Colaborador: {u.name}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandedId === u.id ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedId === u.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Correo
                      </p>
                      <p className="text-xs font-semibold text-gray-600">
                        {u.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Nivel de Acceso
                      </p>
                      <RoleDropdown
                        value={u.kpi_rol_id}
                        onChange={(nuevoRolId) =>
                          requestRoleChange(u, nuevoRolId)
                        }
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Asignación de Área
                      </p>
                      <AreaDropdown
                        areas={areas}
                        value={u.kpi_area_id}
                        onChange={(nuevaAreaId) =>
                          requestAreaChange(u, nuevaAreaId)
                        }
                        disabled={!u.kpi_rol_id || u.kpi_rol_id === 1}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
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

      {/* --- MODAL CONFIRMACIÓN DE ROL --- */}
      {roleModal.open &&
        roleModal.user &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-0">
              {/* Cabecera (Roja si es Admin, Azul para otros) */}
              <div
                className={`${roleModal.newRoleId === 1 ? "bg-rojo-persa" : "bg-azul"} p-8 text-white text-center`}
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {roleModal.newRoleId === 1 ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <UserCheck className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter font-heading">
                  {roleModal.newRoleId === 1
                    ? "Otorgar Permisos de Administrador"
                    : "Cambiar Nivel de Acceso"}
                </h3>
              </div>

              <div className="p-8 text-center space-y-4">
                <p className="text-gray-600 font-semibold text-sm leading-relaxed">
                  ¿Confirmas el cambio de acceso para este colaborador?
                </p>

                <div className="flex flex-col gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                      Colaborador
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {roleModal.user.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                      Nuevo Rol
                    </p>
                    <p
                      className="text-sm font-black flex items-center gap-2"
                      style={{ color: getRoleInfo(roleModal.newRoleId).color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getRoleInfo(roleModal.newRoleId)
                            .color,
                        }}
                      />
                      {getRoleInfo(roleModal.newRoleId).label}
                    </p>
                  </div>
                </div>

                {roleModal.newRoleId === 1 && (
                  <p className="text-[11px] text-rojo-persa font-bold">
                    Atención: Los administradores tienen control total sobre el
                    sistema, incluyendo KPIs, usuarios y configuraciones.
                  </p>
                )}
              </div>

              <div className="px-8 pb-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    setRoleModal({ open: false, user: null, newRoleId: null })
                  }
                  disabled={updating}
                  className="py-4 rounded-2xl border-2 border-slate-200 text-gray-500 font-black text-xs uppercase tracking-widest font-heading hover:bg-slate-50 transition-all disabled:opacity-60"
                >
                  CANCELAR
                </button>
                <button
                  onClick={confirmRoleChange}
                  disabled={updating}
                  className={`py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest font-heading transition-all shadow-lg disabled:opacity-60 ${roleModal.newRoleId === 1 ? "bg-rojo-persa hover:bg-red-700 shadow-rojo-persa/20" : "bg-azul hover:bg-azul-profundo shadow-azul/20"}`}
                >
                  {updating ? "GUARDANDO..." : "SÍ, CONFIRMAR"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* --- MODAL CONFIRMACIÓN DE ÁREA --- */}
      {areaModal.open &&
        areaModal.user &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-0">
              <div className="bg-azul p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter font-heading">
                  Reasignar Área
                </h3>
              </div>

              <div className="p-8 text-center space-y-4">
                <p className="text-gray-600 font-semibold text-sm leading-relaxed">
                  ¿Confirmas el cambio de área para este colaborador?
                </p>

                <div className="flex flex-col gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                      Colaborador
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {areaModal.user.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                      Nueva Área Asignada
                    </p>
                    <p className="text-sm font-black text-azul">
                      {getAreaInfo(areaModal.newAreaId).nombre}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    setAreaModal({ open: false, user: null, newAreaId: null })
                  }
                  disabled={updating}
                  className="py-4 rounded-2xl border-2 border-slate-200 text-gray-500 font-black text-xs uppercase tracking-widest font-heading hover:bg-slate-50 transition-all disabled:opacity-60"
                >
                  CANCELAR
                </button>
                <button
                  onClick={confirmAreaChange}
                  disabled={updating}
                  className="py-4 rounded-2xl bg-azul text-white font-black text-xs uppercase tracking-widest font-heading hover:bg-azul-profundo transition-all shadow-lg shadow-azul/20 disabled:opacity-60"
                >
                  {updating ? "GUARDANDO..." : "SÍ, REASIGNAR"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
