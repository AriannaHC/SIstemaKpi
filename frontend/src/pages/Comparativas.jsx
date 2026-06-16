import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart2, Download, Calendar, Users, Building2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- MOCK DATA ---
const METRICAS = ["Cumplimiento", "Eficacia", "Eficiencia", "Rendimiento"];

const areas = [
  { id: "desarrollo", nombre: "Desarrollo" },
  { id: "finanzas", nombre: "Finanzas" },
  { id: "calidad", nombre: "Calidad" },
  { id: "marketing", nombre: "Marketing" },
  { id: "rrhh", nombre: "RRHH" },
];

const trabajadores = [
  { id: "carlos", nombre: "Carlos Pure", area: "Desarrollo" },
  { id: "ana", nombre: "Ana López", area: "Calidad" },
  { id: "luis", nombre: "Luis Pérez", area: "Finanzas" },
  { id: "mario", nombre: "Mario Gómez", area: "Marketing" },
  { id: "sofia", nombre: "Sofía Ruiz", area: "Desarrollo" },
  { id: "pedro", nombre: "Pedro Ramírez", area: "RRHH" },
];

const dataPorArea = {
  desarrollo: [85, 90, 78, 82],
  finanzas: [92, 88, 95, 90],
  calidad: [78, 85, 82, 88],
  marketing: [65, 72, 68, 70],
  rrhh: [90, 82, 88, 75],
};

const dataPorTrabajador = {
  carlos: [95, 88, 80, 92],
  ana: [88, 92, 85, 78],
  luis: [82, 78, 90, 85],
  mario: [55, 60, 50, 65],
  sofia: [65, 70, 75, 60],
  pedro: [78, 85, 82, 90],
};

export default function Comparativas() {
  const [tipoComparacion, setTipoComparacion] = useState("areas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [periodo, setPeriodo] = useState("30");
  const [entidadAId, setEntidadAId] = useState("desarrollo");
  const [entidadBId, setEntidadBId] = useState("finanzas");

  const isAreas = tipoComparacion === "areas";

  useEffect(() => {
    if (isAreas) {
      setEntidadAId("desarrollo");
      setEntidadBId("finanzas");
    } else {
      setEntidadAId("carlos");
      setEntidadBId("ana");
    }
  }, [tipoComparacion]);

  const handlePeriodoChange = (dias) => {
    setPeriodo(dias);
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - Number(dias));
    setFechaDesde(desde.toISOString().split("T")[0]);
    setFechaHasta(hasta.toISOString().split("T")[0]);
  };

  const entidades = isAreas ? areas : trabajadores;
  const dataSource = isAreas ? dataPorArea : dataPorTrabajador;
  const labelA = isAreas ? "Área A" : "Trabajador A";
  const labelB = isAreas ? "Área B" : "Trabajador B";

  const entidadANombre =
    entidades.find((e) => e.id === entidadAId)?.nombre ?? labelA;
  const entidadBNombre =
    entidades.find((e) => e.id === entidadBId)?.nombre ?? labelB;

  const chartData = METRICAS.map((metrica, i) => ({
    metrica,
    entidadA: dataSource[entidadAId]?.[i] ?? 0,
    entidadB: dataSource[entidadBId]?.[i] ?? 0,
  }));

  const metricasGanadasA = chartData.filter((r) => r.entidadA > r.entidadB).length;
  const metricasGanadasB = chartData.filter((r) => r.entidadB > r.entidadA).length;
  const empates = chartData.filter((r) => r.entidadA === r.entidadB).length;

  const promedioA = (chartData.reduce((s, r) => s + r.entidadA, 0) / chartData.length).toFixed(1);
  const promedioB = (chartData.reduce((s, r) => s + r.entidadB, 0) / chartData.length).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-azul font-heading">
            Centro de <span className="text-naranja">Comparativas</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Enfrenta métricas entre áreas o trabajadores.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 shadow-sm transition-colors">
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </div>

      {/* Filtro de Fechas */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest px-2">
          <Calendar className="w-4 h-4" /> Rango de Fechas:
        </div>
        <select
          value={periodo}
          onChange={(e) => handlePeriodoChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
        >
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 3 meses</option>
          <option value="180">Últimos 6 meses</option>
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
        />
        <span className="text-xs font-black text-slate-300 uppercase">─</span>
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm inline-flex gap-2">
        <button
          onClick={() => setTipoComparacion("areas")}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            isAreas
              ? "bg-azul text-white shadow-md shadow-azul/20"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Área vs Área
        </button>
        <button
          onClick={() => setTipoComparacion("trabajadores")}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            !isAreas
              ? "bg-azul text-white shadow-md shadow-azul/20"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Trabajador vs Trabajador
        </button>
      </div>

      {/* Selectores de Entidad A y B */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={entidadAId}
            onChange={(e) => setEntidadAId(e.target.value)}
            className="flex-1 bg-white border border-azul/30 text-azul text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
          >
            {entidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
                {!isAreas ? ` — ${e.area}` : ""}
              </option>
            ))}
          </select>
          <span className="text-xs font-black text-slate-300 uppercase shrink-0">
            VS
          </span>
          <select
            value={entidadBId}
            onChange={(e) => setEntidadBId(e.target.value)}
            className="flex-1 bg-white border border-naranja/30 text-naranja text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-naranja focus:ring-2 focus:ring-naranja/20 transition-all"
          >
            {entidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
                {!isAreas ? ` — ${e.area}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen del Enfrentamiento */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-2 text-center md:text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Ganador del Enfrentamiento
            </p>
            <p className="text-2xl font-extrabold text-azul">
              {promedioA > promedioB ? entidadANombre : entidadBNombre}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1">
              {metricasGanadasA} - {metricasGanadasB}
              {empates > 0 ? ` (${empates} empates)` : ""}
            </p>
          </div>
          <div className="md:col-span-2 space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>{entidadANombre}</span>
                <span>{promedioA}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-azul rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Number(promedioA), 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>{entidadBNombre}</span>
                <span>{promedioB}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-naranja rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Number(promedioB), 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Diferencia
            </p>
            <p className="text-3xl font-extrabold text-azul">
              {Math.abs(promedioA - promedioB)}%
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <h3 className="font-black text-lg text-azul text-center mb-8 uppercase tracking-widest">
          {entidadANombre} vs {entidadBNombre}
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="metrica"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="entidadA"
                name={entidadANombre}
                fill="#123498"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="entidadB"
                name={entidadBNombre}
                fill="#F46F0B"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-black text-sm text-slate-700 uppercase tracking-widest">
            Detalle de Datos — {entidadANombre} vs {entidadBNombre}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-azul">
                  Métrica Evaluada
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-azul">
                  {entidadANombre}
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-naranja">
                  {entidadBNombre}
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Diferencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartData.map((row) => {
                const diff = row.entidadA - row.entidadB;
                const isAPositive = diff > 0;
                const ganador = isAPositive
                  ? entidadANombre
                  : entidadBNombre;
                return (
                  <tr
                    key={row.metrica}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                      {row.metrica}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-600">
                      {row.entidadA}%
                    </td>
                    <td className="px-6 py-4 font-black text-slate-600">
                      {row.entidadB}%
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                          isAPositive
                            ? "bg-azul/10 text-azul"
                            : "bg-naranja/10 text-naranja"
                        }`}
                      >
                        {Math.abs(diff)}% a favor de {ganador}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
