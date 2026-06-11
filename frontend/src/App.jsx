// App.jsx
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LlenadoKPI from "./pages/LlenadoKPI";
import ConfiguracionKPI from "./pages/ConfiguracionKPI";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import EscogerKPI from "./pages/EscogerKPI";
import MiEquipo from "./pages/MiEquipo";
import Reportes from "./pages/Reportes";

export default function App() {
  const { user, logout } = useAuth();

  // 1. Función para determinar la página inicial según el rol
  const getDefaultPage = (rol) => {
    switch (rol) {
      case 1:
        return "settings"; // Admin -> Configuración KPI
      case 2:
        return "mi-equipo"; // Jefe de Área -> Mi Equipo
      case 3:
        return "daily"; // Trabajador -> Ingreso Diario
      default:
        return "daily";
    }
  };

  // 2. Inicializamos el estado con la función
  const [activePage, setActivePage] = useState(() =>
    getDefaultPage(user?.kpi_rol_id),
  );

  // 3. Efecto clave: Si el usuario inicia sesión o cambia de cuenta, forzamos la redirección
  useEffect(() => {
    if (user) {
      setActivePage(getDefaultPage(user.kpi_rol_id));
    }
  }, [user]);

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
        return <EscogerKPI />;
      case "reports":
        return <Reportes />;
      case "mi-equipo":
        return <MiEquipo />;
      default:
        return <LlenadoKPI />;
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
