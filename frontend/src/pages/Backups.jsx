import React from "react";
import { HardDriveDownload, Database } from "lucide-react";

export default function Backups() {
  // TODO PARA JESÚS:
  // 1. Crear un botón gigante "Generar Nuevo Respaldo (.SQL)". Al hacer clic, debe abrir un Modal de confirmación.
  // 2. Maquetar una lista/tabla de "Historial de Respaldos" con datos falsos (Ej: "backup_20260616.sql - 14MB").
  // 3. Agregar botón de "Descargar" al lado de cada ítem de la tabla.

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-[#123498] font-heading">
          Respaldos de <span className="text-[#F46F0B]">Base de Datos</span>
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Genera y descarga volcados de seguridad del sistema.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex items-center justify-center min-h-[300px]">
        <div className="text-center text-slate-400">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="font-bold">
            Jesús: Aquí va el botón principal de Backup y la tabla de historial
          </p>
        </div>
      </div>
    </div>
  );
}
