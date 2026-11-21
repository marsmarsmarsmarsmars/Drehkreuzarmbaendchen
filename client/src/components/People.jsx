import React, { useEffect, useState } from "react";
import { api } from "../services/api.ts";
import { Link } from "react-router-dom";

export default function People() {
  const [people, setPeople] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const resp = await api.get("/persons");
        setPeople(resp.data);
      } catch (e) {
        setError(e.response?.data?.detail || "Fehler beim Laden der Personen");
      }
    };
    fetchPeople();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{i18n["people.title"] || "Personen"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <table className="w-full table-auto border-collapse">
        <thead className="bg-moon-700 text-white">
          <tr>
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2 border">{p.id}</td>
              <td className="p-2 border">{p.name}</td>
              <td className="p-2 border">{p.email || "-"}</td>
              <td className="p-2 border text-sm text-gray-300">
                <Link to={`/people/${p.id}/edit`}>Bearbeiten</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

