import { createContext, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { API_URL } from "../config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setAdminUser(data.user);
        }
      } catch (error) {
        console.error("Error de autenticación:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión.");
    }
    setAdminUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setAdminUser(null);
  };

  const value = { adminUser, isAuthLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  return useContext(AuthContext);
};
