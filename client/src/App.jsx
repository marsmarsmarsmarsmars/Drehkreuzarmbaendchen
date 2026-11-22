import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login.jsx";
import SetupAdmin from "./components/SetupAdmin.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { useAuth } from "./services/api.ts";
import Sidebar from "./components/Sidebar.jsx";
import Bands from "./components/Bands.jsx";
import Guide from "./components/Guide.jsx";
import People from "./components/People.jsx";
import PeopleCreate from "./components/PeopleCreate.jsx";
import PeopleImport from "./components/PeopleImport.jsx";
import Groups from "./components/Groups.jsx";
import UsersList from "./components/UsersList.jsx";
import UserCreate from "./components/UserCreate.jsx";
import UserEdit from "./components/UserEdit.jsx";

export default function App() {
  const { token } = useAuth();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-4">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupAdmin />} />
          <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/bands" element={token ? <Bands /> : <Navigate to="/login" replace />} />
          <Route path="/guide" element={token ? <Guide /> : <Navigate to="/login" replace />} />
          <Route path="/people" element={token ? <People /> : <Navigate to="/login" replace />} />
          <Route path="/people/:personId/edit" element={token ? <PersonEdit /> : <Navigate to="/login" replace />} />
          <Route path="/people/import" element={token ? <PeopleImport /> : <Navigate to="/login" replace />} />
          <Route path="/groups" element={token ? <Groups /> : <Navigate to="/login" replace />} />
          <Route path="/users" element={token ? <UsersList /> : <Navigate to="/login" replace />} />
          <Route path="/users/create" element={token ? <UserCreate /> : <Navigate to="/login" replace />} />
          <Route path="/users/:userId/edit" element={token ? <UserEdit /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
  );
}
