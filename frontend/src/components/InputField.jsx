import { Eye, EyeOff } from "lucide-react";

export default function InputField({
  label,
  id,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  showToggle,
  showPassword,
  onTogglePassword,
  accentColor = "var(--azul)",
}) {
  const handleFocus = (e) => {
    e.target.style.borderColor = accentColor;
    e.target.style.boxShadow = `0 0 0 4px ${accentColor}16`;
    e.target.style.backgroundColor = "#FFFFFF";
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = "var(--gris-borde)";
    e.target.style.boxShadow = "none";
    e.target.style.backgroundColor = "#FFFFFF";
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2.5 block text-[11px] font-black uppercase tracking-[0.16em]"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          color: "var(--azul-profundo)",
        }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-azul/50 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          type={showToggle ? (showPassword ? "text" : "password") : type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name === "contrasena" ? "current-password" : "username"}
          className={`w-full ${icon ? "pl-11" : "pl-4"} ${showToggle ? "pr-12" : "pr-4"} rounded-2xl border py-4 text-[15px] font-medium outline-none transition-all duration-200 placeholder:text-azul/38`}
          style={{
            borderColor: "rgba(18, 52, 152, 0.12)",
            backgroundColor: "#FFFFFF",
            color: "var(--azul-profundo)",
            fontFamily: "'Lato', sans-serif",
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {showToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors focus:outline-none"
            style={{ color: "var(--gris-texto)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--azul)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--gris-texto)";
            }}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <EyeOff className="w-[18px] h-[18px]" />
            ) : (
              <Eye className="w-[18px] h-[18px]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
