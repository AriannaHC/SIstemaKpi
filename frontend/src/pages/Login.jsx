import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loginService } from "../services/authService";
import InputField from "../components/InputField";
import { User, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    usuario: "",
    contrasena: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usuario.trim() || !formData.contrasena) {
      setError("Llene todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginService(
        formData.usuario.trim(),
        formData.contrasena,
      );

      // Validación estricta de acceso al sistema
      if (!data.user.kpi_rol_id) {
        setError(
          "No tienes acceso al sistema. Solicita acceso al administrador.",
        );
        setIsLoading(false);
        return;
      }

      // Guardamos la sesión de forma persistente por defecto
      localStorage.setItem("kpi_token", data.token.access_token);
      localStorage.setItem("kpi_user", JSON.stringify(data.user));

      login(data.user); // Quitamos el segundo parámetro de mantenerSesion
    } catch (err) {
      // Manejo específico de credenciales incorrectas
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Usuario o contraseña incorrectos.");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error de conexión al servidor.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const userIcon = <User className="w-4.5 h-4.5" />;
  const lockIcon = <Lock className="w-4.5 h-4.5" />;

  return (
    <section className="min-h-screen flex">
      {/* Panel izquierdo con nuevas animaciones */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#123498] flex-col items-center justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#1a4ba0] to-[#123498] -z-20"></div>

        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-particle-1"></div>
          <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl animate-particle-2"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-particle-3"></div>
        </div>

        <img
          src="/Imag/Logos.JB-04.png"
          alt="Consultora JB"
          className="absolute top-8 left-8 w-24 h-24 object-contain opacity-90 z-10"
        />

        <div className="text-center z-10 mt-8">
          <div className="flex items-end gap-4 mb-8 mx-auto w-fit animate-float-container">
            <div className="w-10 h-20 rounded-t-lg bg-linear-to-t from-orange-600 to-orange-400 relative animate-bar-1 group">
              <div className="absolute top-0 left-0 w-full h-2 bg-white/80 rounded-t-lg group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            </div>
            <div className="w-10 h-32 rounded-t-lg bg-linear-to-t from-orange-600 to-orange-400 relative animate-bar-2 group">
              <div className="absolute top-0 left-0 w-full h-2 bg-white/80 rounded-t-lg group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            </div>
            <div className="w-10 h-16 rounded-t-lg bg-linear-to-t from-orange-600 to-orange-400 relative animate-bar-3 group">
              <div className="absolute top-0 left-0 w-full h-2 bg-white/80 rounded-t-lg group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            </div>
          </div>

          <h1
            className="text-5xl font-black text-white mb-6 leading-tight uppercase tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            INDICADORES JB
          </h1>

          <p className="text-xl text-orange-400 font-bold mb-4">
            Control y auditoría de rendimiento corporativo.
          </p>

          <p className="text-base text-white/80 max-w-xl mx-auto font-medium">
            Registra tus métricas, monitorea el desempeño de tu área y audita
            los resultados de forma centralizada.
          </p>
        </div>

        <style>{`
        @keyframes growUp {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
        .animate-bar-1 { animation: growUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.2s; transform-origin: bottom; }
        .animate-bar-2 { animation: growUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.4s; transform-origin: bottom; }
        .animate-bar-3 { animation: growUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.6s; transform-origin: bottom; }

        @keyframes floatContainer {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-container {
          animation: floatContainer 6s ease-in-out infinite;
        }

        @keyframes particleFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 20px); }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(10px, -10px) scale(1.2); opacity: 0.2; }
        }

        .animate-particle-1 { animation: particleFloat1 15s ease-in-out infinite; }
        .animate-particle-2 { animation: particleFloat2 20s ease-in-out infinite reverse; }
        .animate-particle-3 { animation: particleFloat3 10s ease-in-out infinite; }
      `}</style>
      </div>

      {/* Panel derecho con textos en azul */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 py-10 relative">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2
              className="text-3xl font-bold text-[#123498] mb-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Bienvenido
            </h2>

            <p className="text-[#123498]/80">
              Ingrese sus credenciales para continuar al sistema.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <span className="text-sm font-semibold text-red-700">
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="CORREO"
              id="usuario"
              name="usuario"
              placeholder="ejemplo@empresa.com"
              value={formData.usuario}
              onChange={handleChange}
              icon={userIcon}
              accentColor="#123498"
            />

            <InputField
              label="CONTRASEÑA"
              id="contrasena"
              name="contrasena"
              placeholder="Ingrese su contraseña"
              value={formData.contrasena}
              onChange={handleChange}
              icon={lockIcon}
              showToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              accentColor="#123498"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-orange-500 py-4 text-white font-bold transition-all duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-400 flex items-center justify-center gap-2 group mt-4"
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
              {!isLoading && (
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
