// App.jsx
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LlenadoKPI from "./pages/LlenadoKPI";
import ConfiguracionKPI from "./pages/ConfiguracionKPI";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import EscogerKPI from "./pages/EscogerKPI"; // <-- Importamos la nueva vista

export default function App() {
  const { user, logout } = useAuth();

  // Por defecto, si es trabajador (3) mandarlo a daily, si no, al dashboard
  const [activePage, setActivePage] = useState(
    user?.kpi_rol_id === 3 ? "daily" : "dashboard",
  );

  if (!user) return <Login />;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "daily":
        return <LlenadoKPI />;
      case "settings":
        return <ConfiguracionKPI />;
      case "users":
        return <Usuarios />;
      case "escoger-kpi":
        return <EscogerKPI />; // <-- Agregamos el caso
      case "reports":
        return <div className="p-10 text-center">Reportes pronto...</div>;
      default:
        return <LlenadoKPI />;
    }
  };

  return (
    // ¡Asegúrate de pasarle 'user' al Layout si este a su vez se lo pasa al Sidebar!
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
