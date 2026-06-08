import { useState, useEffect } from "react";
import { kpiService } from "../services/kpiService";

export default function EscogerKPI() {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");

  const [kpisData, setKpisData] = useState(null); // Guardará la respuesta del endpoint /semanales
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // 1. Cargar áreas al inicio
  useEffect(() => {
    kpiService
      .getAreas()
      .then(setAreas)
      .catch(() =>
        setFeedback({ tipo: "error", mensaje: "Error al cargar áreas" }),
      );
  }, []);

  // 2. Cargar KPIs cuando se selecciona un área
  const handleAreaChange = async (e) => {
    const areaId = e.target.value;
    setSelectedArea(areaId);
    setKpisData(null);
    setFeedback(null);

    if (!areaId) return;

    setLoading(true);
    try {
      const data = await kpiService.getKpisSemanales(areaId);
      setKpisData(data);
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: "Error al cargar los KPIs del área",
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Activar/Desactivar KPI
  const handleToggle = async (kpiId, actualEstado) => {
    // Si queremos activar y ya hay 3, prevenimos desde el frontend (el backend también lo bloquea)
    if (!actualEstado && kpisData.activos_count >= kpisData.max_activos) {
      setFeedback({
        tipo: "error",
        mensaje: `Máximo ${kpisData.max_activos} KPIs permitidos por semana.`,
      });
      return;
    }

    try {
      setFeedback(null);
      await kpiService.activarKpi(kpiId);

      // Recargar la lista para tener el conteo y estados actualizados
      const data = await kpiService.getKpisSemanales(selectedArea);
      setKpisData(data);
      setFeedback({
        tipo: "ok",
        mensaje: "✅ Estado actualizado correctamente.",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "Error al cambiar estado del KPI";
      setFeedback({ tipo: "error", mensaje: `❌ ${msg}` });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-azul-profundo">
          🎯 Selección de KPIs Semanales
        </h2>
        <p className="text-sm text-gray-500">
          Habilita un máximo de 3 KPIs por área para que el equipo los llene
          esta semana.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium border ${feedback.tipo === "ok" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          {feedback.mensaje}
        </div>
      )}

      {/* Selector de Área */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-azul-profundo mb-2">
          Selecciona el Área a configurar
        </label>
        <select
          className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-azul"
          value={selectedArea}
          onChange={handleAreaChange}
        >
          <option value="">-- Seleccionar --</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de KPIs */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          ⏳ Cargando KPIs...
        </div>
      ) : kpisData ? (
        <div>
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
            <span className="font-semibold text-azul-profundo">
              KPIs Activos esta semana:
            </span>
            <span
              className={`text-lg font-bold px-3 py-1 rounded-full ${kpisData.activos_count === kpisData.max_activos ? "bg-green-100 text-green-700" : "bg-white text-azul"}`}
            >
              {kpisData.activos_count} / {kpisData.max_activos}
            </span>
          </div>

          <div className="space-y-3">
            {kpisData.kpis.map((kpi) => (
              <div
                key={kpi.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${kpi.activo_semanal ? "border-green-300 bg-green-50/50" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <div>
                  <h4 className="font-bold text-gray-800">{kpi.nombre}</h4>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    {kpi.formula_texto || "Sin fórmula"}
                  </p>
                </div>

                {/* Botón Toggle */}
                <button
                  onClick={() => handleToggle(kpi.id, kpi.activo_semanal)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${kpi.activo_semanal ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${kpi.activo_semanal ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            ))}

            {kpisData.kpis.length === 0 && (
              <div className="text-center py-8 text-gray-500 italic">
                No hay KPIs registrados en esta área.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
