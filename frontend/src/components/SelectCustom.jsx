import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function SelectCustom({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  className = "",
  accentColor = "#123498",
  disabled = false,
  icon = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
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
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
