// useAuth.ts
// Sesión de usuario: token persistido en localStorage y perfil validado
// contra el backend al recargar la página.
import { useCallback, useEffect, useState } from "react";
import {
  getSessionUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthSession,
  type AuthUser,
} from "../api";

const STORAGE_KEY = "nexfit_auth_token";

// «Recordar mi sesión» guarda el token en localStorage (sobrevive al cierre
// del navegador). Sin recordar, se usa sessionStorage y caduca al cerrar.
function readStoredToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
}

function clearStoredToken() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  // Hay sesión guardada pero aún no se ha validado (evita parpadeo en la cabecera).
  const [restoring, setRestoring] = useState(() => readStoredToken() !== null);

  const persist = (session: AuthSession, remember: boolean) => {
    clearStoredToken();
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(STORAGE_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
  };

  // Restaura la sesión guardada al cargar o recargar la página.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setRestoring(false);
      return;
    }

    let active = true;
    void getSessionUser(token)
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        // Token caducado o desconocido: se limpia para no mostrar una cuenta falsa.
        if (!active) return;
        clearStoredToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Devuelven el usuario para poder saludarle en el aviso de bienvenida.
  const login = useCallback(async (email: string, password: string, remember = true) => {
    const session = await loginUser(email, password);
    persist(session, remember);
    return session.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const session = await registerUser(name, email, password);
    persist(session, true);
    return session.user;
  }, []);

  const logout = useCallback(() => {
    // El cierre en el servidor es en segundo plano: la UI responde al instante.
    if (token) void logoutUser(token).catch(() => undefined);
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, [token]);

  return { user, token, restoring, login, register, logout };
}
