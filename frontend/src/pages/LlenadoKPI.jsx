// pages/LlenadoKPI.jsx
// ─────────────────────────────────────────────────────────────────────────────
// CAMBIOS vs versión anterior:
//   1. CERO datos mockeados — todo viene de kpiService
//   2. Motor matemático de 4 pases portado 1:1 desde registro.html:
//      - Lee c.origen === 'calculado' y c.formula_personalizada
//      - Reemplaza [Variable] por el valor numérico del contexto
//      - Resuelve dependencias anidadas (4 pases)
//      - Maneja canCalculate: si un operando es null → no evalúa
//   3. Semáforo basado en el valor de Cumplimiento (igual que el HTML)
//   4. Autocompletado de meta_valor, meta_produccion, horas_planificadas
//   5. Campos 'sistema' también se muestran en el panel de resultados
//   6. El submit recoge TODOS los campos (usuario + calculados + sistema)
//      para que el backend pueda extraer alerta, cumplimiento, etc.
//   7. Estados de carga y error con feedback visual
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { kpiService } from '../services/kpiService';

// ── Semáforo ──────────────────────────────────────────────────────────────────
function SemaforoDisplay({ cumplimiento }) {
  if (cumplimiento === null || cumplimiento === undefined || isNaN(cumplimiento)) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-gray-400">
        ⚪ Sin calcular
      </span>
    );
  }
  if (cumplimiento >= 0.80) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-green-700">
        🟢 Verde (Óptimo)
      </span>
    );
  }
  if (cumplimiento >= 0.60) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-yellow-700">
        🟡 Amarillo (Problemas)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-bold text-red-700">
      🔴 Rojo (Peligro)
    </span>
  );
}

// ── Formateador de resultados ─────────────────────────────────────────────────
function formatearValor(label, valor) {
  if (valor === null || valor === undefined || valor === '') return '-';
  const lbl = label.toLowerCase();
  if (
    lbl.includes('cumplimiento') ||
    lbl.includes('eficiencia') ||
    lbl.includes('eficacia') ||
    lbl.includes('efectividad') ||
    lbl.includes('rendimiento') ||
    lbl.includes('productividad')
  ) {
    return (parseFloat(valor) * 100).toFixed(2) + '%';
  }
  const num = parseFloat(valor);
  return isNaN(num) ? String(valor) : num.toFixed(2);
}

// ── Motor matemático (portado 1:1 desde registro.html) ────────────────────────
/**
 * Recibe la lista de campos y el objeto de valores actuales.
 * Devuelve un nuevo objeto `contexto` con todos los campos resueltos,
 * incluidos los calculados (tras hasta 4 pases para dependencias anidadas).
 */
