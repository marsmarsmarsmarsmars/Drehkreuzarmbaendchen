import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.ts";
import i18n from "../i18n/de.json";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get("/users");
        setUsers(resp.data);
      } catch (e) {
        setError(e.response?.data?.detail || "Fehler beim Laden der Benutzer");
      }
    };
    fetch();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm(i18n["confirm.delete"] || "Benutzer wirklich löschen?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
    } catch (e) {
      alert(e.response?.data?.detail || "Löschen fehlgeschlagen");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{i18n["users.title"] || "Benutzerverwaltung"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <Link to="/users/create" className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block">Neu</Link>
      <table className="w-full table-auto border-collapse">
        <thead className="bg-moon-800 text-white">
          <tr>
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Benutzername</th>
            <th className="p-2 border">Rolle</th>
            <th className="p-2 border">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-2 border">{u.id}</td>
              <td className="p-2 border">{u.username}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border space-x-2">
                <Link to={`/users/${u.id}/edit`} className="text-blue-500 hover:underline">Edit</Link>
                <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
