import { useState } from 'react';
import InputField from './InputField';
import CheckboxCustom from './CheckboxCustom';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    usuario: '',
    contrasena: '',
    mantenerSesion: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.usuario.trim()) { setError('Por favor, ingrese su usuario o correo.'); return; }
    if (!formData.contrasena.trim()) { setError('Por favor, ingrese su contraseña.'); return; }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Login:', formData);
    } catch { setError('Error de conexion. Intente nuevamente.'); } finally { setIsLoading(false); }
  };

  const userIcon = (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const lockIcon = (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <div className="w-1/2 bg-white flex flex-col justify-center items-center px-8 sm:px-12 lg:px-16 xl:px-20 py-12 relative">

      <div className="lg:hidden flex flex-col items-center gap-2 mb-10">
        <span className="text-2xl font-extrabold tracking-widest" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123498' }}>JB</span>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123498' }}>Bienvenido</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#A3A3A3' }}>Ingrese sus credenciales para continuar al sistema.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-3.5 rounded-lg border bg-red-50" style={{ borderColor: '#fca5a5' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#CE0B19' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm" style={{ color: '#CE0B19' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField label="Usuario / Correo" id="usuario" name="usuario" placeholder="Ingrese su usuario o correo" value={formData.usuario} onChange={handleChange} icon={userIcon} accentColor="#123498" />
          <InputField label="Contraseña" id="contrasena" name="contrasena" placeholder="Ingrese su contraseña" value={formData.contrasena} onChange={handleChange} icon={lockIcon} showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} accentColor="#123498" />
          <CheckboxCustom label="Mantener sesión iniciada" checked={formData.mantenerSesion} onChange={(val) => setFormData((prev) => ({ ...prev, mantenerSesion: val }))} accentColor="#F46F0B" />

          <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-lg text-white text-sm font-bold uppercase tracking-wider transition-all duration-200 mt-2" style={{ fontFamily: "'Montserrat', sans-serif", backgroundColor: isLoading ? '#d4620a' : '#F46F0B', cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.08em' }} onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = '#d4620a'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(244,111,11,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isLoading ? '#d4620a' : '#F46F0B'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Ingresando...
              </span>
            ) : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button type="button" className="text-sm transition-colors duration-200" style={{ color: '#096ACC' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#123498'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#096ACC'; }}>¿Olvidó su contraseña?</button>
        </div>
      </div>
    </div>
  );
}