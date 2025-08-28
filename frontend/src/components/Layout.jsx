// src/components/Layout.jsx

import { useState } from "react"; // BARU: Impor useState untuk mengelola state
import Sidebar from "./Sidebar";
import "./Layout.css";

const Layout = ({ children }) => {
  // BARU: State untuk melacak apakah sidebar sedang terbuka atau tertutup
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // BARU: Fungsi untuk membuka sidebar
  const openSidebar = () => {
    setSidebarOpen(true);
  };

  // BARU: Fungsi untuk menutup sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout-container">
      {/* BARU: Tombol Hamburger yang hanya muncul di mobile (via CSS) */}
      <button className="hamburger-btn" onClick={openSidebar}>
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
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* BARU: Overlay yang akan menutup sidebar saat diklik */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
      ></div>

      {/* DIUBAH: Kirim state dan fungsi sebagai props ke Sidebar */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
