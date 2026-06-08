// src/components/Header.jsx
import { Menu, X, User as UserIcon } from 'lucide-react';

export default function Header({ userName, sidebarOpen, setSidebarOpen, currentTab }) {
  const currentDate = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  const viewTitles = {
    dashboard: 'PANEL DE CONTROL',
    daily: 'INGRESO DIARIO DE KPIS',
    reports: 'AUDITORÍA Y REPORTES',
    settings: 'CONFIGURACIÓN GENERAL',
    users: 'GESTIÓN DE USUARIOS',
  };

  const initials = userName
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex-shrink-0 p-2.5 rounded-xl hover:bg-slate-100 text-azul transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <h2 className="text-sm md:text-lg font-bold text-azul uppercase tracking-wide truncate">
          {viewTitles[currentTab] || ''}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
        <span className="hidden md:block text-sm font-medium text-gray-500">
          {formattedDate}
        </span>
        <div className="hidden md:block h-8 w-px bg-slate-200" />
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-100 flex items-center justify-center text-azul border border-slate-200">
          <span className="text-xs md:text-sm font-bold">{initials}</span>
        </div>
      </div>
    </header>
  );
}