import React, { useState } from "react";
import { api } from "../services/api.ts";
import i18n from "../i18n/de.json";

export default function PeopleImport() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Bitte eine XML‑Datei auswählen");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const resp = await api.post("/persons/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(resp.data.detail || "Import erfolgreich");
      setFile(null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Import");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">{i18n["people.import.title"] || "Personen importieren"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block">XML‑Datei</label>
          <input
            type="file"
            accept=".xml"
            className="w-full p-2 rounded bg-moon-700 text-white"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Importieren</button>
      </form>
    </div>
  );
}
