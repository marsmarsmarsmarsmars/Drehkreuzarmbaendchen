import React from "react";
import i18n from "../i18n/de.json";

export default function ReturnDialog({ band, onClose, onSave }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
      <div className="bg-moon-800 p-6 rounded w-96"
        >
        <h2 className="text-lg mb-4">{i18n["modal.return.title"]}</h2>
        <form onSubmit={handleSubmit}>
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