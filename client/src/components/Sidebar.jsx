import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../services/api.ts";
import i18n from "../i18n/de.json";

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  // Hide sidebar on login or start page
  if (["/login", "/"].includes(location.pathname)) {
    return null;
  }


  const menuItems = [
    { label: "Armbändchen", to: "/bands" },
    {
      label: "Personen",
      to: "/people",
      children: [
        { label: "anlegen", to: "/people/create" },
        { label: "importieren", to: "/people/import" },
      ],
    },
    { label: "Trainingsgruppen", to: "/groups" },
    { label: "Einstellungen", to: "/settings" },
    { label: "Anleitung", to: "/guide" },
  ];

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden p-2 fixed top-2 left-2 z-20 bg-moon-700 text-white rounded"
        onClick={toggle}
        aria-label="Menu öffnen"
      >
        ☰
      </button>
      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 bg-moon-800 text-white w-64 transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200 ease-in-out z-10`}
      >
        <div className="p-4 border-b border-moon-600">
          <h2 className="text-lg font-bold">{i18n["app.title"] || "Drehkreuz‑Armbändchen"}</h2>
        </div>
        <ul className="mt-2">
          {menuItems.map((item) => (
            <React.Fragment key={item.to}>
              <li className="px-4 py-2 hover:bg-moon-700">
                <Link to={item.to} onClick={() => setOpen(false)}>{item.label}</Link>
              </li>
              {item.children && item.children.map((child) => (
                <li key={child.to} className="pl-8 pr-4 py-1 hover:bg-moon-700 text-sm text-gray-300">
                  <Link to={child.to} onClick={() => setOpen(false)}>{child.label}</Link>
                </li>
              ))}
            </React.Fragment>
          ))}
          <li className="px-4 py-2 mt-4 border-t border-moon-600">
            <button onClick={logout} className="w-full text-left hover:bg-moon-700">
              Abmelden
            </button>
          </li>
           </ul>
        </nav>
    </>
  );
}