function ejecutarMotor(campos, valores) {
  // Paso 1: construir contexto inicial con los valores crudos del usuario
  let contexto = {};
  campos.forEach((c) => {
    const raw = valores[c.campo_key];
    if (c.tipo === 'texto') {
      contexto[c.campo_label] = raw ?? '';
    } else {
      contexto[c.campo_label] =
        raw === '' || raw === undefined || raw === null ? null : parseFloat(raw);
    }
  });

  // Paso 2: 4 pases para resolver dependencias anidadas
  for (let pase = 1; pase <= 4; pase++) {
    campos.forEach((c) => {
      if (c.origen !== 'calculado' || !c.formula_personalizada) return;

      let formula = c.formula_personalizada;
      let canCalculate = true;

      // Reemplazar [Variable] por su valor numérico del contexto
      for (const [label, value] of Object.entries(contexto)) {
        // Escapar caracteres especiales de regex dentro del label
        const safeLabel = label.replace(/[\[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(`\\[${safeLabel}\\]`, 'g');

        if (formula.match(regex) && (value === null || value === undefined)) {
          canCalculate = false;
        }
        formula = formula.replace(regex, value !== null && value !== undefined ? value : 0);
      }

      if (canCalculate) {
        try {
          // eslint-disable-next-line no-eval
          const resultado = eval(formula); // Mismo comportamiento que el prototipo HTML
          if (!isNaN(resultado) && isFinite(resultado)) {
            contexto[c.campo_label] = resultado;
          } else {
            contexto[c.campo_label] = null;
          }
        } catch (_) {
          contexto[c.campo_label] = null;
        }
      } else {
        contexto[c.campo_label] = null;
      }
    });
  }

  return contexto;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LlenadoKPI() {
  const [areas, setAreas] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [campos, setCampos] = useState([]);

  const [selectedArea, setSelectedArea] = useState('');
  const [selectedKpi, setSelectedKpi] = useState('');

  // valores: { campo_key: string } — siempre strings del input
  const [valores, setValores] = useState({});
  // contexto resuelto por el motor (con las fórmulas evaluadas)
  const [contexto, setContexto] = useState({});

  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isLoadingCampos, setIsLoadingCampos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { tipo: 'ok'|'error', mensaje: string }

  // ── 1. Cargar áreas reales ──────────────────────────────────────────────
  useEffect(() => {
    setIsLoadingAreas(true);
    kpiService
      .getAreas()
      .then((data) => setAreas(data))
      .catch(() => setFeedback({ tipo: 'error', mensaje: 'No se pudieron cargar las áreas.' }))
      .finally(() => setIsLoadingAreas(false));
  }, []);

  // ── 2. Al cambiar área → cargar KPIs ───────────────────────────────────
  const handleAreaChange = async (e) => {
    const areaId = e.target.value;
    setSelectedArea(areaId);
    setSelectedKpi('');
    setCampos([]);
    setValores({});
    setContexto({});
    setFeedback(null);
    setKpis([]);

    if (!areaId) return;
    try {
      const data = await kpiService.getKpisPorArea(areaId);
      setKpis(data);
    } catch {
      setFeedback({ tipo: 'error', mensaje: 'No se pudieron cargar los KPIs del área.' });
    }
  };

  // ── 3. Al cambiar KPI → cargar campos y autocompletar metas ────────────
  const handleKpiChange = async (e) => {
    const kpiId = e.target.value;
    setSelectedKpi(kpiId);
    setCampos([]);
    setValores({});
    setContexto({});
    setFeedback(null);

    if (!kpiId) return;

    setIsLoadingCampos(true);
    try {
      const res = await kpiService.getCamposKpi(kpiId);
      const dataCampos = res.campos || [];
      const meta = res.kpi_meta;

      // Autocompletar valores de metas/horas según campo_label (igual que registro.html)
      const valoresIniciales = {};
      dataCampos.forEach((c) => {
        const lbl = c.campo_label.toLowerCase();
        let prefill = '';
        if (meta) {
          if (lbl.includes('meta kpi') && meta.meta_valor !== null && meta.meta_valor !== undefined)
            prefill = String(meta.meta_valor);
          else if (
            (lbl.includes('meta producción') || lbl.includes('meta produccion')) &&
            meta.meta_produccion !== null &&
            meta.meta_produccion !== undefined
          )
            prefill = String(meta.meta_produccion);
          else if (
            lbl.includes('horas planificadas') &&
            meta.horas_planificadas !== null &&
            meta.horas_planificadas !== undefined
          )
            prefill = String(meta.horas_planificadas);
        }
        valoresIniciales[c.campo_key] = prefill;
      });

      setCampos(dataCampos);
      setValores(valoresIniciales);
    } catch {
      setFeedback({ tipo: 'error', mensaje: 'No se pudieron cargar los campos del KPI.' });
    } finally {
      setIsLoadingCampos(false);
    }
  };

  // ── 4. Motor matemático en tiempo real ─────────────────────────────────
  // Se dispara cada vez que el usuario tipea o cambia un campo
  useEffect(() => {
    if (campos.length === 0) return;
    const nuevoContexto = ejecutarMotor(campos, valores);
    setContexto(nuevoContexto);
  }, [valores, campos]);

  // ── 5. Manejo de cambios en inputs de usuario ───────────────────────────
  const handleChange = useCallback(
    (e) => {
      setValores((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    []
  );

  // ── 6. Calcular el valor de Cumplimiento para el Semáforo ───────────────
  const cumplimientoValue = (() => {
    for (const key of Object.keys(contexto)) {
      if (key.toLowerCase().includes('cumplimiento')) return contexto[key];
    }
    return null;
  })();

  // ── 7. Renderizar el valor en el panel de resultados ────────────────────
  const renderResultado = (c) => {
    const lbl = c.campo_label.toLowerCase();
    // Campo de alerta/semáforo → usa SemaforoDisplay
    if (lbl.includes('alerta') || lbl.includes('semáforo') || lbl.includes('semaforo')) {
      return <SemaforoDisplay cumplimiento={cumplimientoValue} />;
    }
    const val = contexto[c.campo_label];
    return (
      <span className="font-bold text-azul">
        {formatearValor(c.campo_label, val)}
      </span>
    );
  };

  // ── 8. Submit: recopila TODOS los campos (usuario + calculados + sistema)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    // Construir el payload de valores combinando inputs del usuario
    // y los resultados calculados por el motor (para que el backend
    // pueda extraer cumplimiento, eficiencia, alerta, etc.)
    const valoresCompletos = {};
    campos.forEach((c) => {
      const valMotor = contexto[c.campo_label];
      if (c.origen === 'usuario') {
        valoresCompletos[c.campo_key] = valores[c.campo_key] ?? '';
      } else if (valMotor !== null && valMotor !== undefined) {
        valoresCompletos[c.campo_key] = valMotor;
      } else {
        valoresCompletos[c.campo_key] = valores[c.campo_key] ?? '';
      }
    });

    try {
      const payload = {
        kpi_id: parseInt(selectedKpi),
        valores: valoresCompletos,
      };
      const res = await kpiService.registrarValores(payload);
      setFeedback({
        tipo: 'ok',
        mensaje: `✅ Registro guardado exitosamente. Semáforo: ${(res.alerta || 'gris').toUpperCase()}`,
      });
      // Reset del formulario manteniendo las metas autocompletadas
      const valoresReset = {};
      campos.forEach((c) => {
        const lbl = c.campo_label.toLowerCase();
        const meta = res.kpi_meta; // puede no venir en la respuesta; usamos el contexto actual
        valoresReset[c.campo_key] =
          lbl.includes('meta') || lbl.includes('horas planificadas')
            ? valores[c.campo_key]
            : '';
      });
      setValores(valoresReset);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al guardar datos. Intenta nuevamente.';
      setFeedback({ tipo: 'error', mensaje: `❌ ${msg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Campos a mostrar en cada sección ────────────────────────────────────
  const camposUsuario = campos.filter((c) => c.origen === 'usuario');
  const camposResultado = campos.filter(
    (c) =>
      c.origen === 'calculado' ||
      c.origen === 'sistema' ||
      c.campo_label.toLowerCase().includes('semáforo') ||
      c.campo_label.toLowerCase().includes('semaforo') ||
      c.campo_label.toLowerCase().includes('alerta')
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-azul/10 p-6 md:p-10">
      {/* Encabezado */}
      <div className="mb-8 border-b border-azul/10 pb-4">
        <h2 className="text-2xl font-bold text-azul-profundo mt-3">
          📝 Registrar Valores de KPI
        </h2>
        <p className="text-sm text-gris-texto mt-1">
          Los campos calculados se actualizan en tiempo real mientras escribes.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selectores encadenados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-black uppercase text-azul-profundo mb-2">
              1. Selecciona el Área
            </label>
            <select
              className="w-full rounded border border-azul/15 px-4 py-2 focus:outline-none focus:border-azul disabled:bg-gray-100"
              value={selectedArea}
              onChange={handleAreaChange}
              disabled={isLoadingAreas}
              required
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
            <label className="block text-[11px] font-black uppercase text-azul-profundo mb-2">
              2. Selecciona el KPI
            </label>
            <select
              className="w-full rounded border border-azul/15 px-4 py-2 focus:outline-none focus:border-azul disabled:bg-gray-100"
              value={selectedKpi}
              onChange={handleKpiChange}
              disabled={!selectedArea || kpis.length === 0}
              required
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

        {/* Spinner de carga de campos */}
        {isLoadingCampos && (
          <div className="text-center py-8 text-gris-texto text-sm">
            <span className="animate-spin inline-block mr-2">⏳</span>
            Cargando campos del KPI...
          </div>
        )}

        {/* Cuerpo del formulario — solo cuando hay campos */}
        {!isLoadingCampos && campos.length > 0 && (
          <div className="mt-8 space-y-8">
            {/* Sección: Campos que llena el usuario */}
            {camposUsuario.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-azul-profundo mb-4 border-b-2 border-azul inline-block pb-1">
                  Campos a rellenar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {camposUsuario.map((c) => {
                    const lbl = c.campo_label.toLowerCase();
                    const esTextoLargo =
                      lbl.includes('observaciones') || lbl.includes('acciones');
                    return (
                      <div key={c.id} className={esTextoLargo ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-semibold mb-1.5">
                          ✍️ {c.campo_label}
                          {c.es_requerido && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {esTextoLargo ? (
                          <textarea
                            name={c.campo_key}
                            value={valores[c.campo_key] || ''}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded border border-azul/15 px-4 py-2 outline-none focus:border-azul resize-none text-sm"
                          />
                        ) : (
                          <input
                            type={c.tipo === 'numero' ? 'number' : 'text'}
                            step="any"
                            name={c.campo_key}
                            value={valores[c.campo_key] || ''}
                            onChange={handleChange}
                            required={c.es_requerido}
                            className="w-full rounded border border-azul/15 px-4 py-2 outline-none focus:border-azul text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sección: Resultados calculados en tiempo real */}
            {camposResultado.length > 0 && (
              <div className="bg-blue-50 border-l-4 border-azul p-5 rounded-r-xl">
                <h4 className="text-sm font-bold text-azul-profundo mb-4">
                  📊 Resultados Calculados{' '}
                  <span className="text-xs font-normal text-gris-texto ml-1">
                    (se actualizan al escribir)
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {camposResultado.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center text-sm bg-white/60 px-3 py-2 rounded-lg"
                    >
                      <strong className="text-gray-700 mr-2">{c.campo_label}:</strong>
                      {renderResultado(c)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-azul hover:bg-azul-profundo text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Guardando...
                </span>
              ) : (
                'Guardar Registro'
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}