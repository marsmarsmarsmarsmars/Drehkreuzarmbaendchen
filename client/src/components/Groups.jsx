import React from "react";
import i18n from "../i18n/de.json";

export default function Groups() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{i18n["groups.title"] || "Trainingsgruppen"}</h2>
      <p>Hier können Trainingsgruppen verwaltet werden (noch nicht implementiert).</p>
    </div>
  );
}
