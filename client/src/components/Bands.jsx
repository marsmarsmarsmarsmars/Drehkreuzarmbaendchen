import React, { useEffect, useState } from "react";
import { api } from "../services/api.ts";
import i18n from "../i18n/de.json";

export default function Bands() {
  const [bands, setBands] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBands = async () => {
      try {
        const resp = await api.get("/bands");
        setBands(resp.data);
      } catch (e) {
        setError(e.response?.data?.detail || "Fehler beim Laden der Bänder");
      }
    };
    fetchBands();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{i18n["bands.title"] || "Armbändchen"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <table className="w-full table-auto border-collapse">
        <thead className="bg-moon-700 text-white">
          <tr>
            <th className="p-2 border">Nummer</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Person</th>
            <th className="p-2 border">Ausgabe‑Datum</th>
            <th className="p-2 border">Rückgabe‑Datum</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="p-2 border">{b.number}</td>
              <td className="p-2 border">{b.status}</td>
              <td className="p-2 border">{b.person_name || "-"}</td>
              <td className="p-2 border">{b.issued ? b.issued_date || "-" : "-"}</td>
              <td className="p-2 border">{b.returned ? b.returned_date || "-" : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
