import { createContext, useContext, useEffect, useState } from "react";
import { api, clearTokens, hasSession, saveTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const onSessionExpired = () => setUser(null);
    window.addEventListener("pawverse:session-expired", onSessionExpired);

    async function loadUser() {
      if (!hasSession()) {
        setAuthError("");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me/");
        if (active) setUser(data);
        if (active) setAuthError("");
      } catch (error) {
        if (error.response?.status === 401) {
          clearTokens();
          if (active) {
            setUser(null);
            setAuthError("");
          }
        } else if (active) {
          setAuthError("We couldn't connect to PawVerse to check your session. Make sure the Django API is running, then try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
      window.removeEventListener("pawverse:session-expired", onSessionExpired);
    };
  }, [attempt]);

  async function signIn(email, password) {
    setAuthError("");
    const { data: tokens } = await api.post("/auth/token/", { email, password });
    saveTokens(tokens);
    try {
      const { data: account } = await api.get("/auth/me/");
      setUser(account);
      return account;
    } catch (error) {
      clearTokens();
      throw error;
    }
  }

  async function register(details) {
    await api.post("/auth/register/", details);
  }

  async function signOut() {
    clearTokens();
    setUser(null);
    setAuthError("");
  }

  function retrySession() {
    setLoading(true);
    setAttempt((current) => current + 1);
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, retrySession, signIn, register, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
