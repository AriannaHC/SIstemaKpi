import { useMemo, useState } from 'react';
import LoginPage from './components/componentes/LoginPage';
import Sidebar from './components/componentes/Sidebar';
import Header from './components/componentes/Header';

const workers = [
  { id: 'u1', name: 'Carlos Martinez', area: 'Planeamiento', role: 'usuario' },
  { id: 'u2', name: 'Ana Torres', area: 'Comercial', role: 'usuario' },
  { id: 'u3', name: 'Luis Ramos', area: 'Operaciones', role: 'usuario' },
  { id: 'u4', name: 'Maria Salazar', area: 'Planeamiento', role: 'usuario' },
];

const initialKpis = [
  { id: 'k1', name: 'Reportes enviados', area: 'Planeamiento', assigneeId: 'u1', target: 12, min: 8, max: 20, frequency: 'Diario', limitHour: '17:30', category: 'Productividad', active: true },
  { id: 'k2', name: 'Avance de iniciativas', area: 'Planeamiento', assigneeId: 'u1', target: 85, min: 70, max: 100, frequency: 'Semanal', limitHour: '18:00', category: 'Estrategia', active: true },
  { id: 'k3', name: 'Prospectos contactados', area: 'Comercial', assigneeId: 'u2', target: 25, min: 18, max: 40, frequency: 'Diario', limitHour: '17:00', category: 'Ventas', active: true },
  { id: 'k4', name: 'Ordenes procesadas', area: 'Operaciones', assigneeId: 'u3', target: 60, min: 45, max: 90, frequency: 'Diario', limitHour: '16:30', category: 'Operaciones', active: true },
  { id: 'k5', name: 'Cumplimiento documental', area: 'Planeamiento', assigneeId: 'u4', target: 95, min: 80, max: 100, frequency: 'Mensual', limitHour: '18:30', category: 'Calidad', active: true },
];

const initialEntries = {
  k1: '12',
  k2: '0',
  k3: '',
  k4: '42',
  k5: '97',
};

const initialParticipation = {
  u1: { expected: 20, completed: 19 },
  u2: { expected: 20, completed: 0 },
  u3: { expected: 20, completed: 14 },
  u4: { expected: 20, completed: 20 },
};

const initialNotifications = [
  { id: 1, worker: 'Ana Torres', type: 'KPI sin registrar', channel: 'Correo', time: '16:45', status: 'Enviado' },
  { id: 2, worker: 'Luis Ramos', type: 'Bajo rendimiento', channel: 'Alerta interna', time: '15:20', status: 'Pendiente' },
  { id: 3, worker: 'Carlos Martinez', type: 'Recordatorio hora limite', channel: 'Correo', time: '17:00', status: 'Enviado' },
];

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

