import React, { useState } from "react";
import i18n from "../i18n/de.json";

export default function PeopleImport() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError("Bitte eine CSV‑Datei auswählen");
      return;
    }
    // Placeholder – hier API‑Aufruf zum Importieren einbauen
    alert(`Datei ${file.name} importiert (Mock)`);
    setFile(null);
    setError("");
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">{i18n["people.import.title"] || "Personen importieren"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block">CSV‑Datei</label>
          <input
            type="file"
            accept=".csv"
            className="w-full p-2 rounded bg-moon-700 text-white"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Importieren</button>
      </form>
    </div>
  );
}
