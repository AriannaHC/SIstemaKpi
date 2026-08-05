import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";

// Quita tildes y pasa a minúsculas, para comparar sin importar acentos ni mayúsculas
const normalizar = (texto) =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function SelectCustom({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  className = "",
  accentColor = "#123498",
  disabled = false,
  icon = null,
  searchable, // opcional: true/false fuerza mostrar u ocultar el buscador
  searchPlaceholder = "Buscar...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Cierra el dropdown y limpia la búsqueda
  const cerrar = () => {
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) cerrar();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Al abrir, enfoca el input para escribir de inmediato
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const selected = options.find((o) => String(o.value) === String(value));

  // Muestra el buscador solo si la lista es larga (o si lo fuerzas con la prop)
  const mostrarBuscador = searchable ?? options.length > 8;

  // Lista filtrada según lo que se escribe
  const opcionesFiltradas = useMemo(() => {
    if (!mostrarBuscador || !query.trim()) return options;
    const q = normalizar(query);
    return options.filter((o) => normalizar(o.label).includes(q));
  }, [options, query, mostrarBuscador]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (isOpen ? cerrar() : !disabled && setIsOpen(true))}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2.5 px-4 outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: focused ? accentColor : undefined,
          boxShadow: focused ? `0 0 0 3px ${accentColor}1A` : undefined,
        }}
        onFocus={() => !disabled && setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && (
            <span className="w-4 h-4 shrink-0 text-gray-400 flex items-center justify-center">
              {icon}
            </span>
          )}
          <span
            className={`truncate ${
              selected ? "text-slate-700" : "text-slate-400"
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            {mostrarBuscador && (
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {opcionesFiltradas.length === 0 ? (
                <div className="px-4 py-3 text-xs font-bold text-slate-400 text-center">
                  Sin resultados
                </div>
              ) : (
                opcionesFiltradas.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      cerrar();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer text-slate-600 hover:bg-slate-100"
                    style={{
                      backgroundColor:
                        opt.value === value ? accentColor : undefined,
                      color: opt.value === value ? "#fff" : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}