function getChartReportData(kpis, entries, participation) {
  const activeKpis = kpis.filter((kpi) => kpi.active);
  const summary = activeKpis.map((kpi) => ({ ...kpi, status: getKpiStatus(kpi, entries[kpi.id] ?? '') }));
  const byArea = Object.values(summary.reduce((acc, item) => {
    acc[item.area] ??= { area: item.area, total: 0, score: 0 };
    acc[item.area].total += 1;
    acc[item.area].score += Math.min(item.status.score, 120);
    return acc;
  }, {})).map((area) => ({
    label: area.area,
    value: Math.round(area.score / area.total),
  }));
  const byWorker = workers.map((worker) => {
    const assigned = summary.filter((item) => item.assigneeId === worker.id);
    const score = assigned.length
      ? Math.round(assigned.reduce((total, item) => total + Math.min(item.status.score, 120), 0) / assigned.length)
      : 0;

    return { label: worker.name.split(' ')[0], value: score };
  });
  const participationData = workers.map((worker) => {
    const data = participation[worker.id];
    return {
      label: worker.name.split(' ')[0],
      value: Math.round((data.completed / data.expected) * 100),
    };
  });

  return [
    {
      title: 'Cumplimiento por area',
      subtitle: 'Promedio de KPIs reportados frente a sus metas configuradas.',
      data: byArea,
      color: 'naranja',
    },
    {
      title: 'Trabajador vs trabajador',
      subtitle: 'Comparativa directa del cumplimiento individual.',
      data: byWorker,
      color: 'azul',
    },
    {
      title: 'Participacion por colaborador',
      subtitle: 'Porcentaje de registros completados dentro del tiempo esperado.',
      data: participationData,
      color: 'naranja',
    },
  ];
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

function StatCard({ label, value, helper, accent = 'azul' }) {
  return (
    <div className="bg-white border border-azul/10 rounded-xl p-5 shadow-sm">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${accent === 'naranja' ? 'text-naranja' : 'text-azul'}`}>{label}</span>
      <strong className="block text-3xl font-extrabold text-azul-profundo mt-2">{value}</strong>
      <p className="text-xs text-gris-texto mt-1">{helper}</p>
    </div>
  );
}

function StatusPill({ status }) {
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

function getBarChartSvg(data, valueSuffix = '%', color = 'naranja') {
  const maxValue = Math.max(100, ...data.map((item) => item.value));
  const chartWidth = Math.max(560, data.length * 120);
  const chartHeight = 220;
  const barAreaHeight = 150;
  const grid = [0, 25, 50, 75, 100].map((tick) => {
    const y = 24 + barAreaHeight - (tick / 100) * barAreaHeight;
    return `
      <g>
        <line x1="48" x2="${chartWidth - 20}" y1="${y}" y2="${y}" stroke="rgba(18,52,152,0.08)" />
        <text x="12" y="${y + 4}" font-size="10" fill="#A3A3A3">${tick}${valueSuffix}</text>
      </g>
    `;
  }).join('');
  const bars = data.map((item, index) => {
    const slot = 120;
    const barWidth = 54;
    const x = 64 + index * slot;
    const height = Math.max(4, (item.value / maxValue) * barAreaHeight);
    const y = 24 + barAreaHeight - height;
    const fill = color === 'azul' ? '#123498' : index % 2 === 0 ? '#F46F0B' : '#096ACC';
    const label = item.label.length > 13 ? `${item.label.slice(0, 12)}.` : item.label;

    return `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="6" fill="${fill}" />
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#123498">${item.value}${valueSuffix}</text>
        <text x="${x + barWidth / 2}" y="198" text-anchor="middle" font-size="11" fill="#123498">${label}</text>
      </g>
    `;
  }).join('');

  return `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="Grafico de barras" xmlns="http://www.w3.org/2000/svg">${grid}${bars}</svg>`;
}

function downloadChartsReportPdf(charts) {
  const printWindow = window.open('', '_blank', 'width=1100,height=820');
  if (!printWindow) return;

  const chartsMarkup = charts.map((chart, index) => `
    <section class="chart-block">
      <div class="chart-heading">
        <span>Grafico ${index + 1}</span>
        <h2>${chart.title}</h2>
        ${chart.subtitle ? `<p>${chart.subtitle}</p>` : ''}
      </div>
      <div class="chart">${getBarChartSvg(chart.data, chart.valueSuffix ?? '%', chart.color ?? 'naranja')}</div>
    </section>
  `).join('');

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Informe de graficos KPI</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 36px; font-family: Lato, sans-serif; color: #123498; background: #FFFFFF; }
          header { border-bottom: 4px solid #F46F0B; margin-bottom: 28px; padding-bottom: 18px; }
          h1, h2 { font-family: Montserrat, sans-serif; color: #123498; }
          h1 { margin: 0; font-size: 30px; font-weight: 900; }
          h2 { margin: 6px 0 0; font-size: 22px; font-weight: 900; }
          p { margin: 8px 0 0; color: #A3A3A3; font-size: 14px; }
          .meta { margin-top: 8px; color: #A3A3A3; font-size: 13px; }
          .chart-block { margin: 0 0 28px; break-inside: avoid; page-break-inside: avoid; }
          .chart-heading span { color: #F46F0B; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; }
          .chart { margin-top: 14px; border: 1px solid rgba(18,52,152,0.16); border-radius: 18px; padding: 24px; }
          svg { width: 100%; height: auto; display: block; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <header>
          <h1>Informe completo de graficos KPI</h1>
          <div class="meta">Sistema KPI JB · ${new Date().toLocaleDateString('es-PE')}</div>
        </header>
        ${chartsMarkup}
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function BarChart({ title, subtitle, data, valueSuffix = '%', color = 'naranja' }) {
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
        <svg
          className="min-w-[560px] w-full"
          viewBox={`0 0 ${Math.max(560, data.length * 120)} ${chartHeight}`}
          role="img"
          aria-label={title}
        >
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
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="#123498">
                  {item.value}{valueSuffix}
                </text>
                <text x={x + barWidth / 2} y="198" textAnchor="middle" fontSize="11" fill="#123498">
                  {item.label.length > 13 ? `${item.label.slice(0, 12)}.` : item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function DashboardView({ kpis, entries, userRole }) {
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
    const score = assigned.length
      ? Math.round(assigned.reduce((total, item) => total + Math.min(item.status.score, 120), 0) / assigned.length)
      : 0;

    return { label: worker.name.split(' ')[0], value: score };
  });
  const areaChartData = byArea.map((area) => ({ label: area.area, value: area.score }));

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Cumplimiento general" value={`${averageScore}%`} helper="Promedio calculado con valores registrados" />
        <StatCard label="Participacion de llenado" value={`${completion}%`} helper="KPIs completados frente a los esperados" accent="naranja" />
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
            <div className="flex justify-between rounded-lg bg-azul/5 px-4 py-3 text-sm">
              <span>Mes actual vs anterior</span>
              <strong className="text-naranja">Simulado</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BarChart
          title="Cumplimiento por area"
          subtitle="Promedio de KPIs reportados frente a sus metas configuradas."
          data={areaChartData}
        />
        <BarChart
          title="Trabajador vs trabajador"
          subtitle="Comparativa directa del cumplimiento individual."
          data={byWorker}
          color="azul"
        />
      </div>

      <KpiTable kpis={summary} entries={entries} />
    </section>
  );
}

function DailyView({ kpis, entries, setEntries, userRole, addNotification }) {
  const visibleKpis = userRole === 'usuario' ? kpis.filter((kpi) => kpi.assigneeId === 'u1' && kpi.active) : kpis.filter((kpi) => kpi.active);

  const submitDaily = () => {
    const emptyCount = visibleKpis.filter((kpi) => (entries[kpi.id] ?? '') === '').length;
    addNotification({
      worker: userRole === 'usuario' ? 'Carlos Martinez' : 'Equipo KPI',
      type: emptyCount ? `${emptyCount} KPI sin registrar` : 'Registro diario completado',
      channel: 'Alerta interna',
      status: emptyCount ? 'Pendiente' : 'Enviado',
    });
  };

  return (
    <section className="space-y-6">
      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-[10px] bg-naranja/10 text-naranja px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Modulo 2</span>
            <h3 className="text-xl font-bold text-azul-profundo mt-3">Ingreso diario de KPIs y semaforo visual</h3>
            <p className="text-sm text-gris-texto mt-1">Rojo significa vacio. Negro significa registro valido con valor 0. Verde o amarillo dependen de la meta configurada.</p>
          </div>
          <button onClick={submitDaily} className="bg-naranja hover:bg-naranja-oscuro text-white text-sm font-bold px-5 py-3 rounded-lg transition-colors">
            Guardar registro diario
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gris-texto border-b border-azul/10">
                <th className="py-3">KPI asignado</th>
                <th>Trabajador</th>
                <th>Meta</th>
                <th>Hora limite</th>
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
                    <td>{kpi.limitHour}</td>
                    <td>
                      <input
                        type="number"
                        value={value}
                        onChange={(event) => setEntries((current) => ({ ...current, [kpi.id]: event.target.value }))}
                        className="w-28 rounded-lg border border-azul/15 bg-azul/5 px-3 py-2 text-azul-profundo outline-none focus:border-azul"
                        placeholder="Vacio"
                      />
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

function SettingsView({ kpis, setKpis }) {
  const [form, setForm] = useState({ name: '', area: 'Planeamiento', assigneeId: 'u1', target: 80, min: 60, max: 100, frequency: 'Diario', limitHour: '17:30', category: 'Productividad' });

  const createKpi = (event) => {
    event.preventDefault();
    setKpis((current) => [...current, { ...form, id: `k${Date.now()}`, target: Number(form.target), min: Number(form.min), max: Number(form.max), active: true }]);
    setForm((current) => ({ ...current, name: '' }));
  };

  const updateKpi = (id, field, value) => {
    setKpis((current) => current.map((kpi) => (kpi.id === id ? { ...kpi, [field]: value } : kpi)));
  };

  return (
    <section className="space-y-6">
      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
        <span className="text-[10px] bg-naranja/10 text-naranja px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Modulo 3</span>
        <h3 className="text-xl font-bold text-azul-profundo mt-3">Configuracion general y motor de KPIs</h3>
        <p className="text-sm text-gris-texto mt-1">Administra indicadores, formulas, metas, periodicidad, horarios limite y asignaciones.</p>

        <form onSubmit={createKpi} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del KPI" className="rounded-lg border border-azul/15 px-3 py-2 text-sm outline-none focus:border-azul" />
          <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className="rounded-lg border border-azul/15 px-3 py-2 text-sm outline-none focus:border-azul">
            {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
          <input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="rounded-lg border border-azul/15 px-3 py-2 text-sm outline-none focus:border-azul" />
          <button className="bg-naranja hover:bg-naranja-oscuro text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors">Crear KPI</button>
        </form>
      </div>

      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-gris-texto border-b border-azul/10">
              <th className="py-3">Indicador</th>
              <th>Asignado</th>
              <th>Area</th>
              <th>Formula</th>
              <th>Meta</th>
              <th>Minimo</th>
              <th>Periodicidad</th>
              <th>Hora limite</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi) => (
              <tr key={kpi.id} className="border-b border-azul/5">
                <td className="py-3 font-bold text-azul-profundo">{kpi.name}</td>
                <td>{getWorkerName(kpi.assigneeId)}</td>
                <td>{kpi.area}</td>
                <td className="text-xs text-gris-texto">(Valor / Meta) x 100</td>
                <td><input type="number" value={kpi.target} onChange={(e) => updateKpi(kpi.id, 'target', Number(e.target.value))} className="w-20 rounded border border-azul/10 px-2 py-1" /></td>
                <td><input type="number" value={kpi.min} onChange={(e) => updateKpi(kpi.id, 'min', Number(e.target.value))} className="w-20 rounded border border-azul/10 px-2 py-1" /></td>
                <td>{kpi.frequency}</td>
                <td><input type="time" value={kpi.limitHour} onChange={(e) => updateKpi(kpi.id, 'limitHour', e.target.value)} className="rounded border border-azul/10 px-2 py-1" /></td>
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

function ReportsView({ kpis, entries, participation, notifications, addNotification }) {
  const ranking = workers.map((worker) => {
    const data = participation[worker.id];
    const rate = Math.round((data.completed / data.expected) * 100);
    return { ...worker, rate, completed: data.completed, expected: data.expected };
  }).sort((a, b) => b.rate - a.rate);
  const participationChartData = ranking.map((worker) => ({
    label: worker.name.split(' ')[0],
    value: worker.rate,
  }));

  const exportRows = [
    ['Trabajador', 'Area', 'Participacion', 'Completados', 'Esperados'],
    ...ranking.map((worker) => [worker.name, worker.area, `${worker.rate}%`, worker.completed, worker.expected]),
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Mayor participacion" value={`${ranking[0].rate}%`} helper={ranking[0].name} />
        <StatCard label="Participacion nula" value={ranking.filter((worker) => worker.rate === 0).length} helper="Colaboradores identificados con 0%" accent="naranja" />
        <StatCard label="Notificaciones" value={notifications.length} helper="Historial de recordatorios y alertas" />
      </div>

      <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <span className="text-[10px] bg-azul/10 text-azul px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Modulo 5</span>
            <h3 className="text-xl font-bold text-azul-profundo mt-3">Auditoria, exportacion y notificaciones</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadCsv('participacion-kpi.csv', exportRows)} className="bg-azul hover:bg-azul-profundo text-white rounded-lg px-4 py-2 text-sm font-bold">Exportar CSV</button>
            <button onClick={() => window.print()} className="bg-naranja hover:bg-naranja-oscuro text-white rounded-lg px-4 py-2 text-sm font-bold">Exportar PDF</button>
            <button onClick={() => addNotification({ worker: 'Equipo KPI', type: 'Recordatorio masivo de hora limite', channel: 'Correo', status: 'Enviado' })} className="bg-azul/10 text-azul rounded-lg px-4 py-2 text-sm font-bold">Enviar alerta</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gris-texto border-b border-azul/10">
                  <th className="py-3">Ranking</th>
                  <th>Trabajador</th>
                  <th>Area</th>
                  <th>Participacion</th>
                  <th>Reconocimiento</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((worker, index) => (
                  <tr key={worker.id} className="border-b border-azul/5">
                    <td className="py-3 font-bold text-naranja">#{index + 1}</td>
                    <td className="font-bold text-azul-profundo">{worker.name}</td>
                    <td>{worker.area}</td>
                    <td>{worker.rate}%</td>
                    <td>
                      {worker.rate === 0 && <span className="text-rojo-persa font-bold">0% identificado</span>}
                      {worker.rate > 90 && <span className="text-turquesa font-bold">Mayor a 90%</span>}
                      {worker.rate > 0 && worker.rate <= 90 && <span className="text-gris-texto">En seguimiento</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-lg border border-azul/10 bg-azul/5 p-4">
                <div className="flex justify-between gap-4">
                  <strong className="text-sm text-azul-profundo">{notification.worker}</strong>
                  <span className="text-xs font-bold text-naranja">{notification.time}</span>
                </div>
                <p className="text-sm text-gris-texto mt-1">{notification.type} por {notification.channel}. Estado: {notification.status}.</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BarChart
        title="Participacion por colaborador"
        subtitle="Porcentaje de registros completados dentro del tiempo esperado."
        data={participationChartData}
      />

      <KpiTable kpis={kpis.map((kpi) => ({ ...kpi, status: getKpiStatus(kpi, entries[kpi.id] ?? '') }))} entries={entries} />
    </section>
  );
}

function KpiTable({ kpis, entries }) {
  return (
    <div className="bg-white border border-azul/10 rounded-xl p-6 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-bold text-azul-profundo mb-4">Estado consolidado de KPIs</h3>
      <table className="w-full min-w-[760px] text-sm">
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [kpis, setKpis] = useState(initialKpis);
  const [entries, setEntries] = useState(initialEntries);
  const [notifications, setNotifications] = useState(initialNotifications);

  const userName = useMemo(() => {
    if (userRole === 'admin') return 'Administrador JB';
    if (userRole === 'jefe') return 'Jefe de Area';
    return 'Carlos Martinez';
  }, [userRole]);

  const addNotification = (notification) => {
    const now = new Date();
    setNotifications((current) => [
      { id: Date.now(), time: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), ...notification },
      ...current,
    ]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTab('dashboard');
    setUserRole('admin');
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex bg-blanco-suave min-h-screen w-full antialiased font-sans text-azul-profundo">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header
          userName={userName}
          currentTab={currentTab}
          userRole={userRole}
          setUserRole={setUserRole}
          setCurrentTab={setCurrentTab}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && <DashboardView kpis={kpis} entries={entries} userRole={userRole} />}
          {currentTab === 'daily' && <DailyView kpis={kpis} entries={entries} setEntries={setEntries} userRole={userRole} addNotification={addNotification} />}
          {currentTab === 'settings' && <SettingsView kpis={kpis} setKpis={setKpis} />}
          {currentTab === 'reports' && <ReportsView kpis={kpis} entries={entries} participation={initialParticipation} notifications={notifications} addNotification={addNotification} />}
        </main>
      </div>
    </div>
  );
}
