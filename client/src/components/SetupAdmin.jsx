import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.ts";

export default function SetupAdmin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Create first admin user (no auth required when no users exist)
      await api.post("/users", { username, password, role: "admin" });
      // After creation, go to login page
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Anlegen des Administrators");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Erste*r Admin-Account anlegen</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block">Benutzername</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-1"
            required
          />
        </div>
        <div className="mb-2">
          <label className="block">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-1"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Admin anlegen
        </button>
      </form>
    </div>
  );
}
