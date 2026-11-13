import React, { useState } from "react";
import i18n from "../i18n/de.json";

export default function IssueDialog({ band, onClose, onSave }) {
  const [person, setPerson] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person) {
      setError(i18n["error.generic"]);
      return;
    }
    await onSave(person);
    setPerson("");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
      <div className="bg-moon-800 p-6 rounded w-96"
        >
        <h2 className="text-lg mb-4">{i18n["modal.issue.title"]}</h2>
        {error && (
          <div className="text-red-400 mb-2">{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">{i18n["dashboard.person"]}</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-moon-700 text-white"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-moon-300 hover:bg-moon-200 text-black py-1 px-2 rounded"
            >{i18n["button.close"]}</button>
            <button
              type="submit"
              className="bg-moon-500 hover:bg-moon-400 text-white py-1 px-2 rounded"
            >{i18n["button.save"]}</button>
          </div>
        </form>
      </div>
    </div>
  );
}