import React, { useState } from "react";
import i18n from "../i18n/de.json";

export default function PeopleCreate() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder – hier API‑Aufruf zum Anlegen einer Person einbauen
    if (!name) {
      setError("Name ist erforderlich");
      return;
    }
    alert(`Person "${name}" angelegt (Mock)`);
    setName("");
    setError("");
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">{i18n["people.create.title"] || "Person anlegen"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block">Name</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-moon-700 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Anlegen</button>
      </form>
    </div>
  );
}
