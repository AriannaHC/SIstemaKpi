import React from 'react';

export default function Header({ userName, currentTab, userRole, setUserRole, setCurrentTab }) {
  
  const getSubtitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Visualiza el estado general y rendimiento de los indicadores en tiempo real.';
      case 'daily':
        return 'Ingresa tus indicadores diarios para mantener el rendimiento al día.';
      case 'reports':
        return 'Analiza las métricas de participación, reportes y exportaciones.';
      case 'settings':
        return 'Panel de configuración maestro de fórmulas, KPIs y metas globales.';
      default:
        return 'Bienvenido de vuelta al sistema.';
    }
  };

  const obtenerFechaActual = () => {
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('es-ES', opciones);
  };

  // CONTROL DE CAMBIO DE ROL AUTOMÁTICO AL SELECCIONAR CON EL SELECTOR
  const cambiarRolDePrueba = (nuevoRol) => {
    setUserRole(nuevoRol);
    // Forzar pestaña válida si el nuevo rol no tiene acceso a la actual
    if (nuevoRol === 'usuario') {
      setCurrentTab('daily'); // El usuario común solo puede estar en ingreso diario
    } else if (nuevoRol === 'jefe' && currentTab === 'settings') {
      setCurrentTab('dashboard'); // El jefe no tiene settings
    }
  };

  return (
    <header className="bg-slate-50 border-b border-gray-100 px-8 py-5 flex flex-col gap-6 select-none">
      
      <div className="flex justify-between items-center w-full">
        
        {/* Título dinámico */}
        <h1 className="text-xl font-bold tracking-tight text-[#123498]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {currentTab === 'daily' && 'KPI Dashboard - Formulario'}
          {currentTab === 'dashboard' && 'Panel de Control Gerencial'}
          {currentTab === 'reports' && 'Auditoría y Reportes de Participación'}
          {currentTab === 'settings' && 'Configuración Global (Maestro)'}
        </h1>

        {/* Acciones de la derecha */}
        <div className="flex items-center gap-6">
          
          {/* SELECTOR DE ROLES DE PRUEBA (HERRAMIENTA DE DESARROLLO) */}
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200/60 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Simular Vista:</span>
            <select 
              value={userRole} 
              onChange={(e) => cambiarRolDePrueba(e.target.value)}
              className="bg-white text-xs font-bold text-gray-700 border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#123498] cursor-pointer"
            >
              <option value="admin">Administrador</option>
              <option value="jefe">Jefe de Área</option>
              <option value="usuario">Usuario Regular</option>
            </select>
          </div>

          {/* Buscador */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-1.5 bg-gray-100 text-sm rounded-lg border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 transition-all duration-200 w-48 text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Notificaciones */}
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-[#123498] transition-colors relative p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F46F0B] rounded-full" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Iniciales del Perfil */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#123498] to-[#1d4ed8] text-white shadow-sm flex items-center justify-center font-bold text-xs uppercase">
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Hola, {userName}
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">
            {getSubtitle()}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-gray-200/70 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Fecha Actual:</span>
          <span className="text-sm font-bold text-gray-700">{obtenerFechaActual()}</span>
        </div>
      </div>

    </header>
  );
}