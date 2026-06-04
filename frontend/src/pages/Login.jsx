import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginService } from '../services/authService';
import InputField from '../components/InputField';
import CheckboxCustom from '../components/CheckboxCustom';

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ usuario: '', contrasena: '', mantenerSesion: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usuario.trim() || !formData.contrasena) {
      setError('Llene todos los campos.'); return;
    }
    
    setIsLoading(true);
    try {
      const data = await loginService(formData.usuario.trim(), formData.contrasena);
      
      const storage = formData.mantenerSesion ? localStorage : sessionStorage;
      storage.setItem('kpi_token', data.token.access_token);
      storage.setItem('kpi_user', JSON.stringify(data.user));

      login(data.user, formData.mantenerSesion);

    } catch (err) {
      if (err.response?.data?.detail) setError(err.response.data.detail);
      else setError('Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const userIcon = (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const lockIcon = (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

return (
  <section className="min-h-screen flex">
    {/* Panel izquierdo con nuevas animaciones */}
    <div className="hidden lg:flex lg:w-1/2 bg-[#123498] flex-col items-center justify-center px-16 relative overflow-hidden">
      {/* Degradado de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a4ba0] to-[#123498] -z-20"></div>

      {/* Animación de partículas de fondo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-particle-1"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl animate-particle-2"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-particle-3"></div>
      </div>

      {/* Logo en la esquina */}
      <img
        src="/Imag/Logos.JB-04.png"
        alt="Consultora JB"
        className="absolute top-8 left-8 w-24 h-24 object-contain opacity-90 z-10"
      />

      {/* Contenedor principal (texto estático) */}
      <div className="text-center z-10 mt-8">
        
        {/* Gráfico de Barras Animado (solo el gráfico flota) */}
        <div className="flex items-end gap-4 mb-8 mx-auto w-fit animate-float-container">
          {/* Barra 1 */}
          <div className="w-10 h-20 rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 relative animate-bar-1 group">
            <div className="absolute top-0 left-0 w-full h-2 bg-white/80 rounded-t-lg group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>
          {/* Barra 2 (Central, más alta) */}
          <div className="w-10 h-32 rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 relative animate-bar-2 group">
            <div className="absolute top-0 left-0 w-full h-2 bg-white/80 rounded-t-lg group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>
          {/* Barra 3 */}
          <div className="w-10 h-16 rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 relative animate-bar-3 group">
            <div className="absolute top-0 left-0 w-full h-2 bg-white/80 rounded-t-lg group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>
        </div>

        {/* Texto Principal (ahora estático) */}
        <h1
          className="text-5xl font-bold text-white mb-6 leading-tight"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Gestión Inteligente de Indicadores
        </h1>

        {/* Texto Descriptivo (ahora estático) */}
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Plataforma integral para el seguimiento, evaluación y optimización del desempeño empresarial.
        </p>
      </div>

      {/* Animaciones CSS actualizadas */}
      <style jsx>{`
        /* Animación de crecimiento de las barras */
        @keyframes growUp {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
        .animate-bar-1 { animation: growUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.2s; transform-origin: bottom; }
        .animate-bar-2 { animation: growUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.4s; transform-origin: bottom; }
        .animate-bar-3 { animation: growUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.6s; transform-origin: bottom; }

        /* Animación de flotación solo para el gráfico */
        @keyframes floatContainer {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-container {
          animation: floatContainer 6s ease-in-out infinite;
        }

        /* Animaciones para las partículas de fondo */
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
          {/* Título cambiado a azul corporativo */}
          <h2
            className="text-3xl font-bold text-[#123498] mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Bienvenido
          </h2>

          {/* Texto cambiado a azul con 80% de opacidad */}
          <p className="text-[#123498]/80">
            Ingrese sus credenciales para continuar al sistema.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm text-red-700">
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            label="USUARIO / CORREO"
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

          <CheckboxCustom
            label="Mantener sesión iniciada"
            checked={formData.mantenerSesion}
            onChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                mantenerSesion: val,
              }))
            }
            accentColor="#123498"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-orange-500 py-4 text-white font-bold transition-all duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-400 flex items-center justify-center gap-2 group"
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