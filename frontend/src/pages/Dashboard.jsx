// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { kpiService } from '../services/kpiService';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Simulación de carga de tabla
  useEffect(() => {
    setDashboardData([
      {
        id: 2, nombre: "Desarrollo y Programación Web",
        kpis: [
          { id: 1, nombre: "Posicionamiento Keywords", tipo_kpi: "Positivo", formula_texto: "Ranking en Google" },
          { id: 2, nombre: "Velocidad de Carga", tipo_kpi: "Positivo", formula_texto: "PageSpeed Insights (0–100)" },
          { id: 3, nombre: "Errores 404", tipo_kpi: "Negativo", formula_texto: "Nº de páginas con error" }
        ]
      }
    ]);
  }, []);

  const handleUploadArea = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    alert("Simulación: Excel de área procesado. Integrando con FastAPI pronto.");
    setIsUploading(false);
  };

  const handleUploadSmart = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    alert("Simulación: Diccionario SMART vinculado con éxito.");
    setIsUploading(false);
  };

  const handleDeleteArea = (id, nombre) => {
    if (window.confirm(`⚠️ ¡CUIDADO!\n\n¿Seguro que deseas eliminar el área "${nombre}" y todos sus KPIs?`)) {
      alert("Simulación: Área eliminada.");
    }
  };

  const handleDeleteKpi = (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar el KPI "${nombre}"?`)) {
      alert("Simulación: KPI eliminado.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* TARJETA 1: CENTRO DE IMPORTACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-azul/10 p-6 md:p-8">
        <h2 className="text-xl font-bold text-azul-profundo text-center mb-6">⚙️ Centro de Importación</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subida 1 */}
          <div className="bg-azul/5 border border-azul/15 rounded-lg p-5">
            <h3 className="font-bold text-azul-profundo mb-1">1. Subir Excel de Área</h3>
            <p className="text-xs text-gris-texto mb-4">Crea las estructuras y campos básicos.</p>
            <form onSubmit={handleUploadArea} className="flex flex-col gap-3">
              <input type="file" accept=".xlsx" required className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-azul/10 file:text-azul hover:file:bg-azul/20"/>
              <button type="submit" disabled={isUploading} className="bg-turquesa text-white font-bold py-2 rounded-lg hover:bg-turquesa/80 transition-colors text-sm">
                Interpretar Área
              </button>
            </form>
          </div>

          {/* Subida 2 */}
          <div className="bg-azul/5 border border-azul/15 rounded-lg p-5">
            <h3 className="font-bold text-azul-profundo mb-1">2. Subir Diccionario SMART</h3>
            <p className="text-xs text-gris-texto mb-4">Autoconfigura matemáticamente Positivos/Negativos.</p>
            <form onSubmit={handleUploadSmart} className="flex flex-col gap-3">
              <input type="file" accept=".xlsx" required className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-naranja/10 file:text-naranja hover:file:bg-naranja/20"/>
              <button type="submit" disabled={isUploading} className="bg-naranja text-white font-bold py-2 rounded-lg hover:bg-naranja-oscuro transition-colors text-sm">
                Vincular Inteligencia
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* TARJETA 2: TABLA DE ADMINISTRACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-azul/10 p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-azul-profundo">Panel de Administración de KPIs</h2>
          <p className="text-sm text-gris-texto mt-1">Gestiona las áreas y revisa el tipo de KPI asignado.</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-azul/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-azul/5 text-azul-profundo text-xs uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Área / Nombre del KPI</th>
                <th className="px-4 py-3 w-1/4">Fórmula</th>
                <th className="px-4 py-3 w-1/4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-azul/5">
              {dashboardData.map(area => (
                <React.Fragment key={`area-${area.id}`}>
                  {/* Fila del Área */}
                  <tr className="bg-gray-50 font-bold text-azul-profundo">
                    <td className="px-4 py-3">📂 {area.nombre}</td>
                    <td className="px-4 py-3 text-gris-texto">-</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeleteArea(area.id, area.nombre)} className="bg-rojo-persa/10 text-rojo-persa hover:bg-rojo-persa hover:text-white px-3 py-1 rounded text-xs transition-colors">
                        Eliminar Área
                      </button>
                    </td>
                  </tr>
                  
                  {/* Filas de los KPIs */}
                  {area.kpis.map(kpi => (
                    <tr key={`kpi-${kpi.id}`} className="hover:bg-azul/5 transition-colors">
                      <td className="px-4 py-3 pl-8 flex items-center gap-2">
                        📄 {kpi.nombre}
                        <span className={`px-2 py-0.5 rounded text-[10px] text-white ${kpi.tipo_kpi === 'Negativo' ? 'bg-rojo-persa' : 'bg-turquesa'}`}>
                          {kpi.tipo_kpi}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gris-oscuro">{kpi.formula_texto}</td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button className="bg-turquesa/10 text-turquesa hover:bg-turquesa hover:text-white px-2 py-1 rounded text-xs transition-colors">📝 Llenar</button>
                        <button className="bg-azul/10 text-azul hover:bg-azul hover:text-white px-2 py-1 rounded text-xs transition-colors">✏️ Editar</button>
                        <button onClick={() => handleDeleteKpi(kpi.id, kpi.nombre)} className="bg-amarillo-hansa/20 text-amarillo-hansa hover:bg-amarillo-hansa hover:text-white px-2 py-1 rounded text-xs transition-colors">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}