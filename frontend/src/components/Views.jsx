import React, { useState } from 'react';
import SelectCustom from "./SelectCustom";

export const workers = [
  { id: 'u1', name: 'Carlos Martinez', area: 'Planeamiento', role: 'usuario' },
  { id: 'u2', name: 'Ana Torres', area: 'Comercial', role: 'usuario' },
  { id: 'u3', name: 'Luis Ramos', area: 'Operaciones', role: 'usuario' },
  { id: 'u4', name: 'Maria Salazar', area: 'Planeamiento', role: 'usuario' },
];

export const initialKpis = [
  { id: 'k1', name: 'Reportes enviados', area: 'Planeamiento', assigneeId: 'u1', target: 12, min: 8, max: 20, frequency: 'Diario', limitHour: '17:30', category: 'Productividad', active: true },
  { id: 'k2', name: 'Avance de iniciativas', area: 'Planeamiento', assigneeId: 'u1', target: 85, min: 70, max: 100, frequency: 'Semanal', limitHour: '18:00', category: 'Estrategia', active: true },
  { id: 'k3', name: 'Prospectos contactados', area: 'Comercial', assigneeId: 'u2', target: 25, min: 18, max: 40, frequency: 'Diario', limitHour: '17:00', category: 'Ventas', active: true },
  { id: 'k4', name: 'Ordenes procesadas', area: 'Operaciones', assigneeId: 'u3', target: 60, min: 45, max: 90, frequency: 'Diario', limitHour: '16:30', category: 'Operaciones', active: true },
  { id: 'k5', name: 'Cumplimiento documental', area: 'Planeamiento', assigneeId: 'u4', target: 95, min: 80, max: 100, frequency: 'Mensual', limitHour: '18:30', category: 'Calidad', active: true },
];

export const initialEntries = { k1: '12', k2: '0', k3: '', k4: '42', k5: '97' };

export const initialParticipation = {
  u1: { expected: 20, completed: 19 },
  u2: { expected: 20, completed: 0 },
  u3: { expected: 20, completed: 14 },
  u4: { expected: 20, completed: 20 },
};

export const initialNotifications = [
  { id: 1, worker: 'Ana Torres', type: 'KPI sin registrar', channel: 'Correo', time: '16:45', status: 'Enviado' },
  { id: 2, worker: 'Luis Ramos', type: 'Bajo rendimiento', channel: 'Alerta interna', time: '15:20', status: 'Pendiente' },
  { id: 3, worker: 'Carlos Martinez', type: 'Recordatorio hora limite', channel: 'Correo', time: '17:00', status: 'Enviado' },
];

// --- FUNCIONES HELPER ---
function getWorkerName(id) {
  return workers.find((worker) => worker.id === id)?.name ?? 'Sin asignar';
}

function getKpiStatus(kpi, value) {
  if (value === '') return { label: 'Sin registro', tone: 'red', color: 'bg-rojo-persa', score: 0 };
  const numberValue = Number(value);
  if (numberValue === 0) return { label: 'Registrado 0', tone: 'blue', color: 'bg-azul', score: 0 };
  if (numberValue >= kpi.target) return { label: 'Meta cumplida', tone: 'green', color: 'bg-turquesa', score: Math.round((numberValue / kpi.target) * 100) };
  if (numberValue >= kpi.min) return { label: 'Cerca del minimo', tone: 'yellow', color: 'bg-amarillo-hansa', score: Math.round((numberValue / kpi.target) * 100) };
  return { label: 'Bajo meta', tone: 'red', color: 'bg-rojo-persa', score: Math.round((numberValue / kpi.target) * 100) };
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// --- SUBCOMPONENTES ---
export function StatCard({ label, value, helper, accent = 'azul' }) {
  return (
    <div className="bg-white border border-azul/10 rounded-xl p-5 shadow-sm">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${accent === 'naranja' ? 'text-naranja' : 'text-azul'}`}>{label}</span>
      <strong className="block text-3xl font-extrabold text-azul-profundo mt-2">{value}</strong>
      <p className="text-xs text-gris-texto mt-1">{helper}</p>
    </div>
  );
}

export function StatusPill({ status }) {
  const styles = {
    red: 'bg-rojo-persa/10 text-rojo-persa border-rojo-persa/25',
    blue: 'bg-azul/10 text-azul border-azul/25',
    yellow: 'bg-amarillo-hansa/15 text-azul border-amarillo-hansa/40',
    green: 'bg-turquesa/15 text-azul border-turquesa/40',
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status.tone]}`}>
      <span className={`h-2 w-2 rounded-full ${status.color}`} />
      {status.label}
    </span>
  );
}

