const kpiNames = [
  "Producción Diaria",
  "Eficiencia de Línea",
  "Control de Calidad",
  "Cumplimiento de Entregas",
  "Productividad por Hora",
  "Uso de Maquinaria",
  "Consumo de Materia Prima",
  "Horas de Parada No Planificada",
  "Rendimiento de Personal",
  "Tasa de Rechazo",
  "Eficiencia Energética",
  "Cumplimiento de Mantenimiento",
  "Producción por Turno",
  "Índice de Seguridad",
  "Rotación de Inventario",
  "Costo por Unidad",
  "Tiempo de Ciclo",
  "Precisión de Inventario",
  "Cumplimiento de Estándares",
  "Capacidad Utilizada",
];

const alertas = ["verde", "amarillo", "rojo", null];
const estados = ["enviado", "enviado", "enviado", "no_reportado"];

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split("T")[0];
}

const mockReportes = Array.from({ length: 25 }, (_, i) => {
  const alerta = alertas[Math.floor(Math.random() * alertas.length)];
  const estado = estados[Math.floor(Math.random() * estados.length)];
  const cumplimiento = alerta === "verde" ? 0.8 + Math.random() * 0.2
    : alerta === "amarillo" ? 0.6 + Math.random() * 0.2
    : alerta === "rojo" ? Math.random() * 0.6
    : null;

  const semanaOffset = Math.floor(i / 5);
  const inicio = new Date(2025, 0, 1);
  inicio.setDate(inicio.getDate() + semanaOffset * 7);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);

  return {
    id: i + 1,
    kpi_nombre: `${kpiNames[i % kpiNames.length]} - Semana ${semanaOffset + 1}`,
    estado,
    alerta,
    cumplimiento,
    valor_semanal: cumplimiento !== null ? parseFloat((cumplimiento * 85 + Math.random() * 15).toFixed(2)) : null,
    periodo_inicio: inicio.toISOString().split("T")[0],
    periodo_fin: fin.toISOString().split("T")[0],
    enviado_en: estado === "enviado" ? `${fin.toISOString().split("T")[0]}T${String(17 + Math.floor(Math.random() * 4)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00` : null,
  };
});

export default mockReportes;
