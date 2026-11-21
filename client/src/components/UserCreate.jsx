import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.ts";
import i18n from "../i18n/de.json";

export default function UserCreate() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", { username, password, role });
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Anlegen des Benutzers");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">{i18n["users.create.title"] || "Benutzer anlegen"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block">Benutzername</label>
          <input type="text" className="w-full p-2 rounded bg-moon-700 text-white" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="mb-2">
          <label className="block">Passwort</label>
          <input type="password" className="w-full p-2 rounded bg-moon-700 text-white" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="mb-2">
          <label className="block">Rolle</label>
          <select className="w-full p-2 rounded bg-moon-700 text-white" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Anlegen</button>
      </form>
    </div>
  );
}
