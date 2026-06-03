import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Al cargar la app, revisamos si ya hay un usuario guardado
  useEffect(() => {
    const storedUser = localStorage.getItem('kpi_user') || sessionStorage.getItem('kpi_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData, keepSession) => {
    setUser(userData);
    // El token ya se guardó en Login.jsx, aquí solo seteamos el usuario global
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kpi_token');
    localStorage.removeItem('kpi_user');
    sessionStorage.removeItem('kpi_token');
    sessionStorage.removeItem('kpi_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);