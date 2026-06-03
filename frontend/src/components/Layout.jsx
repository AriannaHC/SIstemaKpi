import Sidebar from './Sidebar'; // Ajusta la ruta si las tienes en otra subcarpeta
import Header from './Header';

export default function Layout({ children, activePage, setActivePage, onLogout, user }) {
  // Mapeamos el rol del usuario (1 = admin, otro = usuario)
  const userRole = user?.kpi_rol_id === 1 ? 'admin' : 'usuario';
  
  return (
    <div className="flex bg-blanco-suave min-h-screen w-full antialiased font-sans text-azul-profundo">
      <Sidebar currentTab={activePage} setCurrentTab={setActivePage} onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
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