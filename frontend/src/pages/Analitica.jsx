import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Filter,
  TrendingUp,
  Award,
  AlertOctagon,
  Calendar,
} from "lucide-react";
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- MOCK DATA ---
const areas = [
  { id: "todas", nombre: "Todas las Áreas" },
  { id: "desarrollo", nombre: "Desarrollo" },
  { id: "finanzas", nombre: "Finanzas" },
  { id: "calidad", nombre: "Calidad" },
  { id: "marketing", nombre: "Marketing" },
  { id: "rrhh", nombre: "RRHH" },
];

const mockEvolucion = [
  { semana: "Semana 1", cumplimiento: 82, meta: 85 },
  { semana: "Semana 2", cumplimiento: 88, meta: 85 },
  { semana: "Semana 3", cumplimiento: 75, meta: 85 },
  { semana: "Semana 4", cumplimiento: 91, meta: 85 },
  { semana: "Semana 5", cumplimiento: 86, meta: 88 },
  { semana: "Semana 6", cumplimiento: 94, meta: 88 },
];

const metricasPerfil = ["Cumplimiento", "Eficacia", "Eficiencia", "Rendimiento", "Calidad"];

const mockPerfilArea = {
  desarrollo: [85, 90, 78, 82, 80],
  finanzas: [92, 88, 95, 90, 78],
  calidad: [78, 85, 82, 88, 85],
  marketing: [65, 72, 68, 70, 60],
  rrhh: [90, 82, 88, 75, 82],
  promedioGral: [80, 83, 82, 81, 77],
};

const mockEstadoGeneral = [
  { name: "Cumplido", value: 65, color: "#22c55e" },
  { name: "En Riesgo", value: 20, color: "#eab308" },
  { name: "Incumplido", value: 15, color: "#ef4444" },
];

const mockUsuarios = [
  { id: 1, nombre: "Carlos Pure", area: "Desarrollo", score: 98 },
  { id: 2, nombre: "Ana López", area: "Calidad", score: 96 },
  { id: 3, nombre: "Luis Pérez", area: "Finanzas", score: 94 },
  { id: 4, nombre: "Pedro Ramírez", area: "RRHH", score: 92 },
  { id: 5, nombre: "Lucía Mendoza", area: "Desarrollo", score: 91 },
  { id: 6, nombre: "Mario Gómez", area: "Marketing", score: 45 },
  { id: 7, nombre: "Sofía Ruiz", area: "Desarrollo", score: 50 },
  { id: 8, nombre: "Jorge Torres", area: "Marketing", score: 52 },
  { id: 9, nombre: "Rosa García", area: "Finanzas", score: 55 },
  { id: 10, nombre: "Diego Vargas", area: "Calidad", score: 58 },
];

export default function Analitica() {
  const [filtroArea, setFiltroArea] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [periodo, setPeriodo] = useState("30");

  const handlePeriodoChange = (dias) => {
    setPeriodo(dias);
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - Number(dias));
    setFechaDesde(desde.toISOString().split("T")[0]);
    setFechaHasta(hasta.toISOString().split("T")[0]);
  };

  const areaSelNombre =
    areas.find((a) => a.id === filtroArea)?.nombre ?? "Todas las Áreas";

  const usuariosFiltrados = useMemo(() => {
    if (filtroArea === "todas") return mockUsuarios;
    return mockUsuarios.filter((u) => u.area === areaSelNombre);
  }, [filtroArea, areaSelNombre]);

  const perfilData = useMemo(() => {
    if (filtroArea === "todas") {
      return metricasPerfil.map((metrica, i) => ({
        metrica,
        promedio: mockPerfilArea.promedioGral[i],
      }));
    }
    const data = mockPerfilArea[filtroArea];
    return metricasPerfil.map((metrica, i) => ({
      metrica,
      valor: data?.[i] ?? 0,
      promedio: mockPerfilArea.promedioGral[i],
    }));
  }, [filtroArea]);

  const topRanking = useMemo(
    () => [...usuariosFiltrados].sort((a, b) => b.score - a.score).slice(0, 5),
    [usuariosFiltrados],
  );

  const bottomRanking = useMemo(
    () => [...usuariosFiltrados].sort((a, b) => a.score - b.score).slice(0, 5),
    [usuariosFiltrados],
  );

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
            Analítica y <span className="text-naranja">Rendimiento</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Evolución histórica y rankings de cumplimiento corporativo.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:text-azul hover:border-azul/30 shadow-sm transition-all">
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest px-2">
          <Filter className="w-4 h-4" /> Segmentar por:
        </div>
        <select
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select
          value={periodo}
          onChange={(e) => handlePeriodoChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
        >
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 3 meses</option>
          <option value="180">Últimos 6 meses</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
          />
          <span className="text-xs font-black text-slate-300 uppercase">
            ─
          </span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 transition-all"
          />
        </div>
      </div>

      {/* Evolución */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-azul/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-azul" />
            </div>
            <div>
              <h3 className="font-black text-lg text-azul">
                Evolución del Cumplimiento
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                {areaSelNombre} — Promedio vs Meta
              </p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={mockEvolucion}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorCumplimiento"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#F46F0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F46F0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="semana"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#123498", fontWeight: 900 }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="meta"
                  name="Meta"
                  fill="#93c5fd"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Line
                  type="monotone"
                  dataKey="cumplimiento"
                  name="Cumplimiento"
                  stroke="#F46F0B"
                  strokeWidth={3}
                  dot={{ fill: "#F46F0B", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      {/* Perfil de Rendimiento */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-azul/10 rounded-2xl">
            <Award className="w-6 h-6 text-azul" />
          </div>
          <div>
            <h3 className="font-black text-lg text-azul">
              Perfil de Rendimiento
            </h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              {areaSelNombre} — Métricas vs Promedio General
            </p>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={perfilData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
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
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
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
                dataKey="promedio"
                name="Promedio General"
                fill="#94a3b8"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
              {filtroArea !== "todas" && (
                <Bar
                  dataKey="valor"
                  name={areaSelNombre}
                  fill="#123498"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Donut + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* DonutChart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-azul/10 rounded-2xl">
              <Award className="w-6 h-6 text-azul" />
            </div>
            <div>
              <h3 className="font-black text-lg text-azul">
                Estado General
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                Distribución de Cumplimiento
              </p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockEstadoGeneral}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine
                >
                  {mockEstadoGeneral.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rankings */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Mejores */}
          <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 text-emerald-600">
              <Award className="w-6 h-6" />
              <h3 className="font-black text-lg uppercase tracking-wider">
                Top Rendimiento
              </h3>
            </div>
            <div className="space-y-3">
              {topRanking.length > 0 ? (
                topRanking.map((user, i) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-slate-300">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {user.nombre}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {user.area}
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-lg text-sm">
                      {user.score}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs font-bold text-center py-8">
                  Sin datos para esta área
                </p>
              )}
            </div>
          </div>

          {/* Bottom Peores */}
          <div className="bg-white rounded-[2rem] border border-rose-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 text-rose-600">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="font-black text-lg uppercase tracking-wider">
                Atención Requerida
              </h3>
            </div>
            <div className="space-y-3">
              {bottomRanking.length > 0 ? (
                bottomRanking.map((user, i) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-rose-300">
                        !
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {user.nombre}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {user.area}
                        </p>
                      </div>
                    </div>
                    <span className="bg-rose-100 text-rose-700 font-black px-3 py-1 rounded-lg text-sm">
                      {user.score}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs font-bold text-center py-8">
                  Sin datos para esta área
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
