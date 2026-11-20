import React from "react";
import i18n from "../i18n/de.json";

export default function Guide() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{i18n["guide.title"] || "Anleitung"}</h2>
      <p>Hier finden Sie die komplette Bedienungsanleitung für das System. Der Inhalt entspricht der README‑Datei im Projekt. Bitte öffnen Sie die README im Repository oder lesen Sie die Online‑Dokumentation im UI.</p>
    </div>
  );
}
