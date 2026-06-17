import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Database,
  Download,
  FileArchive,
  HardDriveDownload,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";

const historialInicial = [
  {
    id: 1,
    nombre: "backup_20260616_0900.sql",
    fecha: "16 jun 2026",
    hora: "09:00 AM",
    tamano: "14.8 MB",
    estado: "Completo",
  },
  {
    id: 2,
    nombre: "backup_20260615_1800.sql",
    fecha: "15 jun 2026",
    hora: "06:00 PM",
    tamano: "14.2 MB",
    estado: "Completo",
  },
  {
    id: 3,
    nombre: "backup_20260614_1800.sql",
    fecha: "14 jun 2026",
    hora: "06:00 PM",
    tamano: "13.9 MB",
    estado: "Completo",
  },
];

export default function Backups() {
  const [modalOpen, setModalOpen] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [historial, setHistorial] = useState(historialInicial);

  const generarRespaldo = () => {
    setGenerando(true);

    setTimeout(() => {
      const now = new Date();
      const stamp = now
        .toISOString()
        .slice(0, 16)
        .replace("T", "_")
        .replace(":", "");

      setHistorial((prev) => [
        {
          id: Date.now(),
          nombre: `backup_${stamp}.sql`,
          fecha: now.toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          hora: now.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          tamano: "15.1 MB",
          estado: "Completo",
        },
        ...prev,
      ]);
      setGenerando(false);
      setModalOpen(false);
    }, 900);
  };

  const descargarRespaldo = (backup) => {
    const contenido = [
      "-- Respaldo de base de datos Sistema KPI JB",
      `-- Archivo: ${backup.nombre}`,
      `-- Fecha: ${backup.fecha} ${backup.hora}`,
      "",
      "CREATE DATABASE IF NOT EXISTS sistema_kpi_jb;",
      "USE sistema_kpi_jb;",
      "",
      "-- Volcado de demostracion para descarga desde la maqueta.",
    ].join("\n");

    const blob = new Blob([contenido], { type: "application/sql" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backup.nombre;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-turquesa">
          Seguridad del sistema
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-azul font-heading">
              Respaldos de <span className="text-naranja">Base de Datos</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Genera y descarga volcados de seguridad del sistema.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amarillo-hansa/15 px-4 py-2 text-xs font-black text-azul border border-amarillo-hansa/30 w-max">
            <ShieldCheck className="w-4 h-4 text-naranja" />
            {historial.length} respaldos disponibles
          </span>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="p-6 md:p-8 bg-linear-to-br from-azul/8 via-white to-naranja/8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-azul text-white flex items-center justify-center shadow-lg shadow-azul/20 shrink-0">
                <Database className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-naranja">
                  Respaldo manual
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl font-black text-azul font-heading leading-tight">
                  Generar nuevo archivo de seguridad
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500 font-medium max-w-2xl">
                  Crea un volcado SQL con la informacion actual del sistema para
                  conservarlo como copia de respaldo.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="min-h-14 rounded-2xl bg-azul px-6 py-4 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-azul/20 hover:bg-azul-marino transition-all flex items-center justify-center gap-3"
              >
                <HardDriveDownload className="w-5 h-5" />
                Generar Nuevo Respaldo (.SQL)
              </button>
              <div className="rounded-2xl border border-azul/10 bg-white px-5 py-4 flex items-center gap-3">
                <Server className="w-5 h-5 text-turquesa shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Formato de salida
                  </p>
                  <p className="text-sm font-black text-azul">Archivo SQL</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 border-t xl:border-t-0 xl:border-l border-slate-100 bg-slate-50/60">
            <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
              <div className="rounded-2xl bg-white border border-slate-100 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ultimo respaldo
                </p>
                <p className="mt-2 text-lg font-black text-azul">
                  {historial[0]?.fecha}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {historial[0]?.hora}
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Peso reciente
                </p>
                <p className="mt-2 text-lg font-black text-naranja">
                  {historial[0]?.tamano}
                </p>
                <p className="text-xs font-bold text-slate-500">Base actual</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Estado
                </p>
                <p className="mt-2 text-lg font-black text-azul">Disponible</p>
                <p className="text-xs font-bold text-turquesa">
                  Listo para descargar
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-turquesa">
              Control de copias
            </p>
            <h2 className="text-xl font-black text-azul font-heading mt-2">
              Historial de Respaldos
            </h2>
          </div>
          <p className="text-sm font-bold text-slate-500 max-w-md">
            Cada respaldo queda listado con su fecha, peso y boton de descarga.
          </p>
        </div>

        <div className="p-4 md:p-6 bg-slate-50/70 space-y-4">
          {historial.map((backup) => (
            <article
              key={backup.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr_0.45fr_0.65fr_0.55fr] gap-4 lg:items-center">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-azul/10 text-azul flex items-center justify-center shrink-0">
                    <FileArchive className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-black text-azul-profundo truncate">
                      {backup.nombre}
                    </p>
                    <p className="text-xs text-slate-400 font-bold">
                      Volcado de base de datos SQL
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <CalendarClock className="w-5 h-5 text-naranja shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Fecha
                    </p>
                    <p className="text-sm font-black text-slate-700">
                      {backup.fecha} - {backup.hora}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Tamano
                  </p>
                  <p className="text-sm font-black text-slate-700">
                    {backup.tamano}
                  </p>
                </div>

                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-turquesa/10 px-3 py-2 text-xs font-black text-azul border border-turquesa/30">
                    <CheckCircle2 className="w-4 h-4 text-turquesa" />
                    {backup.estado}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => descargarRespaldo(backup)}
                  className="min-h-11 w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-naranja px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-naranja/20 hover:bg-orange-600 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-9999 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-naranja uppercase tracking-widest">
                  Confirmacion
                </p>
                <h3 className="text-lg font-black text-azul font-heading">
                  Generar respaldo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-rojo-persa hover:bg-rojo-persa/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-azul/10 text-azul flex items-center justify-center mb-5">
                <HardDriveDownload className="w-7 h-7" />
              </div>
              <p className="text-sm leading-6 text-slate-600 font-medium">
                Se creara un archivo .sql con la informacion actual de la base
                de datos y se anadira al historial de respaldos.
              </p>
            </div>

            <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={generarRespaldo}
                disabled={generando}
                className="rounded-2xl bg-azul px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-azul/20 hover:bg-azul-marino disabled:bg-slate-300 disabled:text-slate-500 transition-all flex items-center justify-center gap-2"
              >
                {generando ? (
                  "Generando..."
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
