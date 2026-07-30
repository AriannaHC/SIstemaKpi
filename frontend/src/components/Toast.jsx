// src/components/Toast.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Se cierra tras 4 segundos
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const isSuccess = type === "success" || type === "ok";

  const toastContent = (
    // AnimatePresence detecta cuando el elemento interior desaparece para animar su salida
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-6 right-6 z-9999"
        >
          <div
            className={`bg-white border rounded-2xl shadow-xl p-4 flex items-start gap-3 w-80 sm:w-96 relative overflow-hidden ${
              isSuccess
                ? "border-green-200 shadow-green-900/5"
                : "border-red-200 shadow-rojo-persa/10"
            }`}
          >
            {/* Barra lateral de acento de color */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                isSuccess ? "bg-green-500" : "bg-rojo-persa"
              }`}
            />

            {/* Icono */}
            <div
              className={`shrink-0 p-2 rounded-xl flex items-center justify-center ${
                isSuccess
                  ? "bg-green-50 text-green-600"
                  : "bg-rojo-persa/10 text-rojo-persa"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            {/* Contenido */}
            <div className="flex-1 pt-0.5">
              <h4
                className={`text-[10px] font-black uppercase tracking-widest font-heading mb-1 ${
                  isSuccess ? "text-green-700" : "text-rojo-persa"
                }`}
              >
                {isSuccess ? "Operación Exitosa" : "Error"}
              </h4>
              <p className="text-sm font-semibold text-slate-600 leading-snug pr-4">
                {message}
              </p>
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Verificamos que estamos en el cliente antes de usar el portal (buena práctica)
  if (typeof window === "undefined") return null;

  return createPortal(toastContent, document.body);
}
