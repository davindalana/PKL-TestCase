// src/components/ActionDropdown.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import "./ActionDropdown.css";

const ActionDropdown = ({
  item,
  onFormat,
  onCopy,
  onEdit,
  onDelete,
  onComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        // --- PERUBAHAN DI SINI ---
        // Hitung titik tengah tombol sebagai posisi kiri menu
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    const isOpening = !isOpen;
    setIsOpen(isOpening);
    if (isOpening) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleAction = (action) => {
    action(item.incident ? item : item.incident);
    setIsOpen(false);
  };

  const handleDirectDelete = (e) => {
    e.preventDefault();
    onDelete(item.incident);
    setIsOpen(false);
  };

  return (
    <div className="action-dropdown" ref={dropdownRef}>
      <button
        className="action-toggle-btn"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        ⚙️
      </button>

      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="action-menu-portal"
            style={{
              position: "absolute",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleAction(onFormat);
              }}
            >
              Lihat Format
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleAction(onCopy);
              }}
            >
              Salin
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleAction(onEdit);
              }}
            >
              Edit
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleAction(onComplete);
              }}
              className="action-menu-item-success"
            >
              Selesaikan
            </a>
            <div className="action-menu-divider"></div>
            <a
              href="#"
              onClick={handleDirectDelete}
              className="action-menu-item-danger"
            >
              Hapus
            </a>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionDropdown;
