// src/components/Sidebar.jsx

import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Dashboard</h2>
      </div>
      <nav className="sidebar-nav">
        {/* Tambahkan prop 'end' pada NavLink root agar tidak selalu aktif */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          📝 <span>Input WO</span>
        </NavLink>
        <NavLink
          to="/lihat-wo"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          📋 <span>Lihat WO</span>
        </NavLink>
        <NavLink
          to="/report"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          📊 <span>Laporan</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
