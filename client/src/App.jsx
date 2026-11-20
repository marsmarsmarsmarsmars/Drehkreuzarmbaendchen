import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login.jsx";
import SetupAdmin from "./components/SetupAdmin.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { useAuth } from "./services/api.ts";
import Sidebar from "./components/Sidebar.jsx";
import Bands from "./components/Bands.jsx";
import Guide from "./components/Guide.jsx";

export default function App() {
  const { token } = useAuth();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupAdmin />} />
          <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/bands" element={token ? <Bands /> : <Navigate to="/login" replace />} />
          <Route path="/guide" element={token ? <Guide /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
  );
}