// frontend/src/pages/Usuarios.jsx
import { useState, useEffect, useRef } from 'react';
import { userService } from '../services/userService';
import { kpiService } from '../services/kpiService';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para inputs del formulario (no filtran la tabla aún)
  const [searchInput, setSearchInput] = useState('');
  const [searchAreaInput, setSearchAreaInput] = useState('');
  
  // Estados para los filtros aplicados (estos filtran la tabla al darle a Buscar)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchArea, setSearchArea] = useState('');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    cargarDatos();
    
    // Cerrar el dropdown al hacer click afuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarDatos = async () => {
    try {
      const [resUsers, resAreas] = await Promise.all([
        userService.getUsers(),
        kpiService.getAreas()
      ]);
      setUsuarios(resUsers);
      setAreas(resAreas);
    } catch (error) {
      console.error("Error cargando datos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, nuevoRolId, areaIdActual) => {
    try {
      await userService.updateUser(userId, nuevoRolId || null, areaIdActual);
      alert("✅ Rol actualizado con éxito");
      cargarDatos();
    } catch (e) {
      alert("❌ Error al actualizar rol");
    }
  };

  const handleAreaChange = async (userId, rolIdActual, nuevaAreaId) => {
    try {
      await userService.updateUser(userId, rolIdActual, nuevaAreaId || null);
      alert("✅ Área asignada con éxito");
      cargarDatos();
    } catch (e) {
      alert("❌ Error al actualizar área");
    }
  };

  // Función al enviar el formulario (Click en Buscar o Enter)
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setSearchArea(searchAreaInput);
    setCurrentPage(1); // Volver a la primera página tras buscar
  };

  // Filtrado de usuarios (usa los filtros APLICADOS)
  const filteredUsuarios = usuarios.filter(u => {
    const matchesName = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = searchArea ? u.kpi_area_id === parseInt(searchArea) : true;
    return matchesName && matchesArea;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Cabecera: Título a la izquierda, Buscador a la derecha */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-naranja tracking-tight shrink-0">
          Gestión de Usuarios
        </h2>

        {/* Formulario de Búsqueda */}
        <form className="w-full lg:max-w-xl relative" onSubmit={handleSearch}>
          <div className="flex shadow-sm rounded-lg" ref={dropdownRef}>
            {/* Dropdown de Área */}
            <div className="relative shrink-0 z-20">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button" 
                className="inline-flex items-center text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 font-medium rounded-s-lg text-sm px-4 py-3 outline-none w-36 sm:w-44 justify-between transition-colors h-full"
              >
                <span className="truncate">{searchAreaInput ? areas.find(a => a.id.toString() === searchAreaInput)?.nombre : 'Todas las áreas'}</span>
                <svg className="w-4 h-4 ms-1.5 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7"/></svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-48 sm:w-56 z-30 overflow-hidden">
                  <ul className="py-1 text-sm text-gray-700 max-h-60 overflow-y-auto">
                    <li>
                      <button 
                        type="button"
                        className="inline-flex w-full px-4 py-2 hover:bg-gray-100 text-left transition-colors"
                        onClick={() => { setSearchAreaInput(''); setIsDropdownOpen(false); }}
                      >
                        Todas las áreas
                      </button>
                    </li>
                    {areas.map(a => (
                      <li key={a.id}>
                        <button 
                          type="button"
                          className="inline-flex w-full px-4 py-2 hover:bg-gray-100 text-left transition-colors"
                          onClick={() => { setSearchAreaInput(a.id.toString()); setIsDropdownOpen(false); }}
                        >
                          {a.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Input de Búsqueda */}
            <div className="relative w-full">
              <input 
                type="search" 
                className="block p-3 w-full z-10 text-sm text-gray-900 bg-white rounded-e-lg border-s-0 border border-gray-300 focus:ring-naranja focus:border-naranja outline-none transition-colors h-full" 
                placeholder="Buscar por nombre..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute top-0 right-0 h-full inline-flex items-center text-white bg-naranja hover:bg-orange-600 border border-naranja focus:ring-4 focus:ring-orange-300 font-medium rounded-e-lg text-sm px-4 sm:px-6 outline-none transition-colors z-10"
              >
                <svg className="w-4 h-4 sm:me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Contenedor principal de la Tabla (Card) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full">
        
        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-6">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap w-1/4">Nombre</th>
                <th className="px-6 py-4 whitespace-nowrap w-1/4">Correo</th>
                <th className="px-6 py-4 whitespace-nowrap w-1/4">Rol</th>
                <th className="px-6 py-4 whitespace-nowrap w-1/4">Área</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentUsuarios.length > 0 ? (
                currentUsuarios.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-200 shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        className="border border-gray-300 bg-gray-50 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-all cursor-pointer hover:bg-white"
                        value={u.kpi_rol_id || ""}
                        onChange={(e) => handleRoleChange(u.id, parseInt(e.target.value) || null, u.kpi_area_id)}
                      >
                        <option value="">-- Sin Acceso --</option>
                        <option value="1">Administrador</option>
                        <option value="2">Jefe de Área</option>
                        <option value="3">Trabajador</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        className="border border-gray-300 bg-gray-50 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-all cursor-pointer hover:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        value={u.kpi_area_id || ""}
                        onChange={(e) => handleAreaChange(u.id, u.kpi_rol_id, parseInt(e.target.value))}
                        disabled={!u.kpi_rol_id || u.kpi_rol_id === 1} 
                      >
                        <option value="">-- Seleccionar Área --</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <nav aria-label="Navegación de páginas" className="flex justify-center">
            <ul className="flex -space-x-px text-sm">
              <li>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 font-medium rounded-s-lg w-10 h-10 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7"/></svg>
                </button>
              </li>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <li key={page}>
                      <button 
                        onClick={() => setCurrentPage(page)}
                        className={`flex items-center justify-center border font-medium w-10 h-10 outline-none transition-colors ${
                          currentPage === page 
                            ? 'text-naranja bg-orange-50 border-naranja z-10' 
                            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    </li>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <li key={page}>
                      <span className="flex items-center justify-center border font-medium w-10 h-10 text-gray-500 bg-white border-gray-300">
                        ...
                      </span>
                    </li>
                  );
                }
                return null;
              })}

              <li>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 font-medium rounded-e-lg w-10 h-10 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="sr-only">Siguiente</span>
                  <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/></svg>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}