import React, { useEffect, useState, useCallback } from "react";
import { registroDiarioService } from "../services/registroDiarioService";
import Toast from "../components/Toast";
import RegistroDiarioPanelTable from "../components/RegistroDiarioPanelTable";
import RegistroDiarioCards from "../components/RegistroDiarioCards";
import RegistroDiarioDetalleModal from "../components/RegistroDiarioDetalleModal";
import { LayoutList, ListChecks } from "lucide-react";
import confetti from "canvas-confetti";

export default function PanelOperaciones({
  setActivePage,
  navigateToAuditoria,
  auditoriaFeedback,
  setAuditoriaFeedback,
}) {
  const COLOR_AZUL = "#123498";
  const COLOR_NARANJA = "#F46F0B";

  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Manejo de Vistas y Modal
  const [vistaActiva, setVistaActiva] = useState("pendientes"); // "pendientes" | "auditados"
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Conteo filtrado proveniente de RegistroDiarioCards
  const [pendientesFiltrados, setPendientesFiltrados] = useState(null);
  const [hayFiltrosCards, setHayFiltrosCards] = useState(false);

  const handleFilteredCountChange = useCallback((count, filtrosActivos) => {
    setPendientesFiltrados(count);
    setHayFiltrosCards(!!filtrosActivos);
  }, []);

  useEffect(() => {
    const fetchRegistros = async () => {
      setIsLoading(true);
      try {
        const data = await registroDiarioService.getPanelOperaciones();
        setRegistros(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage("No se pudo cargar el panel de Operaciones.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegistros();
  }, []);

  useEffect(() => {
    if (auditoriaFeedback) {
      setFeedback(auditoriaFeedback);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#123498", "#F46F0B", "#10b981"],
      });

      setAuditoriaFeedback(null);
    }
  }, [auditoriaFeedback, setAuditoriaFeedback]);

  // SEPARACIÓN POR LA BANDERA DE OPERACIONES
  const pendientes = registros.filter(
    (r) => r.auditado_operaciones === false || r.auditado_operaciones === 0,
  );
  const auditados = registros.filter(
    (r) => r.auditado_operaciones === true || r.auditado_operaciones === 1,
  );

  const handleAuditar = (id) => {
    navigateToAuditoria(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
      <Toast
        message={feedback?.mensaje}
        type={feedback?.tipo}
        onClose={() => setFeedback(null)}
      />

      {/* Cabecera y Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-extrabold font-heading"
            style={{ color: COLOR_AZUL }}
          >
            Panel de <span style={{ color: COLOR_NARANJA }}>Operaciones</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Revisión logística de actividades diarias.
          </p>
        </div>

        {/* TABS Selector */}
        <div className="flex bg-white rounded-2xl p-1 border border-slate-200 shadow-sm shrink-0">
          <button
            onClick={() => setVistaActiva("pendientes")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              vistaActiva === "pendientes"
                ? "bg-slate-100 text-[#123498]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Sin Auditar (
            {hayFiltrosCards
              ? `${pendientesFiltrados} / ${pendientes.length}`
              : pendientes.length}
            )
          </button>
          <button
            onClick={() => setVistaActiva("auditados")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              vistaActiva === "auditados"
                ? "bg-slate-100 text-[#123498]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Historial ({auditados.length})
          </button>
        </div>
      </div>

      {/* Contenido (Cards o Tabla) */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#123498] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : errorMessage ? (
        <div className="text-red-500 text-center py-10 bg-red-50 rounded-2xl">
          {errorMessage}
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-2 duration-300">
          {vistaActiva === "pendientes" ? (
            <RegistroDiarioCards
              registros={pendientes}
              onViewDetails={(id) => {
                setRegistroSeleccionado(id);
                setModalOpen(true);
              }}
              onFilteredCountChange={handleFilteredCountChange}
            />
          ) : (
            <RegistroDiarioPanelTable
              registros={auditados}
              isLoading={false}
              area="operaciones"
              onEdit={(id) => navigateToAuditoria(id)}
            />
          )}
        </div>
      )}

      {/* MODAL DE DETALLE */}
      <RegistroDiarioDetalleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        registroId={registroSeleccionado}
        onAuditar={handleAuditar}
        area="operaciones"
      />
    </div>
  );
}
