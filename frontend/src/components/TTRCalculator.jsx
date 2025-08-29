// frontend/src/components/TTRCalculator.jsx

import React, { useState, useEffect } from "react";

// Fungsi untuk memformat durasi menjadi "X Hari Y Jam Z Menit"
function formatDuration(milliseconds) {
  if (isNaN(milliseconds) || milliseconds < 0) {
    return "-";
  }

  let totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);

  let result = "";
  if (days > 0) result += `${days} H `;
  if (hours > 0) result += `${hours} J `;
  if (minutes >= 0) result += `${minutes} M`;

  return result.trim() === "" ? "0 M" : result.trim();
}

const TTRCalculator = ({ reportedDate, resolvedDate, status }) => {
  const [ttr, setTtr] = useState("Menghitung...");

  useEffect(() => {
    if (!reportedDate) {
      setTtr("-");
      return;
    }

    let interval;
    const upperCaseStatus = status ? status.toUpperCase() : "";
    const isTicketConsideredClosed =
      upperCaseStatus === "CLOSED" || upperCaseStatus === "RESOLVED";

    // Jika tiket dianggap selesai (punya resolvedDate atau statusnya CLOSED/RESOLVED)
    if (resolvedDate || isTicketConsideredClosed) {
      const start = new Date(reportedDate).getTime();
      // Gunakan resolvedDate jika ada, jika tidak (misal status CLOSED tapi tanggal null), gunakan waktu sekarang
      const end = resolvedDate ? new Date(resolvedDate).getTime() : Date.now();
      const diff = end - start;
      setTtr(formatDuration(diff));
    } else {
      // Jika tiket masih berjalan
      const updateRunningTTR = () => {
        const start = new Date(reportedDate).getTime();
        const now = Date.now();
        const diff = now - start;
        setTtr(formatDuration(diff));
      };

      updateRunningTTR();
      // Update setiap 60 detik (1 menit) untuk efisiensi
      interval = setInterval(updateRunningTTR, 60000);
    }

    // Fungsi cleanup untuk membersihkan interval
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [reportedDate, resolvedDate, status]); // Dependensi effect

  const isClosed =
    status &&
    (status.toUpperCase() === "CLOSED" || status.toUpperCase() === "RESOLVED");
  const badgeColor = isClosed ? "#28a745" : "#ffc107"; // Hijau untuk selesai, Kuning untuk berjalan
  const textColor = isClosed ? "white" : "black";

  return (
    <span
      style={{
        backgroundColor: badgeColor,
        color: textColor,
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "0.85em",
        fontWeight: "500",
        whiteSpace: "nowrap",
      }}
    >
      {ttr}
    </span>
  );
};

export default TTRCalculator;
