import React from "react";
import i18n from "../i18n/de.json";

export default function People() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{i18n["people.title"] || "Personen"}</h2>
      <p>Hier wird die Liste der Personen angezeigt (noch nicht implementiert).</p>
    </div>
  );
}
