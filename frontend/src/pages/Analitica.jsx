import React, { useState } from "react";

import {
  Download,
  Filter,
  TrendingUp,
  Award,
  AlertOctagon,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- MOCK DATA ---

const mockEvolucion = [
  { semana: "Semana 1", cumplimiento: 85 },

  { semana: "Semana 2", cumplimiento: 88 },

  { semana: "Semana 3", cumplimiento: 92 },

  { semana: "Semana 4", cumplimiento: 81 },

  { semana: "Semana 5", cumplimiento: 95 },

  { semana: "Semana 6", cumplimiento: 98 },
];

const mockTopRank = [
  { id: 1, nombre: "Carlos Pure", area: "Desarrollo", score: 98 },

  { id: 2, nombre: "Ana López", area: "Calidad", score: 96 },

  { id: 3, nombre: "Luis Pérez", area: "Finanzas", score: 94 },
];

const mockBottomRank = [
  { id: 4, nombre: "Mario Gómez", area: "Marketing", score: 45 },

  { id: 5, nombre: "Sofía Ruiz", area: "Desarrollo", score: 50 },
];

export default function Analitica() {
  const [filtroArea, setFiltroArea] = useState("todas");

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Cabecera */}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#123498] font-heading">
            Analítica y <span className="text-[#F46F0B]">Rendimiento</span>
          </h1>

          <p className="text-gray-500 font-medium mt-1">
            Evolución histórica y rankings de cumplimiento corporativo.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:text-[#123498] hover:border-[#123498]/30 shadow-sm transition-all">
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* Filtros */}

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest px-2">
          <Filter className="w-4 h-4" /> Segmentar por:
        </div>

        <select
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/20 transition-all"
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
        >
          <option value="todas">Todas las Áreas</option>

          <option value="17">Desarrollo y Programación</option>

          <option value="18">Administración y Finanzas</option>
        </select>

        <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/20 transition-all">
          <option value="30">Últimos 30 días</option>

          <option value="90">Últimos 3 meses</option>

          <option value="180">Últimos 6 meses</option>
        </select>
      </div>

      {/* Gráfico Principal */}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#123498]/10 rounded-2xl">
            <TrendingUp className="w-6 h-6 text-[#123498]" />
          </div>

          <div>
            <h3 className="font-black text-lg text-[#123498]">
              Evolución del Cumplimiento
            </h3>

            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              Promedio General (%)
            </p>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
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

              <Area
                type="monotone"
                dataKey="cumplimiento"
                stroke="#F46F0B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCumplimiento)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rankings */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Mejores */}

        <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 text-emerald-600">
            <Award className="w-6 h-6" />

            <h3 className="font-black text-lg uppercase tracking-wider">
              Top Rendimiento
            </h3>
          </div>

          <div className="space-y-3">
            {mockTopRank.map((user, i) => (
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
            ))}
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
            {mockBottomRank.map((user, i) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
