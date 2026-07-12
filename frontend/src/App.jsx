// src/App.jsx
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
import MisReportes from "./pages/MisReportes";
import HistorialKPIs from "./pages/HistorialKPIs";

// NUEVAS PÁGINAS
import Analitica from "./pages/Analitica";
import Comparativas from "./pages/Comparativas";
import Backups from "./pages/Backups";
import LlenadoRegistroDiario from "./pages/LlenadoRegistroDiario";
import PanelOperaciones from "./pages/PanelOperaciones";
import PanelCalidad from "./pages/PanelCalidad";
import LlenadoAuditoria from "./pages/LlenadoAuditoria";

export default function App() {
  const { user, logout } = useAuth();

  const getDefaultPage = (rol) => {
    switch (rol) {
      case 1:
        return "escoger-kpi";
      case 2:
        return "mi-equipo";
      case 3:
        return "daily";
      default:
        return "daily";
    }
  };

  const [activePage, setActivePage] = useState(() =>
    getDefaultPage(user?.kpi_rol_id),
  );

  // ── ESTADOS PARA LA AUDITORÍA ──
  const [auditoriaRegistroId, setAuditoriaRegistroId] = useState(null);
  const [auditoriaFeedback, setAuditoriaFeedback] = useState(null); // <--- NUEVO ESTADO

  const navigateToAuditoria = (registroId) => {
    setAuditoriaRegistroId(registroId);
    setActivePage("llenado-auditoria");
  };

  useEffect(() => {
    if (user) {
      setActivePage(getDefaultPage(user.kpi_rol_id));
    }
  }, [user]);

  if (!user) return <Login />;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard setActivePage={setActivePage} />;
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
      case "mis-reportes":
        return <MisReportes />;
      case "historial":
        return <HistorialKPIs />;
      case "mi-equipo":
        return <MiEquipo />;

      // RUTAS NUEVAS
      case "analitica":
        return <Analitica />;
      case "comparativas":
        return <Comparativas />;
      case "backups":
        return <Backups />;
      case "registro-diario":
        return <LlenadoRegistroDiario />;

      // ── PANELES ACTUALIZADOS ──
      case "panel-operaciones":
        return (
          <PanelOperaciones
            setActivePage={setActivePage}
            navigateToAuditoria={navigateToAuditoria}
            auditoriaFeedback={auditoriaFeedback}
            setAuditoriaFeedback={setAuditoriaFeedback}
          />
        );
      case "panel-calidad":
        return (
          <PanelCalidad
            setActivePage={setActivePage}
            navigateToAuditoria={navigateToAuditoria}
            auditoriaFeedback={auditoriaFeedback}
            setAuditoriaFeedback={setAuditoriaFeedback}
          />
        );
      case "llenado-auditoria":
        return (
          <LlenadoAuditoria
            registroId={auditoriaRegistroId}
            setActivePage={setActivePage}
            setAuditoriaFeedback={setAuditoriaFeedback}
          />
        );

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
