// src/components/ActionDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import './ActionDropdown.css';

const ActionDropdown = ({ item, onFormat, onCopy, onEdit, onDelete, onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Menutup dropdown jika klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action) => {
    action(item);
    setIsOpen(false);
  };

  return (
    <div className="action-dropdown" ref={dropdownRef}>
      <button 
        className="action-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="action-menu">
          <a href="#" onClick={() => handleAction(onFormat)}>Lihat Format</a>
          <a href="#" onClick={() => handleAction(onCopy)}>Salin</a>
          <a href="#" onClick={() => handleAction(onEdit)}>Edit</a>
          <a href="#" onClick={() => handleAction(onComplete)} className="action-menu-item-success">Selesaikan</a>
          <div className="action-menu-divider"></div>
          <a href="#" onClick={() => handleAction(() => onDelete(item.incident))} className="action-menu-item-danger">Hapus</a>
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;