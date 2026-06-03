export default function Header({ userName, currentTab, userRole, setUserRole }) {
  const subtitles = {
    dashboard: 'Dashboard, analisis en tiempo real y comparativas por trabajador, area y periodo.',
    daily: 'Ingreso diario de indicadores asignados con semaforo visual y validacion de registros.',
    reports: 'Auditoria de participacion, rankings, exportaciones y notificaciones simuladas.',
    settings: 'Panel administrador para KPIs, metas, formulas, horarios limite y reglas de evaluacion.',
  };

  const titles = {
    dashboard: 'Modulo 4 - Dashboard y Comparativas',
    daily: 'Modulo 2 - Ingreso Diario de KPIs',
    reports: 'Modulo 5 - Auditoria y Reportes',
    settings: 'Modulo 3 - Configuracion General',
  };

  const currentDate = new Date().toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const changeRole = (newRole) => {
    setUserRole(newRole);
  };

  return (
    <header className="bg-white border-b border-azul/10 px-4 md:px-8 py-5 flex flex-col gap-6 select-none">
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 w-full">
        <h1 className="text-xl font-bold tracking-tight text-azul" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {titles[currentTab]}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 xl:gap-6">
          <div className="flex items-center gap-2 bg-naranja/10 border border-naranja/30 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold text-naranja uppercase tracking-wider">Rol:</span>
            <select
              value={userRole}
              onChange={(event) => changeRole(event.target.value)}
              className="bg-white text-xs font-bold text-azul-profundo border border-azul/20 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-azul cursor-pointer"
            >
              <option value="admin">Administrador</option>
              <option value="jefe">Jefe de Area</option>
              <option value="usuario">Usuario Regular</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-azul/45">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar KPI..."
              className="pl-10 pr-4 py-1.5 bg-azul/5 text-sm rounded-lg border border-transparent focus:border-azul/25 focus:bg-white focus:ring-0 transition-all duration-200 w-full sm:w-48 text-azul-profundo placeholder-gris-texto"
            />
          </div>

          <div className="flex items-center gap-4 text-azul/45">
            <button className="hover:text-azul transition-colors relative p-1" aria-label="Notificaciones">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-naranja rounded-full" />
            </button>
          </div>

          <div className="hidden sm:block h-6 w-px bg-azul/10" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-azul text-white shadow-sm flex items-center justify-center font-bold text-xs uppercase ring-2 ring-naranja/25">
              {userName.split(' ').map((name) => name[0]).join('')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-azul-profundo tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Hola, {userName}
          </h2>
          <p className="text-gris-texto text-sm mt-1 font-medium">
            {subtitles[currentTab]}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-azul/5 px-4 py-2.5 rounded-lg border border-azul/10 shadow-sm w-fit">
          <span className="text-[10px] font-bold text-naranja tracking-wider uppercase">Fecha actual:</span>
          <span className="text-sm font-bold text-azul-profundo">{currentDate}</span>
        </div>
      </div>
    </header>
  );
}
