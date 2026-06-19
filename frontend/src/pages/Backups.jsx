import React, { useState, useEffect } from "react";
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
import { backupService } from "../services/backupService";

// Función de ayuda para formatear "YYYY-MM-DD HH:MM:SS" a un formato más legible
const formatDateTime = (dateString) => {
  if (!dateString) return { fecha: "N/A", hora: "" };
  // Reemplazar espacio por T para que Safari/iOS lo lea bien
  const safeDate = new Date(dateString.replace(" ", "T"));

  if (isNaN(safeDate.getTime())) return { fecha: dateString, hora: "" };

  const fecha = safeDate.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hora = safeDate.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { fecha, hora };
};

export default function Backups() {
  const [modalOpen, setModalOpen] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]);

  // 1. Cargar el historial al montar el componente
  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await backupService.getList();
      setHistorial(data);
    } catch (error) {
      console.error("Error al cargar el historial de backups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // 2. Generar un nuevo volcado SQL real
  const generarRespaldo = async () => {
    setGenerando(true);
    try {
      await backupService.generateBackup();
      await cargarHistorial(); // Refrescamos la lista para ver el nuevo archivo
      setModalOpen(false);
    } catch (error) {
      console.error("Error al generar respaldo:", error);
      alert("Hubo un error al generar el archivo de respaldo.");
    } finally {
      setGenerando(false);
    }
  };

  // 3. Descargar el .sql físico desde el servidor
  const descargarRespaldo = async (filename) => {
    try {
      await backupService.downloadBackup(filename);
    } catch (error) {
      console.error("Error al descargar respaldo:", error);
      alert("El archivo no se pudo descargar o ya no existe en el servidor.");
    }
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
                  Generar nuevo archivo para backup
                </h2>
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
                  Último respaldo
                </p>
                {historial.length > 0 ? (
                  <>
                    <p className="mt-2 text-lg font-black text-azul">
                      {formatDateTime(historial[0].created_at).fecha}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      {formatDateTime(historial[0].created_at).hora}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-black text-slate-400">
                    Ninguno
                  </p>
                )}
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Peso reciente
                </p>
                <p className="mt-2 text-lg font-black text-naranja">
                  {historial.length > 0 ? `${historial[0].size_mb} MB` : "0 MB"}
                </p>
                <p className="text-xs font-bold text-slate-500">Base actual</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-100 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Estado
                </p>
                <p className="mt-2 text-lg font-black text-azul">
                  {historial.length > 0 ? "Disponible" : "Vacío"}
                </p>
                <p className="text-xs font-bold text-turquesa">
                  {historial.length > 0
                    ? "Listo para descargar"
                    : "Genera uno nuevo"}
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
        </div>

        <div className="p-4 md:p-6 bg-slate-50/70 space-y-4 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-azul border-t-naranja rounded-full animate-spin"></div>
            </div>
          ) : historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400">
              <FileArchive className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-black text-sm">
                No hay respaldos generados aún.
              </p>
            </div>
          ) : (
            historial.map((backup) => {
              const { fecha, hora } = formatDateTime(backup.created_at);
              return (
                <article
                  key={backup.filename}
                  className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr_0.45fr_0.65fr_0.55fr] gap-4 lg:items-center">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-azul/10 text-azul flex items-center justify-center shrink-0">
                        <FileArchive className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-black text-azul-profundo truncate">
                          {backup.filename}
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
                          {fecha} - {hora}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Tamaño
                      </p>
                      <p className="text-sm font-black text-slate-700">
                        {backup.size_mb} MB
                      </p>
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-turquesa/10 px-3 py-2 text-xs font-black text-azul border border-turquesa/30">
                        <CheckCircle2 className="w-4 h-4 text-turquesa" />
                        Completo
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => descargarRespaldo(backup.filename)}
                      className="min-h-11 w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-naranja px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-naranja/20 hover:bg-orange-600 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
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
                onClick={() => !generando && setModalOpen(false)}
                disabled={generando}
                className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-azul/10 text-azul flex items-center justify-center mb-5">
                <HardDriveDownload className="w-7 h-7" />
              </div>
              <p className="text-sm leading-6 text-slate-600 font-medium">
                Se creará un archivo .sql con la información actual de la base
                de datos (Módulo de KPIs) y se añadirá al historial de
                respaldos.
              </p>
            </div>

            <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={generando}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={generarRespaldo}
                disabled={generando}
                className="rounded-2xl bg-azul px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-azul/20 hover:bg-[#0c2473] disabled:bg-slate-300 disabled:text-slate-500 transition-all flex items-center justify-center gap-2"
              >
                {generando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generando...
                  </>
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
