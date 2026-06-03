import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Páginas (Mueve temporalmente DashboardView, DailyView, etc. desde Views.jsx a la carpeta pages, o impórtalos de donde los tengas por ahora)
import Login from "./pages/Login";
import { DashboardView, DailyView, SettingsView, ReportsView } from "./components/Views"; // Ajusta a donde tengas tus vistas ahora

export default function App() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  // Si no hay usuario en el Contexto, mostramos el Login
  if (!user) {
    return <Login />;
  }

  // Mapeamos las props falsas que requieren las vistas temporales
  const userRole = user.kpi_rol_id === 1 ? 'admin' : 'usuario';

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardView userRole={userRole} kpis={[]} entries={{}} />;
      case "daily": return <DailyView userRole={userRole} kpis={[]} entries={{}} setEntries={()=>{}} addNotification={()=>{}} />;
      case "settings": return <SettingsView kpis={[]} setKpis={()=>{}} />;
      case "reports": return <ReportsView kpis={[]} entries={{}} participation={{}} notifications={[]} addNotification={()=>{}} />;
      default: return <DashboardView userRole={userRole} kpis={[]} entries={{}} />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={logout}
      user={user}
    >
      {renderPage()}
    </Layout>
  );
}