import React from 'react';

export default function Sidebar({ userRole, currentTab, setCurrentTab }) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center justify-center border-b border-slate-800">
        <h1 className="text-white font-bold text-lg tracking-wide">Sistema KPI</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            currentTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          Dashboard {userRole === 'admin' && 'Global'}
        </button>

        <button
          onClick={() => setCurrentTab('daily')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            currentTab === 'daily' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          Ingreso Diario
        </button>

        <button
          onClick={() => setCurrentTab('reports')}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            currentTab === 'reports' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          Reportes y Auditoría
        </button>

        {/* Esta opción SOLO la ve el Administrador */}
        {userRole === 'admin' && (
          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              currentTab === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            Configuración
          </button>
        )}
      </nav>
    </aside>
  );
}