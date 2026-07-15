// src/App.jsx
import { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import { kpiService } from "./services/kpiService";
import { userService } from "./services/userService";

// Lazy imports — solo se cargan cuando se navega a la página
const LlenadoKPI = lazy(() => import("./pages/LlenadoKPI"));
const ConfiguracionKPI = lazy(() => import("./pages/ConfiguracionKPI"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const EscogerKPI = lazy(() => import("./pages/EscogerKPI"));
const MiEquipo = lazy(() => import("./pages/MiEquipo"));
const Reportes = lazy(() => import("./pages/Reportes"));
const MisReportes = lazy(() => import("./pages/MisReportes"));
const HistorialKPIs = lazy(() => import("./pages/HistorialKPIs"));
const Analitica = lazy(() => import("./pages/Analitica"));
const Comparativas = lazy(() => import("./pages/Comparativas"));
const Backups = lazy(() => import("./pages/Backups"));
const LlenadoRegistroDiario = lazy(() => import("./pages/LlenadoRegistroDiario"));
const PanelOperaciones = lazy(() => import("./pages/PanelOperaciones"));
const PanelCalidad = lazy(() => import("./pages/PanelCalidad"));
const LlenadoAuditoria = lazy(() => import("./pages/LlenadoAuditoria"));

const PageSpinner = (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-[#123498] border-t-[#F46F0B] rounded-full animate-spin" />
  </div>
);

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
  const [auditoriaFeedback, setAuditoriaFeedback] = useState(null);

  const navigateToAuditoria = (registroId) => {
    setAuditoriaRegistroId(registroId);
    setActivePage("llenado-auditoria");
  };

  // ── PREFETCH: carga datos en background al hacer hover en el sidebar ──
  const prefetchMap = {
    dashboard: useCallback(() => { kpiService.getDashboardData(); }, []),
    reports: useCallback(() => { kpiService.getAlertas(); }, []),
    historial: useCallback(() => { kpiService.getHistorial(); }, []),
    users: useCallback(() => { userService.getUsers(); kpiService.getAreasStats(); }, []),
    analitica: useCallback(() => { kpiService.getAreasStats(); }, []),
    comparativas: useCallback(() => { kpiService.getAreasStats(); userService.getUsers(); }, []),
  };

  useEffect(() => {
    if (user) {
      setActivePage(getDefaultPage(user.kpi_rol_id));
    }
  }, [user]);

  if (!user) return <Login />;

  const renderPage = () => {
    let content;

    switch (activePage) {
      case "dashboard":
        content = <Dashboard setActivePage={setActivePage} />;
        break;
      case "daily":
        content = <LlenadoKPI />;
        break;
      case "settings":
        content = <ConfiguracionKPI />;
        break;
      case "users":
        content = <Usuarios />;
        break;
      case "escoger-kpi":
        content = <EscogerKPI />;
        break;
      case "reports":
        content = <Reportes />;
        break;
      case "mis-reportes":
        content = <MisReportes />;
        break;
      case "historial":
        content = <HistorialKPIs />;
        break;
      case "mi-equipo":
        content = <MiEquipo />;
        break;
      case "analitica":
        content = <Analitica />;
        break;
      case "comparativas":
        content = <Comparativas />;
        break;
      case "backups":
        content = <Backups />;
        break;
      case "registro-diario":
        content = <LlenadoRegistroDiario />;
        break;
      case "panel-operaciones":
        content = (
          <PanelOperaciones
            setActivePage={setActivePage}
            navigateToAuditoria={navigateToAuditoria}
            auditoriaFeedback={auditoriaFeedback}
            setAuditoriaFeedback={setAuditoriaFeedback}
          />
        );
        break;
      case "panel-calidad":
        content = (
          <PanelCalidad
            setActivePage={setActivePage}
            navigateToAuditoria={navigateToAuditoria}
            auditoriaFeedback={auditoriaFeedback}
            setAuditoriaFeedback={setAuditoriaFeedback}
          />
        );
        break;
      case "llenado-auditoria":
        content = (
          <LlenadoAuditoria
            registroId={auditoriaRegistroId}
            setActivePage={setActivePage}
            setAuditoriaFeedback={setAuditoriaFeedback}
          />
        );
        break;
      default:
        content = <LlenadoKPI />;
        break;
    }

    return <Suspense fallback={PageSpinner}>{content}</Suspense>;
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={logout}
      user={user}
      onPrefetch={prefetchMap}
    >
      {renderPage()}
    </Layout>
  );
}
