// src/components/SortIcon.jsx
import React from "react";

const SortIcon = ({ direction }) => {
  let icon = "↕️";
  if (direction === "asc") {
    icon = "▲";
  } else if (direction === "desc") {
    icon = "▼";
  }

  return <span className={`sort-icon ${direction || ""}`}>{icon}</span>;
};

export default SortIcon;
