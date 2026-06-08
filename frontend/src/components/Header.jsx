// src/components/Header.jsx
export default function Header({ userName }) {
  const currentDate = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Capitalizamos la primera letra del día para que se vea mejor
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  // Extraemos las iniciales del nombre (máximo 2)
  const initials = userName
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-gray-100 px-4 pl-16 sm:pl-8 md:px-8 h-16 flex items-center justify-between select-none shrink-0">
      <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight truncate pr-4">
        Hola, {userName}
      </h1>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <h2 className="hidden sm:block text-sm font-medium text-gray-500">
          {formattedDate}
        </h2>
        {/* En móviles mostramos una versión corta de la fecha para ahorrar espacio si es necesario, o simplemente la ocultamos. Optamos por ocultarla para no saturar. */}
        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-100 ring-2 ring-white shrink-0">
          {initials}
        </div>
      </div>
    </header>
  );
}