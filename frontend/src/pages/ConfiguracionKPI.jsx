// pages/ConfiguracionKPI.jsx
// ─────────────────────────────────────────────────────────────────────────────
// CAMBIOS vs versión anterior:
//   1. CERO datos mockeados — useEffect usaba setAreas/setKpis/setCampos hardcoded
//      Ahora todo viene de kpiService (getAreas → getKpisPorArea → getConfiguracion)
//   2. handleAreaChange y handleKpiChange llaman al backend real
//   3. handleSubmit llama a kpiService.saveConfiguracion con el prefijo correcto
//   4. Tooltip de fórmula original portado desde configuracion.html
//   5. toggleFormula: al cambiar origen a no-calculado limpia la fórmula
//      (mismo comportamiento que el HTML original)
//   6. Estados de loading/error con feedback visual
//   7. Spinner en carga de campos
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { kpiService } from '../services/kpiService';

export default function ConfiguracionKPI() {
  const [areas, setAreas] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [campos, setCampos] = useState([]);
  const [formulaOriginal, setFormulaOriginal] = useState('');

  const [selectedArea, setSelectedArea] = useState('');
  const [selectedKpi, setSelectedKpi] = useState('');

  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { tipo: 'ok'|'error', mensaje }

  // ── 1. Cargar áreas reales al montar ───────────────────────────────────
  useEffect(() => {
    setIsLoadingAreas(true);
    kpiService
      .getAreas()
      .then((data) => setAreas(data))
      .catch(() =>
        setFeedback({ tipo: 'error', mensaje: 'No se pudieron cargar las áreas.' })
      )
      .finally(() => setIsLoadingAreas(false));
  }, []);

  // ── 2. Al cambiar área → cargar KPIs reales ────────────────────────────
  const handleAreaChange = async (e) => {
    const areaId = e.target.value;
    setSelectedArea(areaId);
    setSelectedKpi('');
    setCampos([]);
    setFormulaOriginal('');
    setFeedback(null);
    setKpis([]);

    if (!areaId) return;
    try {
      const data = await kpiService.getKpisPorArea(areaId);
      setKpis(data);
    } catch {
      setFeedback({ tipo: 'error', mensaje: 'Error al cargar los KPIs del área.' });
    }
  };

  // ── 3. Al cambiar KPI → traer configuración real ───────────────────────
  const handleKpiChange = async (e) => {
    const kpiId = e.target.value;
    setSelectedKpi(kpiId);
    setCampos([]);
    setFormulaOriginal('');
    setFeedback(null);

    if (!kpiId) return;

    setIsLoadingCampos(true);
    try {
      // Llama a GET /api/kpis/configuracion/{kpiId}
      const data = await kpiService.getConfiguracion(kpiId);
      setFormulaOriginal(data.formula_original || 'N/A');
      setCampos(data.campos || []);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al cargar la configuración del KPI.';
      setFeedback({ tipo: 'error', mensaje: msg });
    } finally {
      setIsLoadingCampos(false);
    }
  };

  // ── 4. Actualizar un campo localmente (origen o fórmula) ───────────────
  const updateCampo = (index, field, value) => {
    setCampos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Si cambia de 'calculado' a otro origen → limpiar la fórmula
      if (field === 'origen' && value !== 'calculado') {
        updated[index].formula_personalizada = '';
      }
      return updated;
    });
  };

  // ── 5. Guardar configuración en el backend ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        campos: campos.map((c) => ({
          id: c.id,
          origen: c.origen,
          formula_personalizada: c.origen === 'calculado' ? c.formula_personalizada : '',
        })),
      };
      const result = await kpiService.saveConfiguracion(selectedKpi, payload);
      setFeedback({
        tipo: 'ok',
        mensaje: result.message || '✅ Configuración guardada exitosamente.',
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al guardar la configuración.';
      setFeedback({ tipo: 'error', mensaje: `❌ ${msg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Etiqueta visual del origen ─────────────────────────────────────────
  const origenBadge = (origen) => {
    const map = {
      usuario: { label: 'Usuario', cls: 'bg-green-100 text-green-700' },
      calculado: { label: 'Calculado', cls: 'bg-blue-100 text-blue-700' },
      sistema: { label: 'Sistema', cls: 'bg-gray-100 text-gray-500' },
    };
    const { label, cls } = map[origen] || map.sistema;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cls}`}>{label}</span>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-azul/10 p-6 md:p-10">
      {/* Encabezado */}
      <div className="mb-8 border-b border-azul/10 pb-4">
        <span className="text-[10px] bg-azul/10 text-azul px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
          Módulo 3
        </span>
        <h2 className="text-2xl font-bold text-azul-profundo mt-3">
          ⚙️ Modelador de KPIs (Mini Excel)
        </h2>
        <p className="text-sm text-gris-texto mt-1">
          Define qué campos llena el usuario y cuáles calcula el sistema automáticamente.
        </p>
      </div>

      {/* Feedback global */}
      {feedback && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium border ${
            feedback.tipo === 'ok'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.mensaje}
        </div>
      )}

      {/* Selectores encadenados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-azul-profundo mb-2">
            1. Selecciona el Área
          </label>
          <select
            className="w-full rounded-lg border border-azul/15 px-4 py-2.5 outline-none focus:border-azul disabled:bg-gray-50"
            value={selectedArea}
            onChange={handleAreaChange}
            disabled={isLoadingAreas}
          >
            <option value="">{isLoadingAreas ? 'Cargando...' : '-- Seleccionar --'}</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-azul-profundo mb-2">
            2. Selecciona el KPI a configurar
          </label>
          <select
            className="w-full rounded-lg border border-azul/15 px-4 py-2.5 outline-none focus:border-azul disabled:bg-gray-50"
            value={selectedKpi}
            onChange={handleKpiChange}
            disabled={!selectedArea || kpis.length === 0}
          >
            <option value="">-- Seleccionar --</option>
            {kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spinner de carga */}
      {isLoadingCampos && (
        <div className="text-center py-10 text-gris-texto text-sm">
          <span className="animate-spin inline-block mr-2">⏳</span>
          Cargando configuración del KPI...
        </div>
      )}

      {/* Fórmula original del Excel */}
      {!isLoadingCampos && campos.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-turquesa/10 border-l-4 border-turquesa p-4 rounded-r-lg text-sm text-azul-profundo">
            <strong>💡 Fórmula sugerida por el Excel:</strong>{' '}
            <code className="font-mono text-xs bg-white/60 px-1.5 py-0.5 rounded">
              {formulaOriginal}
            </code>
            <span className="block mt-1.5 text-xs opacity-70">
              Tip: Copia las variables exactas entre corchetes para usarlas en las fórmulas
              de abajo. Ej: <code>[Nombre del campo]</code>
            </span>
          </div>

          {/* Tabla Mini Excel */}
          <div className="overflow-x-auto border border-azul/10 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-azul/5 text-azul-profundo text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3 w-1/3">Nombre del Campo (Excel)</th>
                  <th className="px-4 py-3 w-1/4">¿Quién lo llena? (Origen)</th>
                  <th className="px-4 py-3">Fórmula Personalizada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-azul/5">
                {campos.map((c, index) => (
                  <tr key={c.id} className="hover:bg-azul/5 transition-colors">
                    {/* Nombre del campo */}
                    <td className="px-4 py-3">
                      <strong className="text-azul-profundo block">
                        [{c.campo_label}]
                      </strong>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-gris-texto/20 text-gris-oscuro px-2 py-0.5 rounded">
                          {c.campo_key}
                        </span>
                        {origenBadge(c.origen)}
                      </div>
                    </td>

                    {/* Selector de origen */}
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded border border-azul/15 px-2 py-1.5 outline-none focus:border-azul text-sm"
                        value={c.origen}
                        onChange={(e) => updateCampo(index, 'origen', e.target.value)}
                      >
                        <option value="usuario">✍️ Usuario teclea</option>
                        <option value="calculado">🧮 Fórmula (Sistema)</option>
                        <option value="sistema">🔒 Solo Lectura</option>
                      </select>
                    </td>

                    {/* Input de fórmula — solo visible si origen === 'calculado' */}
                    <td className="px-4 py-3">
                      {c.origen === 'calculado' ? (
                        <input
                          type="text"
                          placeholder="Ej: ([Numerador] / [Denominador])"
                          className="w-full rounded border border-azul/15 px-3 py-1.5 outline-none focus:border-azul font-mono text-xs"
                          value={c.formula_personalizada || ''}
                          onChange={(e) =>
                            updateCampo(index, 'formula_personalizada', e.target.value)
                          }
                        />
                      ) : (
                        <span className="text-xs text-gris-texto italic">
                          {c.origen === 'sistema' ? 'Solo lectura' : 'El usuario ingresa el valor'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-azul hover:bg-azul-profundo text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin">⏳</span> Guardando...
              </span>
            ) : (
              '💾 Guardar Configuración'
            )}
          </button>
        </form>
      )}

      {/* Estado vacío */}
      {!isLoadingCampos && !selectedKpi && (
        <div className="text-center py-12 text-gris-texto text-sm">
          <p className="text-4xl mb-3">⚙️</p>
          <p>Selecciona un área y un KPI para comenzar a configurar.</p>
        </div>
      )}
    </div>
  );
}