// src/components/SortIcon.jsx
import React from 'react';

const SortIcon = ({ direction }) => (
  <span className="sort-icon">
    {direction === "asc" ? "🔼" : direction === "desc" ? "🔽" : "↕️"}
  </span>
);

export default SortIcon;