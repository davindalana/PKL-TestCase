import { Link, useLocation } from "react-router-dom";
import "./Layout.css";

const Layout = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: "/input-wo",
      label: "INPUT INCIDENT",
      icon: "📝",
      description: "Paste data incident dari Excel",
    },
    {
      path: "/lihat-wo",
      label: "LIHAT INCIDENT",
      icon: "📋",
      description: "Lihat data incident tersimpan",
    },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>📊 Incident Management</h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <span className="nav-icon">{item.icon}</span>
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
