import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Normaliza el user: garantiza que kpi_rol_id sea NÚMERO y rol_nombre siempre exista
function normalizeUser(raw) {
  if (!raw) return null;
  const rolId = raw.kpi_rol_id != null ? Number(raw.kpi_rol_id) : null;
  const areaId = raw.kpi_area_id != null ? Number(raw.kpi_area_id) : null;
  const ROL_LABELS = { 1: "Administrador", 2: "Jefe de Área", 3: "Trabajador" };
  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email ?? "",
    kpi_rol_id: rolId,
    kpi_area_id: areaId,
    rol_nombre:
      raw.rol_nombre ?? (rolId != null ? ROL_LABELS[rolId] : "Sin Rol"),
    area_nombre: raw.area_nombre ?? null,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("kpi_user") || sessionStorage.getItem("kpi_user");
    if (storedUser) {
      try {
        setUser(normalizeUser(JSON.parse(storedUser)));
      } catch {
        localStorage.removeItem("kpi_user");
        sessionStorage.removeItem("kpi_user");
      }
    }
  }, []);

  // Login recibe userData ya normalizado desde Login.jsx
  const login = (userData) => {
    const normalUser = normalizeUser(userData);
    setUser(normalUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("kpi_token");
    localStorage.removeItem("kpi_user");
    sessionStorage.removeItem("kpi_token");
    sessionStorage.removeItem("kpi_user");
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
