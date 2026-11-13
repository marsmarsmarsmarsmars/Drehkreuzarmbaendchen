import React, { useEffect, useState } from "react";
import { fetchBands, issueBand, returnBand, exportData } from "../services/api.ts";
import i18n from "../i18n/de.json";
import IssueDialog from "./IssueDialog.jsx";
import ReturnDialog from "./ReturnDialog.jsx";

export default function Dashboard() {
  const [bands, setBands] = useState([]);
  const [selectedBand, setSelectedBand] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const loadBands = async () => {
    const data = await fetchBands();
    setBands(data);
  };

  useEffect(() => {
    loadBands();
  }, []);

  const handleIssue = async (person) => {
    await issueBand(selectedBand.id, person);
    setShowIssue(false);
    loadBands();
  };

  const handleReturn = async () => {
    await returnBand(selectedBand.id);
    setShowReturn(false);
    loadBands();
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.json";
    a.click();
    URL.revokeObjectURL(url);
    setLastExport(new Date().toLocaleString());
  };

  return (
    <div className="p-6 w-full max-w-4xl"
      >
      <h1 className="text-2xl mb-4">{i18n["dashboard.title"]}</h1>
      <button
        onClick={handleExport}
        className="mb-4 bg-moon-600 hover:bg-moon-500 text-white py-1 px-3 rounded"
      >Export JSON</button>
      {lastExport && (
        <div className="mb-2 text-sm">{i18n["dashboard.lastExport"].replace("{{time}}", lastExport)}</div>
      )}
      <table className="min-w-full bg-moon-800 text-white"
        >
        <thead>
          <tr>
            <th className="p-2">Nummer</th>
            <th className="p-2">Status</th>
            <th className="p-2">Person</th>
            <th className="p-2">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => (
            <tr key={b.id} className="border-b border-moon-700"
              >
              <td className="p-2">{b.number}</td>
              <td className="p-2">{b.issued ? "Ausgegeben" : "Verfügbar"}</td>
              <td className="p-2">{b.person_name || "-"}</td>
              <td className="p-2 space-x-2"
                >
                {!b.issued && (
                  <button
                    onClick={() => {
                      setSelectedBand(b);
                      setShowIssue(true);
                    }}
                    className="bg-moon-500 hover:bg-moon-400 text-white py-1 px-2 rounded"
                  >{i18n["dashboard.issue"]}
                  </button>
                )}
                {b.issued && (
                  <button
                    onClick={() => {
                      setSelectedBand(b);
                      setShowReturn(true);
                    }}
                    className="bg-moon-300 hover:bg-moon-200 text-black py-1 px-2 rounded"
                  >{i18n["dashboard.return"]}</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showIssue && selectedBand && (
        <IssueDialog
          band={selectedBand}
          onClose={() => setShowIssue(false)}
          onSave={handleIssue}
        />
      )}
      {showReturn && selectedBand && (
        <ReturnDialog
          band={selectedBand}
          onClose={() => setShowReturn(false)}
          onSave={handleReturn}
        />
      )}
    </div>
  );
}