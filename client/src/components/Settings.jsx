import React from "react";
import i18n from "../i18n/de.json";

export default function Settings() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{i18n["settings.title"] || "Einstellungen"}</h2>
      <p>Hier können Nummernkreise, Trainingsgruppen und Benutzerverwaltung konfiguriert werden (Platzhalter).</p>
    </div>
  );
}
