import React from 'react';

// Unos iconos simples en SVG para replicar el diseño
const MailIcon = () => (
  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="h-7 w-7 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

function Login() {
  return (
    // Fondo muy claro con un tinte azul para resaltar la tarjeta blanca
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Tarjeta de Login principal con bordes muy redondeados y sombra suave */}
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-950/5 w-full max-w-lg border border-slate-100">
        
        {/* Encabezado */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            {/* Un pequeño icono de gráfica como logo */}
            <svg className="h-7 w-7 text-blue-950" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 6a2 2 0 114 0 2 2 0 01-4 0zM18 8a2 2 0 114 0 2 2 0 01-4 0zM14 15a2 2 0 114 0 2 2 0 01-4 0zM18 13a2 2 0 114 0 2 2 0 01-4 0zM3 3h2v18H3V3zm16 7h2v6h-2v-6zm-4-1h2v11h-2V9zm-4-3h2v14h-2V6zm-4-2h2v16H7V4z"/>
            </svg>
            <h1 className="text-3xl font-extrabold text-blue-950 tracking-tighter">
              Precision Performance
            </h1>
          </div>
          <p className="text-xl font-medium text-slate-800">
            Acceda a su Command Center
          </p>
        </header>

        {/* Formulario */}
        <form className="space-y-7" onSubmit={(e) => e.preventDefault()}>
          
          {/* Campo Email corporativo */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MailIcon />
              </div>
              <input
                id="email"
                type="email"
                required
                placeholder="usuario@empresa.com"
                className="w-full px-12 py-3.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Campo Contraseña con enlace de olvido */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LockIcon />
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-12 py-3.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Checkbox Mantener sesión */}
          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-950 focus:ring-blue-950"
            />
            <label htmlFor="remember-me" className="text-xs text-slate-600">
              Mantener sesión iniciada
            </label>
          </div>

          {/* Botón Iniciar Sesión (Azul oscuro corporativo) */}
          <div>
            <button
              type="submit"
              className="w-full bg-blue-950 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-900 transition-colors duration-200 shadow-md shadow-blue-950/10"
            >
              Iniciar Sesión
              <ArrowRightIcon />
            </button>
          </div>
        </form>

        {/* Cuadro de estado de autenticación (Verde) */}
        <div className="mt-10 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-4">
          <ShieldCheckIcon />
          <p className="text-xs text-emerald-900 leading-relaxed">
            Autenticación sincronizada con el <strong className="font-semibold">Attendance System</strong> para control operacional íntegro.
          </p>
        </div>

      </div>

      {/* Pie de página */}
      <footer className="mt-12 text-center text-xs text-slate-400 p-2">
        <p>© 2024 Precision Performance KPI Management.</p>
        <div className="mt-2 flex gap-6 justify-center">
          <a href="#" className="hover:text-slate-600">Seguridad</a>
          <a href="#" className="hover:text-slate-600">Soporte</a>
        </div>
      </footer>

    </div>
  );
}

export default Login;