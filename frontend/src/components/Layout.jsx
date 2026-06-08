// src/components/Layout.jsx
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, activePage, setActivePage, onLogout, user }) {
  const userRole = user?.kpi_rol_id === 1 ? 'admin' : 'usuario';
  
  return (
    <div className="flex bg-blanco-suave h-screen w-full antialiased font-sans text-azul-profundo overflow-hidden">
      {/* ✅ CORRECCIÓN: añade user={user} aquí */}
      <Sidebar currentTab={activePage} setCurrentTab={setActivePage} onLogout={onLogout} user={user} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <Header
          userName={user?.name || 'Usuario'}
          currentTab={activePage}
          userRole={userRole}
          setCurrentTab={setActivePage}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}