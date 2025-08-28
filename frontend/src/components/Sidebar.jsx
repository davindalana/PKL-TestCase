// src/components/Sidebar.jsx

import { NavLink } from "react-router-dom";
import "./Sidebar.css";

// DIUBAH: Terima props 'isOpen' dan 'closeSidebar' dari Layout
const Sidebar = ({ isOpen, closeSidebar }) => {
  return (
    // DIUBAH: Tambahkan kelas 'show' secara dinamis berdasarkan prop 'isOpen'
    <aside className={`sidebar ${isOpen ? "show" : ""}`}>
      {/* BARU: Tombol untuk menutup sidebar dari dalam (hanya muncul di mobile) */}
      <button className="sidebar-close-btn" onClick={closeSidebar}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="sidebar-header">
        <h2>Dashboard</h2>
      </div>
      <nav className="sidebar-nav">
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
