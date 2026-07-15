// src/components/Sidebar.jsx
import {
  LayoutDashboard,
  Clock,
  FileBarChart,
  Settings,
  Users,
  LogOut,
  X,
  ChevronRight,
  CalendarCheck,
  ClipboardList,
  History,
  HardDriveDownload,
  BarChart3,
  ArrowLeftRight,
  NotebookPen,
  Boxes,
  BadgeCheck,
} from "lucide-react";

export default function Sidebar({
  currentTab,
  setCurrentTab,
  onLogout,
  user,
  sidebarOpen,
  setSidebarOpen,
}) {
  const rol = user?.kpi_rol_id;
  const areaId = user?.kpi_area_id;

  const handleNavigation = (view) => {
    setCurrentTab(view);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const NavItem = ({ view, icon, label }) => (
    <button
      onClick={() => handleNavigation(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        currentTab === view
          ? "bg-[#123498] text-white shadow-lg shadow-[#123498]/20"
          : "text-gray-500 hover:bg-slate-100 hover:text-[#123498]"
      }`}
    >
      {icon}
      <span className="font-semibold text-sm truncate">{label}</span>
      {currentTab === view && <ChevronRight className="ml-auto w-4 h-4" />}
    </button>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-sm transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo / Título */}
        <div className="p-6 text-center border-b border-slate-50 mb-4 relative">
          <h1 className="text-xl font-extrabold text-[#123498]">
            SISTEMA <span className="text-[#F46F0B]">KPI JB</span>
          </h1>
          <p className="text-[9px] font-black text-gray-400 tracking-[0.2em] mt-1">
            SISTEMA CORPORATIVO
          </p>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-4">
          {/* ========================================================= */}
          {/* VISTAS EXCLUSIVAS DEL ADMINISTRADOR (Rol 1) */}
          {/* ========================================================= */}
          {rol === 1 && (
            <>
              <NavItem
                view="dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                label="Dashboard Global"
              />
              <NavItem
                view="escoger-kpi"
                icon={<CalendarCheck className="w-5 h-5" />}
                label="Selección Semanal"
              />
              <NavItem
                view="historial"
                icon={<History className="w-5 h-5" />}
                label="Historial General"
              />
              <NavItem
                view="backups"
                icon={<HardDriveDownload className="w-5 h-5" />}
                label="Respaldos de BD"
              />
              <NavItem
                view="settings"
                icon={<Settings className="w-5 h-5" />}
                label="Configuración"
              />
              <NavItem
                view="users"
                icon={<Users className="w-5 h-5" />}
                label="Gestión de Usuarios"
              />

              {/* ── Business Intelligence ── */}
              <div className="pt-4 pb-1">
                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Business Intelligence
                </p>
              </div>
              <NavItem
                view="analitica"
                icon={<BarChart3 className="w-5 h-5" />}
                label="Analítica"
              />
              <NavItem
                view="comparativas"
                icon={<ArrowLeftRight className="w-5 h-5" />}
                label="Comparativas"
              />
            </>
          )}

          {/* ========================================================= */}
          {/* VISTAS COMPARTIDAS: Admin y Jefe (Roles 1 y 2) */}
          {/* ========================================================= */}
          {(rol === 1 || rol === 2) && (
            <NavItem
              view="reports"
              icon={<FileBarChart className="w-5 h-5" />}
              label="Auditoría de Llenado"
            />
          )}

          {/* ========================================================= */}
          {/* VISTAS EXCLUSIVAS DEL JEFE DE ÁREA (Rol 2) */}
          {/* ========================================================= */}
          {rol === 2 && (
            <NavItem
              view="mi-equipo"
              icon={<Users className="w-5 h-5" />}
              label="Mi Equipo"
            />
          )}

          {/* ========================================================= */}
          {/* VISTAS OPERATIVAS: Jefe y Trabajador (Roles 2 y 3) */}
          {/* ========================================================= */}
          {(rol === 2 || rol === 3) && (
            <>
              <NavItem
                view="daily"
                icon={<Clock className="w-5 h-5" />}
                label="Tus Indicadores"
              />
              <NavItem
                view="mis-reportes"
                icon={<ClipboardList className="w-5 h-5" />}
                label="Mis Reportes"
              />
              <NavItem
                view="registro-diario"
                icon={<NotebookPen className="w-5 h-5" />}
                label="Registro Diario"
              />
            </>
          )}

          {/* ========================================================= */}
          {/* PANELES POR ÁREA: Operaciones (26) y Calidad (25)         */}
          {/* ========================================================= */}
          {(areaId === 26 || areaId === 25) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Paneles de Área
                </p>
              </div>
              {areaId === 26 && (
                <NavItem
                  view="panel-operaciones"
                  icon={<Boxes className="w-5 h-5" />}
                  label="Panel Operaciones"
                />
              )}
              {areaId === 25 && (
                <NavItem
                  view="panel-calidad"
                  icon={<BadgeCheck className="w-5 h-5" />}
                  label="Panel Calidad"
                />
              )}
            </>
          )}
        </nav>

        {/* Footer: Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onLogout}
            className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" /> CERRAR SESIÓN
          </button>
          <div className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#123498]/10 text-[#123498] flex items-center justify-center font-bold text-sm border-2 border-[#123498]/10 shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">
                {user?.rol_nombre || "Sin Rol"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
