import React, { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Filter,
  TrendingUp,
  Award,
  Calendar,
  X,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

import { analyticsService } from "../services/analyticsService";
import { kpiService } from "../services/kpiService";
import SelectCustom from "../components/SelectCustom";

// --- YA NO USAMOS EL MOCK COMPLETO, SOLO LOS NOMBRES DE LAS MÉTRICAS ---
const metricasPerfil = [
  "Cumplimiento",
  "Eficacia",
  "Eficiencia",
  "Rendimiento",
];

// helper: convierte un dataURL PNG a dimensiones reales del canvas
function pngDataUrlDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = dataUrl;
  });
}

export default function Analitica() {
  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("2026");

  const [areas, setAreas] = useState([]);
  const [participacion, setParticipacion] = useState([]);
  const [dataEvolucion, setDataEvolucion] = useState([]);
  const [dataPerfilApi, setDataPerfilApi] = useState({
    promedioGral: [0, 0, 0, 0],
    areaValor: [],
  });
  const [loading, setLoading] = useState(true);

  // Estados Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("top");

  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef(null);
  const rankingPdfRef = useRef(null);

  useEffect(() => {
    kpiService
      .getAreasStats()
      .then(setAreas)
      .catch((err) => {
        console.warn("Áreas no disponibles aún (404 esperado):", err.message);
        setAreas([]);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsService.getParticipacion(filtroArea, filtroMes, filtroAnio),
      analyticsService.getEvolucion(filtroArea, filtroMes, filtroAnio),
      analyticsService.getPerfil(filtroArea, filtroMes, filtroAnio),
    ])
      .then(([resPart, resEvo, resPerf]) => {
        setParticipacion(resPart);
        setDataEvolucion(resEvo);
        setDataPerfilApi(resPerf);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filtroArea, filtroMes, filtroAnio]);

  const areaSelNombre =
    filtroArea === "todas"
      ? "Todas las Áreas"
      : (areas.find((a) => a.id.toString() === filtroArea)?.nombre ?? "Área");

  const perfilData = useMemo(() => {
    return metricasPerfil.map((metrica, i) => ({
      metrica,
      promedio: dataPerfilApi.promedioGral[i] || 0,
      valor:
        dataPerfilApi.areaValor.length > 0 ? dataPerfilApi.areaValor[i] : 0,
    }));
  }, [dataPerfilApi]);

  const rankingCompleto = useMemo(() => {
    return [...participacion].sort((a, b) => b.score - a.score);
  }, [participacion]);

  const topRanking = rankingCompleto.slice(0, 5);

  const rankingModal =
    modalType === "top" ? rankingCompleto : [...rankingCompleto].reverse();

  const estadoGeneralData = useMemo(() => {
    let cumplido = 0,
      enRiesgo = 0,
      incumplido = 0;
    participacion.forEach((p) => {
      if (p.score >= 60) cumplido++;
      else if (p.score >= 30) enRiesgo++;
      else incumplido++;
    });

    const total = participacion.length || 1;
    return [
      {
        name: "Buen Rendimiento",
        value: Math.round((cumplido / total) * 100),
        color: "#22c55e",
      },
      {
        name: "Atención Requerida",
        value: Math.round((enRiesgo / total) * 100),
        color: "#eab308",
      },
      {
        name: "Crítico",
        value: Math.round((incumplido / total) * 100),
        color: "#ef4444",
      },
    ];
  }, [participacion]);

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORTAR A PDF
  // ─────────────────────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    if (!dashboardRef.current) return;
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
      filter: (node) => {
        if (node.nodeType !== 1) return true;
        const el = /** @type {HTMLElement} */ (node);
        const style = el.getAttribute?.("style") || "";
        if (style.includes("-9999px")) return false;
        return true;
      },
    };

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();

      // ── Página 1: Dashboard con gráficos ──────────────────────────────
      const dashImgData = await toPng(dashboardRef.current, {
        ...toPngOpts,
        backgroundColor: "#f8fafc",
      });

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

      // ── Página 2: Tabla de ranking completo ───────────────────────────
      if (rankingPdfRef.current) {
        const rankImgData = await toPng(rankingPdfRef.current, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });

        const { w: rw, h: rh } = await pngDataUrlDimensions(rankImgData);
        const rankHeightMm = (rh * pdfWidth) / rw;

        pdf.addPage();

        if (rankHeightMm <= pageHeightMm) {
          pdf.addImage(rankImgData, "PNG", 0, 0, pdfWidth, rankHeightMm);
        } else {
          let yOffset = 0;
          while (yOffset < rankHeightMm) {
            if (yOffset > 0) pdf.addPage();
            pdf.addImage(
              rankImgData,
              "PNG",
              0,
              -yOffset,
              pdfWidth,
              rankHeightMm,
            );
            yOffset += pageHeightMm;
          }
        }
      }

      pdf.save(`Reporte_Analitica_${areaSelNombre.replace(/\s+/g, "_")}.pdf`);
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
    <>
      <div className="space-y-8 max-w-7xl mx-auto">
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
          <button
            onClick={exportarPDF}
            disabled={isExporting || loading}
            className="flex items-center gap-2 bg-[#123498] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0c2473] hover:shadow-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Generando Reporte..." : "Exportar a PDF"}
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-5 rounded-4xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest px-2">
            <Filter className="w-4 h-4" /> Segmentar por:
          </div>

          <SelectCustom
            value={filtroArea}
            onChange={setFiltroArea}
            options={[
              { value: "todas", label: "Todas las Áreas" },
              ...areas.map((a) => ({ value: String(a.id), label: a.nombre })),
            ]}
            className="w-44"
          />

          <SelectCustom
            value={filtroMes}
            onChange={setFiltroMes}
            options={[
              { value: "", label: "Todos los meses" },
              { value: "1", label: "Enero" },
              { value: "2", label: "Febrero" },
              { value: "3", label: "Marzo" },
              { value: "4", label: "Abril" },
              { value: "5", label: "Mayo" },
              { value: "6", label: "Junio" },
              { value: "7", label: "Julio" },
              { value: "8", label: "Agosto" },
              { value: "9", label: "Septiembre" },
              { value: "10", label: "Octubre" },
              { value: "11", label: "Noviembre" },
              { value: "12", label: "Diciembre" },
            ]}
            className="w-36"
          />

          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <SelectCustom
              value={filtroAnio}
              onChange={setFiltroAnio}
              options={[{ value: "2026", label: "2026" }]}
              className="w-24"
            />
          </div>
        </div>

        {/* ── CONTENEDOR PARA EXPORTAR A PDF ─────────────────────────────────── */}
        <div
          ref={dashboardRef}
          className="space-y-8 p-1 rounded-3xl bg-transparent"
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#123498] border-t-[#F46F0B] rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Evolución */}
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
                      {areaSelNombre} — Tendencia histórica
                    </p>
                  </div>
                </div>
                <div style={{ width: "100%", height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dataEvolucion}
                      // FIX 1: Quitamos el left: -20 y le damos un margen positivo
                      margin={{ top: 40, right: 20, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="gradCumplimiento"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#93c5fd"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="95%"
                            stopColor="#93c5fd"
                            stopOpacity={0.05}
                          />
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
                        tick={{
                          fontSize: 12,
                          fill: "#64748b",
                          fontWeight: 600,
                        }}
                        dy={10}
                      />
                      <YAxis
                        width={45}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: "#64748b",
                          fontWeight: 600,
                        }}
                        domain={[0, "auto"]}
                        // FIX: Agregamos el formateador de ticks para que ponga el "%"
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(v) => [`${v}%`, "Cumplimiento"]}
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: "20px",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumplimiento"
                        name="Cumplimiento"
                        stroke="#F46F0B"
                        strokeWidth={3}
                        fill="url(#gradCumplimiento)"
                        dot={{ fill: "#F46F0B", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 7 }}
                        isAnimationActive={false}
                      >
                        {/* El LabelList DEBE ir por dentro (como hijo) del Area */}
                        <LabelList
                          dataKey="cumplimiento"
                          position="top"
                          offset={10}
                          formatter={(val) => `${val}%`}
                          style={{
                            fontSize: "10px",
                            fill: "#F46F0B",
                            fontWeight: "bold",
                          }}
                        />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Perfil de Rendimiento */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#123498]/10 rounded-2xl">
                    <Award className="w-6 h-6 text-[#123498]" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#123498]">
                      Perfil de Rendimiento
                    </h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                      {areaSelNombre} — Métricas vs Promedio General
                    </p>
                  </div>
                </div>
                <div style={{ width: "100%", height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={perfilData}
                      margin={{ top: 40, right: 10, left: -20, bottom: 5 }}
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
                        tick={{
                          fontSize: 12,
                          fill: "#64748b",
                          fontWeight: 700,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: "#64748b",
                          fontWeight: 600,
                        }}
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
                        isAnimationActive={false} // <-- Evita el corte en PDF
                      >
                        <LabelList
                          dataKey="promedio"
                          position="top"
                          formatter={(val) => `${val}%`}
                          style={{
                            fontSize: "10px",
                            fill: "#64748b",
                            fontWeight: "bold",
                          }}
                        />
                      </Bar>
                      {filtroArea !== "todas" && (
                        <Bar
                          dataKey="valor"
                          name={areaSelNombre}
                          fill="#123498"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                          isAnimationActive={false} // <-- Evita el corte en PDF
                        >
                          <LabelList
                            dataKey="valor"
                            position="top"
                            formatter={(val) => `${val}%`}
                            style={{
                              fontSize: "10px",
                              fill: "#123498",
                              fontWeight: "bold",
                            }}
                          />
                        </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 2: Donut + Ranking Global */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* DonutChart — Estado General */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#123498]/10 rounded-2xl">
                      <PieChart className="w-6 h-6 text-[#123498]" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-[#123498]">
                        Estado General
                      </h3>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                        Distribución de Cumplimiento
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex-1"
                    style={{ width: "100%", minHeight: 300 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={estadoGeneralData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={1}
                          dataKey="value"
                          label={({ value }) => (value > 0 ? `${value}%` : "")}
                          labelLine={false}
                          isAnimationActive={false}
                        >
                          {estadoGeneralData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>

                        {/* FIX 3: Tooltip simplificado al hacer hover (solo muestra el porcentaje) */}
                        <Tooltip
                          contentStyle={{
                            borderRadius: "16px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value) => [`${value}%`, ""]}
                          separator=""
                        />

                        {/* FIX 4: Agregamos la leyenda en la parte inferior */}
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#64748b",
                            paddingTop: "20px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Única Tarjeta: TOP RENDIMIENTO */}
                <div
                  onClick={() => setShowModal(true)}
                  className="lg:col-span-3 bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm p-8 flex flex-col hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 rounded-2xl">
                        <Award className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-emerald-700">
                          Top Rendimiento
                        </h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                          Mejores colaboradores del área
                        </p>
                      </div>
                    </div>
                    <Users className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>

                  <div className="space-y-4 flex-1">
                    {topRanking.length > 0 ? (
                      topRanking.map((user, i) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-emerald-200 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 flex items-center justify-center font-black text-slate-400 bg-white rounded-full shadow-sm">
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
                          <span
                            className={`font-black px-4 py-2 rounded-xl text-sm ${
                              user.score >= 60
                                ? "bg-emerald-100 text-emerald-700"
                                : user.score >= 30
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.score}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-sm font-bold text-center py-10">
                        Sin datos de participación
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest group-hover:underline">
                      Haga clic para ver el ranking global completo
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TABLA OCULTA PARA EXPORTACIÓN DEL RANKING EN PDF ── */}
      <div className="absolute -left-2499.75 -top-2499.75">
        <div ref={rankingPdfRef} className="w-200 bg-white p-10">
          <h2 className="text-2xl font-black text-[#123498] mb-2">
            Ranking Global de Colaboradores
          </h2>
          <p className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-widest">
            Reporte de: {areaSelNombre}
          </p>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-[#123498]">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-[#123498]">
                  Pos
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-[#123498]">
                  Colaborador
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-[#123498]">
                  Área
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-[#123498] text-right">
                  Rendimiento
                </th>
              </tr>
            </thead>
            <tbody>
              {rankingCompleto.map((user, idx) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-sm font-black text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">
                    {user.nombre}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-500">
                    {user.area}
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-right text-[#123498]">
                    {user.score}%
                  </td>
                </tr>
              ))}
              {rankingCompleto.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-6 text-sm text-slate-400 font-bold"
                  >
                    Sin datos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Tabla Completa de Ranking en pantalla ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-4xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-emerald-700">
                      Ranking Global
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Del mejor al peor rendimiento
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-0 overflow-y-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">
                        Pos
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#123498]">
                        Colaborador
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#123498]">
                        Área
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#123498] text-right">
                        Rendimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankingCompleto.map((user, idx) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-black text-slate-300">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {user.nombre}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {user.area}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-block font-black px-3 py-1.5 rounded-lg text-xs ${
                              user.score >= 60
                                ? "bg-emerald-100 text-emerald-700"
                                : user.score >= 30
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {rankingCompleto.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-8 text-sm font-bold text-slate-400"
                        >
                          No hay datos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
