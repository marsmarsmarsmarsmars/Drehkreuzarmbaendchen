import React, { useState, useEffect } from "react";
import { api } from "../services/api.ts";
import i18n from "../i18n/de.json";
import { useParams, useNavigate } from "react-router-dom";

export default function PersonEdit() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const resp = await api.get(`/persons/${personId}`);
        setName(resp.data.name);
        setEmail(resp.data.email || "");
      } catch (err) {
        setError(err.response?.data?.detail || "Fehler beim Laden");
      }
    };
    fetchPerson();
  }, [personId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError("Name ist erforderlich");
      return;
    }
    try {
      await api.put(`/persons/${personId}`, { name, email: email || undefined });
      alert("Person gespeichert");
      navigate("/people");
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Speichern");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">{i18n["people.edit.title"] || "Person bearbeiten"}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block">Name</label>
          <input type="text" className="w-full p-2 rounded bg-moon-700 text-white" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-2">
          <label className="block">Email (optional)</label>
          <input type="email" className="w-full p-2 rounded bg-moon-700 text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Speichern</button>
      </form>
    </div>
  );
}
