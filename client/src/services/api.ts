import axios from "axios";
import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Axios instance – base URL will be proxied by Vite dev server to FastAPI
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: "/api",
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Simple auth hook – provides token and login / logout helpers
// ---------------------------------------------------------------------------
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("access_token");
    setToken(stored);
  }, []);

  const login = async (username: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    const response = await api.post("/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const access_token = response.data.access_token;
    localStorage.setItem("access_token", access_token);
    setToken(access_token);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
  };

  return { token, login, logout };
}

// ---------------------------------------------------------------------------
// Helper functions for the UI (bands, issue, return, export)
// ---------------------------------------------------------------------------
export const fetchBands = async () => {
  const res = await api.get("/bands");
  return res.data;
};

export const issueBand = async (bandId: number, personName: string) => {
  await api.post(`/bands/${bandId}/issue`, { person_name: personName });
};

export const returnBand = async (bandId: number) => {
  await api.post(`/bands/${bandId}/return`);
};

export const exportData = async (format: "json" | "csv" = "json") => {
  const res = await api.get("/export", { params: { format } });
  return res.data;
};