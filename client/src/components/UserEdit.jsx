import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.ts";
import i18n from "../i18n/de.json";

export default function UserEdit() {
  const { userId } = useParams();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const resp = await api.get(`/users/${userId}`);
        setUsername(resp.data.username);
        setRole(resp.data.role);
      } catch (e) {
        setError(e.response?.data?.detail || "Fehler beim Laden");
      }
    };
    fetchUser();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/users/${userId}`, { username, password: "", role }); // empty password keeps unchanged
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Aktualisieren");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">{i18n["users.edit.title"] || "Benutzer bearbeiten"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block">Benutzername</label>
          <input type="text" className="w-full p-2 rounded bg-moon-700 text-white" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="mb-2">
          <label className="block">Rolle</label>
          <select className="w-full p-2 rounded bg-moon-700 text-white" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Speichern</button>
      </form>
    </div>
  );
}
