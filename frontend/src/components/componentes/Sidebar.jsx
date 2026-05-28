import { useState } from 'react';
import LoginPage from './components/componentes/LoginPage';
import Sidebar from './components/componentes/Sidebar';
import Header from './components/componentes/Header';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // ESTADOS MAESTROS PARA LA LÓGICA DE ROLES
  const [userRole, setUserRole] = useState('admin'); // 'admin', 'jefe' o 'usuario'
  const [userName, setUserName] = useState('Carlos Martínez');
  const [currentTab, setCurrentTab] = useState('dashboard'); // Pestaña inicial por defecto

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTab('dashboard');
    setUserRole('admin'); // Reset
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex bg-slate-100 min-h-screen w-full antialiased font-sans">
      
      {/* SIDEBAR INTELIGENTE CON CONTROL DE ROL */}
      <Sidebar 
        userRole={userRole} 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* HEADER CON SELECTOR DINÁMICO DE ROLES DE PRUEBA */}
        <Header 
          userName={userName} 
          currentTab={currentTab} 
          userRole={userRole}
          setUserRole={setUserRole}
          setCurrentTab={setCurrentTab}
        />

        {/* ESPACIO DE TRABAJO ADAPTATIVO SEGÚN PESTAÑA */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {currentTab === 'dashboard' && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-[10px] bg-blue-50 text-[#123498] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Vista de {userRole === 'admin' ? 'Administración Global' : 'Supervisión de Área'}
              </span>
              <h3 className="text-xl font-bold text-gray-800 mt-3 mb-2">Módulo 3: Dashboards y Gráficos Históricos</h3>
              <p className="text-gray-500 text-sm max-w-2xl">
                {userRole === 'admin' 
                  ? 'Aquí verás el rendimiento consolidado corporativo de toda la empresa con comparativas de Área vs Área.'
                  : 'Como Jefe de Área, aquí verás únicamente los KPI globales de tu equipo asignado y comparativa de Trabajador vs Trabajador.'}
              </p>
              <div className="mt-6 h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                Área reservada para Gráficos Interactivos (Recharts)
              </div>
            </div>
          )}

          {currentTab === 'daily' && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-[10px] bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Módulo 2: Operaciones Diarias
              </span>
              <h3 className="text-xl font-bold text-gray-800 mt-3 mb-2">Ingreso Diario de KPIs Asignados</h3>
              <p className="text-gray-500 text-sm max-w-2xl">
                {userRole === 'usuario'
                  ? 'Hola Carlos. Completa tus indicadores asignados para el día de hoy. Recuerda que debes llenarlos antes de la hora límite.'
                  : `Simulación de Formulario: Estás viendo la vista de llenado que usará el Colaborador (${userRole}).`}
              </p>
              <div className="mt-6 h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                Área reservada para la Tabla de KPIs con Semáforo Visual (Rojo/Verde/Negro)
              </div>
            </div>
          )}

          {currentTab === 'reports' && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-[10px] bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Módulo 4: Análisis Gerencial
              </span>
              <h3 className="text-xl font-bold text-gray-800 mt-3 mb-2">Auditoría, Tasa de Participación y Descargas</h3>
              <p className="text-gray-500 text-sm max-w-2xl">
                {userRole === 'admin'
                  ? 'Acceso maestro: Generación de Rankings de Cumplimiento (Trabajadores >90% participación vs 0%) y exportación masiva a ExcelJS y jsPDF.'
                  : 'Vista de Supervisión: Control de constancia del llenado diario de tu equipo y alertas enviadas.'}
              </p>
              <div className="mt-6 h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                Área reservada para el Panel de Participación e Historial de Auditoría
              </div>
            </div>
          )}

          {currentTab === 'settings' && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Exclusivo Administrador
              </span>
              <h3 className="text-xl font-bold text-gray-800 mt-3 mb-2">Panel Maestro de Configuración Técnica</h3>
              <p className="text-gray-500 text-sm max-w-2xl">
                Creación, edición y apagado de KPIs del negocio. Programación de fórmulas de metas, límites de horario de entrega y carga masiva mediante plantillas CSV/Excel.
              </p>
              <div className="mt-6 h-32 bg-slate-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                Área reservada para el Motor de Fórmulas y Carga Masiva de Archivos
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200/60">
            <button 
              onClick={handleLogout} 
              className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors duration-200"
            >
              Cerrar Sesión (Simulado)
            </button>
          </div>

        </main>
      </div>

    </div>
  );
}