import React from 'react';

export default function Sidebar({ userRole, currentTab, setCurrentTab }) {
  
  // DEFINICIÓN DE TODAS LAS OPCIONES POSIBLES DEL MENÚ
  const menuItems = [
    {
      id: 'dashboard',
      title: 'Panel de Control',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      rolesPermitidos: ['admin', 'jefe'] // El usuario regular no ve el dashboard global
    },
    {
      id: 'daily',
      title: 'Ingreso Diario KPIs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      rolesPermitidos: ['admin', 'jefe', 'usuario'] // Todos ingresan KPIs
    },
    {
      id: 'reports',
      title: 'Auditoría y Reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      rolesPermitidos: ['admin', 'jefe'] // El usuario regular no ve auditorías ni rankings
    },
    {
      id: 'settings',
      title: 'Configuración General',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      rolesPermitidos: ['admin'] // Sección exclusiva del Administrador Maestro
    }
  ];

  // FILTRAR MENÚ: Solo dejamos los ítems que incluyan el rol del usuario actual
  const menuFiltrado = menuItems.filter(item => item.rolesPermitidos.includes(userRole));

  return (
    <aside className="w-72 bg-[#123498] text-white min-h-screen flex flex-col justify-between shadow-xl select-none">
      <div>
        {/* LOGO EMPRESARIAL */}
        <div className="p-6 border-b border-white/10 flex flex-col items-center gap-2 bg-[#0d2775]">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-inner">
            <span className="text-[#123498] font-black text-2xl tracking-tighter">JB</span>
          </div>
          <div className="text-center mt-1">
            <h2 className="font-bold text-sm tracking-wider uppercase">Consultora JB</h2>
            <p className="text-[10px] text-blue-200/70 font-medium tracking-widest mt-0.5">KPI MANAGEMENT v1.0</p>
          </div>
        </div>

        {/* MENÚ DINÁMICO NAVEGABLE */}
        <nav className="p-4 mt-4 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-blue-200/50 uppercase px-3 mb-2">
            Menú de Operaciones
          </span>
          
          {menuFiltrado.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F46F0B] text-white shadow-md shadow-[#F46F0B]/20 scale-[1.02]'
                    : 'text-blue-100/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* DETALLES DEL ROL ACTUAL ABAJO EN EL SIDEBAR */}
      <div className="p-4 m-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <p className="text-[11px] text-blue-200/60 font-medium uppercase tracking-wider">Modo de Acceso</p>
            <p className="text-xs font-bold capitalize text-white">
              {userRole === 'admin' && '🎯 Administrador Maestro'}
              {userRole === 'jefe' && '👔 Jefe de Área'}
              {userRole === 'usuario' && '👤 Colaborador'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}