export default function Sidebar({ currentTab, setCurrentTab, onLogout }) {
  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 bg-azul text-white/80 flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center justify-center border-b border-white/10">
        <h1 className="text-white font-bold text-lg tracking-wide">Sistema KPI JB</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            currentTab === 'dashboard' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          Dashboard Global
        </button>

        <button
          onClick={() => setCurrentTab('daily')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            currentTab === 'daily' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          Ingreso Diario
        </button>

        <button
          onClick={() => setCurrentTab('reports')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            currentTab === 'reports' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          Auditoria y Reportes
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            currentTab === 'settings' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          Configuracion
        </button>
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center rounded-lg bg-rojo-persa px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-rojo-persa/85"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
