import React, { useState, useEffect, useRef } from "react";
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
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

import { analyticsService } from "../services/analyticsService";
import { kpiService } from "../services/kpiService";
import { userService } from "../services/userService";

// --- MOCK DATA METRICAS ---
const METRICAS = ["Cumplimiento", "Eficacia", "Eficiencia", "Rendimiento"];

// helper: convierte un dataURL PNG a dimensiones reales del canvas
function pngDataUrlDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = dataUrl;
  });
}

export default function Comparativas() {
  const [tipoComparacion, setTipoComparacion] = useState("areas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [periodo, setPeriodo] = useState("30");

  const [entidadAId, setEntidadAId] = useState("");
  const [entidadBId, setEntidadBId] = useState("");

  // Estados de datos reales
  const [areasList, setAreasList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [nombres, setNombres] = useState({ A: "Entidad A", B: "Entidad B" });
  const [loading, setLoading] = useState(true);

  // Referencias y estados para Exportación
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef(null);

  const isAreas = tipoComparacion === "areas";

  // 1. Cargar las listas iniciales (Áreas y Usuarios)
  useEffect(() => {
    Promise.all([kpiService.getAreasStats(), userService.getUsers()])
      .then(([resAreas, resUsers]) => {
        setAreasList(resAreas);
        setUsersList(resUsers);

        // Auto-seleccionar los dos primeros para que el gráfico no esté vacío
        if (resAreas.length > 1) {
          setEntidadAId(resAreas[0].id.toString());
          setEntidadBId(resAreas[1].id.toString());
        }
      })
      .catch(console.error);
  }, []);

  // 2. Si cambia de "areas" a "trabajadores", auto-seleccionar los primeros de la nueva lista
  useEffect(() => {
    if (isAreas && areasList.length > 1) {
      setEntidadAId(areasList[0].id.toString());
      setEntidadBId(areasList[1].id.toString());
    } else if (!isAreas && usersList.length > 1) {
      setEntidadAId(usersList[0].id.toString());
      setEntidadBId(usersList[1].id.toString());
    }
  }, [tipoComparacion]); // Solo depende de tipoComparacion, omitimos las listas para evitar re-renders infinitos

  // 3. Ejecutar la comparación en el backend
  useEffect(() => {
    if (!entidadAId || !entidadBId) return;

    setLoading(true);
    const fetchAnalitica = isAreas
      ? analyticsService.compararAreas(entidadAId, entidadBId)
      : analyticsService.compararTrabajadores(entidadAId, entidadBId);

    fetchAnalitica
      .then((data) => {
        if (data && data.length > 0) {
          // Mapear los datos para que Recharts los entienda usando "entidadA" y "entidadB"
          const mappedData = data.map((item) => ({
            metrica: item.metrica,
            entidadA: item.entidadA_valor,
            entidadB: item.entidadB_valor,
          }));
          setChartData(mappedData);
          setNombres({
            A: data[0].entidadA_nombre,
            B: data[0].entidadB_nombre,
          });
        } else {
          setChartData([]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tipoComparacion, entidadAId, entidadBId, periodo]);

  const handlePeriodoChange = (dias) => {
    setPeriodo(dias);
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - Number(dias));
    setFechaDesde(desde.toISOString().split("T")[0]);
    setFechaHasta(hasta.toISOString().split("T")[0]);
  };

  const entidadesSelect = isAreas ? areasList : usersList;
  const entidadANombre = nombres.A;
  const entidadBNombre = nombres.B;

  // Estadísticas Automáticas
  const metricasGanadasA = chartData.filter(
    (r) => r.entidadA > r.entidadB,
  ).length;
  const metricasGanadasB = chartData.filter(
    (r) => r.entidadB > r.entidadA,
  ).length;
  const empates = chartData.filter((r) => r.entidadA === r.entidadB).length;

  const promedioA = chartData.length
    ? (
        chartData.reduce((s, r) => s + r.entidadA, 0) / chartData.length
      ).toFixed(1)
    : 0;
  const promedioB = chartData.length
    ? (
        chartData.reduce((s, r) => s + r.entidadB, 0) / chartData.length
      ).toFixed(1)
    : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORTAR A PDF (Con html-to-image y silenciador de CORS)
  // ─────────────────────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    if (!dashboardRef.current || chartData.length === 0) return;
    setIsExporting(true);

    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = String(args[0] || "");
      if (
        msg.includes("Error inlining remote css file") ||
        msg.includes("Error while reading CSS rules")
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    const toPngOpts = {
      pixelRatio: 2,
      skipFonts: false,
      backgroundColor: "#f8fafc",
    };

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();

      const dashImgData = await toPng(dashboardRef.current, toPngOpts);
      const { w: dw, h: dh } = await pngDataUrlDimensions(dashImgData);
      const dashHeightMm = (dh * pdfWidth) / dw;

      if (dashHeightMm <= pageHeightMm) {
        pdf.addImage(dashImgData, "PNG", 0, 0, pdfWidth, dashHeightMm);
      } else {
        let yOffset = 0;
        while (yOffset < dashHeightMm) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(dashImgData, "PNG", 0, -yOffset, pdfWidth, dashHeightMm);
          yOffset += pageHeightMm;
        }
      }

      pdf.save(
        `Reporte_Comparativa_${entidadANombre.replace(/\s+/g, "_")}_vs_${entidadBNombre.replace(/\s+/g, "_")}.pdf`,
      );
    } catch (error) {
      originalConsoleError("Error al exportar PDF:", error);
      alert(
        "Hubo un problema al generar el PDF. Revisa la consola para más detalles.",
      );
    } finally {
      console.error = originalConsoleError;
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#123498] font-heading">
            Centro de <span className="text-[#F46F0B]">Comparativas</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Enfrenta métricas entre áreas o trabajadores.
          </p>
        </div>
        <button
          onClick={exportarPDF}
          disabled={isExporting || loading || chartData.length === 0}
          className="flex items-center gap-2 bg-[#123498] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0c2473] hover:shadow-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Generando Reporte..." : "Exportar a PDF"}
        </button>
      </div>

      {/* Filtro de Fechas */}
      <div className="bg-white p-5 rounded-4xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest px-2">
          <Calendar className="w-4 h-4" /> Rango de Fechas:
        </div>
        <select
          value={periodo}
          onChange={(e) => handlePeriodoChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-[#123498] focus:ring-2 transition-all"
        >
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 3 meses</option>
          <option value="180">Últimos 6 meses</option>
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-[#123498] transition-all"
        />
        <span className="text-xs font-black text-slate-300 uppercase">─</span>
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-[#123498] transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-4xl border border-slate-100 shadow-sm inline-flex gap-2">
        <button
          onClick={() => setTipoComparacion("areas")}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            isAreas
              ? "bg-[#123498] text-white shadow-md shadow-[#123498]/20"
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
              ? "bg-[#123498] text-white shadow-md shadow-[#123498]/20"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Trabajador vs Trabajador
        </button>
      </div>

      {/* Selectores de Entidad A y B */}
      <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={entidadAId}
            onChange={(e) => setEntidadAId(e.target.value)}
            className="flex-1 bg-white border border-[#123498]/30 text-[#123498] text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-[#123498] focus:ring-2 transition-all"
          >
            {entidadesSelect.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre || e.name} {!isAreas && e.area ? ` — ${e.area}` : ""}
              </option>
            ))}
          </select>
          <span className="text-xs font-black text-slate-300 uppercase shrink-0">
            VS
          </span>
          <select
            value={entidadBId}
            onChange={(e) => setEntidadBId(e.target.value)}
            className="flex-1 bg-white border border-[#F46F0B]/30 text-[#F46F0B] text-xs font-bold rounded-xl py-3 px-4 outline-none focus:border-[#F46F0B] focus:ring-2 transition-all"
          >
            {entidadesSelect.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre || e.name} {!isAreas && e.area ? ` — ${e.area}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#123498] border-t-[#F46F0B] rounded-full animate-spin"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-sm">
          <BarChart2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="font-bold text-slate-500">
            No hay datos suficientes para comparar estas entidades.
          </p>
        </div>
      ) : (
        <div
          ref={dashboardRef}
          className="space-y-8 p-1 rounded-3xl bg-transparent"
        >
          {/* Resumen del Enfrentamiento */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              <div className="md:col-span-2 text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Ganador del Enfrentamiento
                </p>
                <p className="text-2xl font-extrabold text-[#123498]">
                  {Number(promedioA) > Number(promedioB)
                    ? entidadANombre
                    : Number(promedioA) === Number(promedioB)
                      ? "Empate Técnico"
                      : entidadBNombre}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  {metricasGanadasA} a favor vs {metricasGanadasB} en contra
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
                      className="h-full bg-[#123498] rounded-full transition-all duration-500"
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
                      className="h-full bg-[#F46F0B] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Number(promedioB), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Diferencia Promedio
                </p>
                <p className="text-3xl font-extrabold text-[#123498]">
                  {Math.abs(promedioA - promedioB).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico Comparativo */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-lg text-[#123498] text-center mb-8 uppercase tracking-widest">
              {entidadANombre} vs {entidadBNombre}
            </h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
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
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#123498]">
                      Métrica Evaluada
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#123498]">
                      {entidadANombre}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#F46F0B]">
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
                    const ganador =
                      diff === 0
                        ? "Empate"
                        : isAPositive
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
                          {diff === 0 ? (
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500">
                              Iguales
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-black px-2 py-1 rounded-lg ${isAPositive ? "bg-[#123498]/10 text-[#123498]" : "bg-[#F46F0B]/10 text-[#F46F0B]"}`}
                            >
                              {Math.abs(diff).toFixed(1)}% a favor de {ganador}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
