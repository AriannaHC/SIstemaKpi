import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LlenadoKPI from "./pages/LlenadoKPI";
import ConfiguracionKPI from "./pages/ConfiguracionKPI"; // Importar
import Dashboard from "./pages/Dashboard"; // Importar

export default function App() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard"); // Volvemos al dashboard inicial

  if (!user) return <Login />;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "daily": return <LlenadoKPI />;
      case "settings": return <ConfiguracionKPI />;
      case "reports": return <div className="p-10 text-center">Reportes pronto...</div>;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage} onLogout={logout} user={user}>
      {renderPage()}
    </Layout>
  );
}