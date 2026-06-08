import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ currentTab, setCurrentTab, onLogout, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const rol = user?.kpi_rol_id;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
      if (window.innerWidth >= 640) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    // Initial check
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        type="button" 
        className={`fixed top-4 left-4 z-50 text-azul bg-white border border-gray-200 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm p-2 shadow-sm focus:outline-none sm:hidden ${isOpen ? 'hidden' : ''}`}
        aria-controls="logo-sidebar"
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h10"/>
        </svg>
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-gray-900/60 z-30 sm:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        id="logo-sidebar"
        initial={false}
        animate={{ x: isOpen ? 0 : (isMobile ? "-100%" : 0) }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 z-40 h-screen w-72 bg-azul text-white/80 flex flex-col shadow-2xl sm:shadow-none sm:static"
        aria-label="Sidebar"
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
          <h1 className={`text-white font-bold text-xl tracking-wide truncate ${!isMobile ? 'w-full text-center' : ''}`}>
            Sistema KPI JB
          </h1>
          {isMobile && (
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)} 
              className="text-white/70 hover:text-white p-1.5 rounded-lg focus:outline-none bg-white/5 hover:bg-white/10 shrink-0 ml-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </motion.button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto font-medium">
          {/* Administradores y Jefes ven el Dashboard */}
          {(rol === 1 || rol === 2) && (
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                currentTab === 'dashboard' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white text-white/80'
              }`}
            >
              <svg className={`w-5 h-5 transition duration-75 ${currentTab === 'dashboard' ? 'text-naranja' : 'group-hover:text-white'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6.025A7.5 7.5 0 1 0 17.975 14H10V6.025Z"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 3c-.169 0-.334.014-.5.025V11h7.975c.011-.166.025-.331.025-.5A7.5 7.5 0 0 0 13.5 3Z"/></svg>
              <span className="ms-3 text-sm">Dashboard Global</span>
            </button>
          )}

          {/* Todos pueden llenar KPIs diarios */}
          <button
            onClick={() => handleTabChange('daily')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
              currentTab === 'daily' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white text-white/80'
            }`}
          >
            <svg className={`shrink-0 w-5 h-5 transition duration-75 ${currentTab === 'daily' ? 'text-naranja' : 'group-hover:text-white'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v14M9 5v14M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>
            <span className="flex-1 ms-3 text-left whitespace-nowrap text-sm">Ingreso Diario</span>
          </button>

          <button
            onClick={() => handleTabChange('reports')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
              currentTab === 'reports' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white text-white/80'
            }`}
          >
            <svg className={`shrink-0 w-5 h-5 transition duration-75 ${currentTab === 'reports' ? 'text-naranja' : 'group-hover:text-white'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 13h3.439a.991.991 0 0 1 .908.6 3.978 3.978 0 0 0 7.306 0 .99.99 0 0 1 .908-.6H20M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M4 13l2-9h12l2 9M9 7h6m-7 3h8"/></svg>
            <span className="flex-1 ms-3 text-left whitespace-nowrap text-sm">Auditoria y Reportes</span>
          </button>

          {/* Solo Administradores (1) ven Configuración y Usuarios */}
          {rol === 1 && (
            <>
              <button
                onClick={() => handleTabChange('settings')}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  currentTab === 'settings' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white text-white/80'
                }`}
              >
                <svg className={`w-5 h-5 transition duration-75 ${currentTab === 'settings' ? 'text-naranja' : 'group-hover:text-white'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="flex-1 ms-3 text-left whitespace-nowrap text-sm">Configuracion</span>
              </button>
              
              <button
                onClick={() => handleTabChange('users')}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  currentTab === 'users' ? 'bg-white text-naranja shadow-sm' : 'hover:bg-white/10 hover:text-white text-white/80'
                }`}
              >
                <svg className={`shrink-0 w-5 h-5 transition duration-75 ${currentTab === 'users' ? 'text-naranja' : 'group-hover:text-white'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
                <span className="flex-1 ms-3 text-left whitespace-nowrap text-sm">Gestión de Usuarios</span>
              </button>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4 shrink-0">
          <div className="mb-4 px-2">
            <p className="text-sm text-white font-bold truncate">{user?.name}</p>
            <p className="text-xs text-white/60 truncate">{user?.rol_nombre || 'Sin Rol'}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center rounded-lg bg-rojo-persa px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rojo-persa/85 gap-2 group"
          >
            <svg className="shrink-0 w-4 h-4 transition duration-75 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/></svg>
            Cerrar sesión
          </button>
        </div>
      </motion.aside>
    </>
  );
}