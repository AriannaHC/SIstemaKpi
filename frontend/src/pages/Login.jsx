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
    <section className="flex min-h-screen flex-1 items-center justify-center bg-[radial-gradient(circle_at_18%_12%,rgba(244,111,11,0.10),transparent_26%),radial-gradient(circle_at_90%_88%,rgba(18,52,152,0.10),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#FFFFFF_100%)] px-5 py-10 sm:px-8 lg:px-14">
      <div className="w-full max-w-120">
        <div className="mb-8 flex items-center gap-4 lg:hidden">
          <img src="/Imag/Consultora_JB.png" alt="Consultora JB" className="h-14 w-14 rounded-2xl bg-white p-2 shadow-md object-contain ring-1 ring-azul/10" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-naranja">Sistema KPI</p>
            <h1 className="text-xl font-black text-azul-profundo tracking-tight">Consultora JB</h1>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-azul/10 bg-white/95 p-7 shadow-[0_24px_80px_rgba(18,52,152,0.14)] backdrop-blur sm:p-10">
          <div className="mb-8">
            <h2 className="text-4xl font-black text-azul-profundo tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Bienvenido
            </h2>
            <div className="mt-4 h-1 w-14 rounded-full bg-naranja" />
            <p className="mt-5 text-[15px] leading-7 text-gris-texto">
              Ingresa al panel de gestión de KPIs, reportes y auditoría de participación.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rojo-persa/25 bg-rojo-persa/10 p-3.5 shadow-sm">
              <svg className="w-5 h-5 shrink-0 text-rojo-persa" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-rojo-persa">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField label="Correo electrónico" id="usuario" name="usuario" placeholder="ejemplo@empresa.com" value={formData.usuario} onChange={handleChange} icon={userIcon} accentColor="var(--azul)" />
            <InputField label="Contraseña" id="contrasena" name="contrasena" placeholder="Ingrese su contraseña" value={formData.contrasena} onChange={handleChange} icon={lockIcon} showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} accentColor="var(--azul)" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CheckboxCustom label="Mantener sesión iniciada" checked={formData.mantenerSesion} onChange={(val) => setFormData((prev) => ({ ...prev, mantenerSesion: val }))} accentColor="var(--naranja)" />
              <button type="button" className="text-left text-sm font-semibold text-azul-brillante transition-colors hover:text-azul sm:text-right">
                Olvidé mi contraseña
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 w-full rounded-2xl bg-naranja px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-naranja/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-naranja-oscuro hover:shadow-xl hover:shadow-naranja/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-naranja-oscuro"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4.5 h-4.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}