export function BarChart({ title, subtitle, data, valueSuffix = '%', color = 'naranja' }) {
  const maxValue = Math.max(100, ...data.map((item) => item.value));
  const chartHeight = 220;
  const barAreaHeight = 150;
  return (
    <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-azul-profundo">{title}</h3>
          {subtitle && <p className="text-sm text-gris-texto mt-1">{subtitle}</p>}
        </div>
        <span className="text-[10px] font-bold uppercase text-naranja bg-naranja/10 px-3 py-1 rounded-full w-fit">Grafico de barras</span>
      </div>
      <div className="w-full overflow-x-auto">
        <svg className="min-w-140 w-full" viewBox={`0 0 ${Math.max(560, data.length * 120)} ${chartHeight}`} role="img" aria-label={title}>
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = 24 + barAreaHeight - (tick / 100) * barAreaHeight;
            return (
              <g key={tick}>
                <line x1="48" x2={Math.max(520, data.length * 120) - 20} y1={y} y2={y} stroke="rgba(18, 52, 152, 0.08)" />
                <text x="12" y={y + 4} fontSize="10" fill="#A3A3A3">{tick}{valueSuffix}</text>
              </g>
            );
          })}
          {data.map((item, index) => {
            const slot = 120;
            const barWidth = 54;
            const x = 64 + index * slot;
            const height = Math.max(4, (item.value / maxValue) * barAreaHeight);
            const y = 24 + barAreaHeight - height;
            const fill = color === 'azul' ? '#123498' : index % 2 === 0 ? '#F46F0B' : '#096ACC';
            return (
              <g key={item.label}>
                <rect x={x} y={y} width={barWidth} height={height} rx="6" fill={fill} />
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="#123498">{item.value}{valueSuffix}</text>
                <text x={x + barWidth / 2} y="198" textAnchor="middle" fontSize="11" fill="#123498">{item.label.length > 13 ? `${item.label.slice(0, 12)}.` : item.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function KpiTable({ kpis, entries }) {
  return (
    <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-bold text-azul-profundo mb-4">Estado consolidado de KPIs</h3>
      <table className="w-full min-w-190 text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-gris-texto border-b border-azul/10">
            <th className="py-3">KPI</th>
            <th>Area</th>
            <th>Trabajador</th>
            <th>Valor</th>
            <th>Meta</th>
            <th>Cumplimiento</th>
            <th>Semaforo</th>
          </tr>
        </thead>
        <tbody>
          {kpis.map((kpi) => {
            const value = entries[kpi.id] ?? '';
            const status = kpi.status ?? getKpiStatus(kpi, value);
            return (
              <tr key={kpi.id} className="border-b border-azul/5">
                <td className="py-3 font-bold text-azul-profundo">{kpi.name}</td>
                <td>{kpi.area}</td>
                <td>{getWorkerName(kpi.assigneeId)}</td>
                <td>{value === '' ? 'Vacio' : value}</td>
                <td>{kpi.target}</td>
                <td>{status.score}%</td>
                <td><StatusPill status={status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- VISTAS PRINCIPALES ---
export function DashboardView({ kpis, entries, userRole }) {
  const activeKpis = kpis.filter((kpi) => kpi.active);
  const summary = activeKpis.map((kpi) => ({ ...kpi, status: getKpiStatus(kpi, entries[kpi.id] ?? '') }));
  const completion = Math.round((summary.filter((item) => entries[item.id] !== '').length / summary.length) * 100);
  const averageScore = Math.round(summary.reduce((total, item) => total + Math.min(item.status.score, 120), 0) / summary.length);
  const pending = summary.filter((item) => item.status.tone === 'red' && entries[item.id] === '').length;
  const byArea = Object.values(summary.reduce((acc, item) => {
    acc[item.area] ??= { area: item.area, total: 0, score: 0 };
    acc[item.area].total += 1;
    acc[item.area].score += Math.min(item.status.score, 120);
    return acc;
  }, {})).map((area) => ({ ...area, score: Math.round(area.score / area.total) }));
  const byWorker = workers.map((worker) => {
    const assigned = summary.filter((item) => item.assigneeId === worker.id);
    const score = assigned.length ? Math.round(assigned.reduce((total, item) => total + Math.min(item.status.score, 120), 0) / assigned.length) : 0;
    return { label: worker.name.split(' ')[0], value: score };
  });
  const areaChartData = byArea.map((area) => ({ label: area.area, value: area.score }));

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Cumplimiento general" value={`${averageScore || 0}%`} helper="Promedio calculado con valores registrados" />
        <StatCard label="Participacion de llenado" value={`${completion || 0}%`} helper="KPIs completados frente a los esperados" accent="naranja" />
        <StatCard label="Pendientes del dia" value={pending} helper="Registros vacios marcados en rojo" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-azul-profundo">Dashboard y comparativas</h3>
              <p className="text-sm text-gris-texto">Vista {userRole === 'admin' ? 'global por area y trabajador' : 'restringida al equipo asignado'}.</p>
            </div>
            <span className="text-[10px] font-bold uppercase text-naranja bg-naranja/10 px-3 py-1 rounded-full">Tiempo real simulado</span>
          </div>
          <div className="space-y-4">
            {byArea.map((area) => (
              <div key={area.area}>
                <div className="flex justify-between text-xs font-bold text-azul-profundo mb-1">
                  <span>{area.area}</span>
                  <span>{area.score}%</span>
                </div>
                <div className="h-3 rounded-full bg-azul/10 overflow-hidden">
                  <div className="h-full rounded-full bg-naranja" style={{ width: `${Math.min(area.score, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-azul-profundo">Comparativas</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between rounded-lg bg-azul/5 px-4 py-3 text-sm">
              <span>Trabajador vs trabajador</span>
              <strong className="text-naranja">Activo</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-azul/5 px-4 py-3 text-sm">
              <span>Area vs area</span>
              <strong className="text-naranja">Activo</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BarChart title="Cumplimiento por area" subtitle="Promedio reportado frente a metas." data={areaChartData} />
        <BarChart title="Trabajador vs trabajador" subtitle="Comparativa del cumplimiento." data={byWorker} color="azul" />
      </div>
      <KpiTable kpis={summary} entries={entries} />
    </section>
  );
}

export function DailyView({ kpis, entries, setEntries, userRole, addNotification }) {
  const visibleKpis = userRole === 'usuario' ? kpis.filter((kpi) => kpi.assigneeId === 'u1' && kpi.active) : kpis.filter((kpi) => kpi.active);
  const submitDaily = () => {
    const emptyCount = visibleKpis.filter((kpi) => (entries[kpi.id] ?? '') === '').length;
    addNotification({ worker: userRole === 'usuario' ? 'Carlos Martinez' : 'Equipo KPI', type: emptyCount ? `${emptyCount} KPI sin registrar` : 'Registro diario completado', channel: 'Alerta interna', status: emptyCount ? 'Pendiente' : 'Enviado' });
  };
  return (
    <section className="space-y-6">
      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-[10px] bg-naranja/10 text-naranja px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Modulo 2</span>
            <h3 className="text-xl font-bold text-azul-profundo mt-3">Ingreso diario de KPIs</h3>
          </div>
          <button onClick={submitDaily} className="bg-naranja hover:bg-naranja-oscuro text-white text-sm font-bold px-5 py-3 rounded-lg transition-colors">Guardar registro diario</button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gris-texto border-b border-azul/10">
                <th className="py-3">KPI asignado</th>
                <th>Trabajador</th>
                <th>Meta</th>
                <th>Valor reportado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibleKpis.map((kpi) => {
                const value = entries[kpi.id] ?? '';
                const status = getKpiStatus(kpi, value);
                return (
                  <tr key={kpi.id} className="border-b border-azul/5">
                    <td className="py-4 font-bold text-azul-profundo">{kpi.name}</td>
                    <td>{getWorkerName(kpi.assigneeId)}</td>
                    <td>{kpi.target}</td>
                    <td>
                      <input type="number" value={value} onChange={(event) => setEntries((current) => ({ ...current, [kpi.id]: event.target.value }))} className="w-28 rounded-lg border border-azul/15 bg-azul/5 px-3 py-2 text-azul-profundo outline-none focus:border-azul" placeholder="Vacio" />
                    </td>
                    <td><StatusPill status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function SettingsView({ kpis, setKpis }) {
  const [form, setForm] = useState({ name: '', area: 'Planeamiento', assigneeId: 'u1', target: 80, min: 60, max: 100, frequency: 'Diario', limitHour: '17:30', category: 'Productividad' });
  const createKpi = (event) => {
    event.preventDefault();
    setKpis((current) => [...current, { ...form, id: `k${Date.now()}`, target: Number(form.target), min: Number(form.min), max: Number(form.max), active: true }]);
    setForm((current) => ({ ...current, name: '' }));
  };
  const updateKpi = (id, field, value) => setKpis((current) => current.map((kpi) => (kpi.id === id ? { ...kpi, [field]: value } : kpi)));
  return (
    <section className="space-y-6">
      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-azul-profundo mt-3">Configuracion general de KPIs</h3>
        <form onSubmit={createKpi} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del KPI" className="rounded-lg border border-azul/15 px-3 py-2 text-sm" />
          <SelectCustom value={form.assigneeId} onChange={(v) => setForm({ ...form, assigneeId: v })} options={workers.map((w) => ({ value: w.id, label: w.name }))} />
          <input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="rounded-lg border border-azul/15 px-3 py-2 text-sm" />
          <button className="bg-naranja hover:bg-naranja-oscuro text-white rounded-lg px-4 py-2 text-sm font-bold">Crear KPI</button>
        </form>
      </div>
      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm overflow-x-auto">
        <table className="w-full min-w-225 text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-gris-texto border-b border-azul/10">
              <th className="py-3">Indicador</th>
              <th>Meta</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi) => (
              <tr key={kpi.id} className="border-b border-azul/5">
                <td className="py-3 font-bold text-azul-profundo">{kpi.name}</td>
                <td><input type="number" value={kpi.target} onChange={(e) => updateKpi(kpi.id, 'target', Number(e.target.value))} className="w-20 rounded border border-azul/10 px-2 py-1" /></td>
                <td>
                  <button onClick={() => updateKpi(kpi.id, 'active', !kpi.active)} className={`rounded-full px-3 py-1 text-xs font-bold ${kpi.active ? 'bg-turquesa/15 text-azul' : 'bg-rojo-persa/10 text-rojo-persa'}`}>
                    {kpi.active ? 'Si' : 'No'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReportsView({ kpis, entries, participation, notifications, addNotification }) {
  const ranking = workers.map((worker) => {
  const data = participation?.[worker.id] || {
    completed: 0,
    expected: 1
  };

  const rate = Math.round((data.completed / data.expected) * 100);

  return {
    ...worker,
    rate,
    completed: data.completed,
    expected: data.expected
  };
}).sort((a, b) => b.rate - a.rate);
  const participationChartData = ranking.map((worker) => ({ label: worker.name.split(' ')[0], value: worker.rate }));
  const exportRows = [['Trabajador', 'Area', 'Participacion', 'Completados', 'Esperados'], ...ranking.map((w) => [w.name, w.area, `${w.rate}%`, w.completed, w.expected])];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Mayor participacion" value={`${ranking[0].rate}%`} helper={ranking[0].name} />
        <StatCard label="Participacion nula" value={ranking.filter((w) => w.rate === 0).length} helper="Colaboradores con 0%" accent="naranja" />
        <StatCard label="Notificaciones" value={notifications.length} helper="Historial de alertas" />
      </div>
      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold text-azul-profundo mt-3">Auditoria y exportacion</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadCsv('participacion.csv', exportRows)} className="bg-azul hover:bg-azul-profundo text-white rounded-lg px-4 py-2 text-sm font-bold">Exportar CSV</button>
          </div>
        </div>
      </div>
      <BarChart title="Participacion por colaborador" subtitle="Registros completados." data={participationChartData} />
      <KpiTable kpis={kpis.map((kpi) => ({ ...kpi, status: getKpiStatus(kpi, entries[kpi.id] ?? '') }))} entries={entries} />
    </section>
  );
}