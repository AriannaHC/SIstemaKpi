import React, { useState } from "react";
import { BarChart2, Download, Layers } from "lucide-react";
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
const mockDataAreas = [
  { metrica: "Cumplimiento", areaA: 85, areaB: 92 },
  { metrica: "Eficacia", areaA: 90, areaB: 88 },
  { metrica: "Eficiencia", areaA: 78, areaB: 95 },
  { metrica: "Rendimiento", areaA: 82, areaB: 90 },
];

export default function Comparativas() {
  const [tipoComparacion, setTipoComparacion] = useState("areas");

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#123498] font-heading">
            Centro de <span className="text-[#F46F0B]">Comparativas</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Enfrenta métricas entre trabajadores, áreas o meses.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 shadow-sm transition-colors">
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </div>

      {/* Controles de Comparación */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest px-2">
          <Layers className="w-4 h-4" /> Tipo de análisis:
        </div>
        <select
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-[#123498] focus:ring-2 focus:ring-[#123498]/20 transition-all"
          value={tipoComparacion}
          onChange={(e) => setTipoComparacion(e.target.value)}
        >
          <option value="areas">Área vs Área</option>
          <option value="workers">Trabajador vs Trabajador</option>
          <option value="months">Mes Actual vs Mes Anterior</option>
        </select>

        {/* Selectores simulados de Entidad A y B */}
        <div className="flex items-center gap-3 ml-auto w-full md:w-auto">
          <select className="flex-1 bg-white border border-[#123498]/30 text-[#123498] text-xs font-bold rounded-xl py-3 px-4 outline-none">
            <option>Entidad A (Ej: Desarrollo)</option>
          </select>
          <span className="text-xs font-black text-slate-300 uppercase">
            VS
          </span>
          <select className="flex-1 bg-white border border-[#F46F0B]/30 text-[#F46F0B] text-xs font-bold rounded-xl py-3 px-4 outline-none">
            <option>Entidad B (Ej: Finanzas)</option>
          </select>
        </div>
      </div>

      {/* Gráfico Comparativo */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <h3 className="font-black text-lg text-[#123498] text-center mb-8 uppercase tracking-widest">
          Desempeño Frente a Frente
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockDataAreas}
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
                dataKey="areaA"
                name="Entidad A"
                fill="#123498"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="areaB"
                name="Entidad B"
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
            Detalle de Datos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#123498]">
                  Métrica Evaluada
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#123498]">
                  Entidad A
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#F46F0B]">
                  Entidad B
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Diferencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockDataAreas.map((row, idx) => {
                const diff = row.areaA - row.areaB;
                const isAPositive = diff > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                      {row.metrica}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-600">
                      {row.areaA}%
                    </td>
                    <td className="px-6 py-4 font-black text-slate-600">
                      {row.areaB}%
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-lg ${isAPositive ? "bg-blue-50 text-[#123498]" : "bg-orange-50 text-[#F46F0B]"}`}
                      >
                        {Math.abs(diff)}% a favor de {isAPositive ? "A" : "B"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
