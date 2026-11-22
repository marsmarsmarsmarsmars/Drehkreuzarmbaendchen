import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../services/api.ts";
import i18n from "../i18n/de.json";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [firstSetup, setFirstSetup] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const fetchFirstSetup = async () => {
      try {
        const response = await fetch("/api/first-setup");
        const data = await response.json();
        setFirstSetup(data.first_setup);
      } catch (e) {
        console.error("Failed to fetch first-setup", e);
        setFirstSetup(false);
      }
    };
    fetchFirstSetup();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(i18n["error.generic"]);
    }
  };

  return (
    <div className="max-w-sm w-full bg-moon-800 p-6 rounded shadow-lg"
      >
      <h2 className="text-xl mb-4 text-center">{i18n["login.title"]}</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {firstSetup ? (
        <div className="text-center mt-4">
          <Link to="/setup" className="text-blue-500 hover:underline">Ersten Admin anlegen</Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1" htmlFor="username">{i18n["login.username"]}</label>
              <input
                id="username"
                type="text"
                className="w-full p-2 rounded bg-moon-700 text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1" htmlFor="password">{i18n["login.password"]}</label>
              <input
                id="password"
                type="password"
                className="w-full p-2 rounded bg-moon-700 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-moon-500 hover:bg-moon-400 py-2 rounded"
            >{i18n["login.button"]}</button>
          </form>
        </>
      )}
    </div>
  );
}