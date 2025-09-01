// Lokasi: frontend/src/components/TTRCalculator.jsx

import React, { useState, useEffect } from "react";

// Fungsi helper untuk mem-parsing tanggal (tetap berguna)
const parseDate = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === "string" && dateString.includes(" ")) {
    const formattedDate = dateString.replace(" ", "T");
    return new Date(formattedDate);
  }
  return new Date(dateString);
};

// Fungsi kalkulasi real-time HANYA untuk tiket yang sedang berjalan
const calculateLiveDuration = (start) => {
  if (!start) return "-";
  const startDate = parseDate(start);
  const endDate = new Date(); // Waktu saat ini

  if (isNaN(startDate.getTime())) return "-";

  let diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));

  let result = "";
  if (days > 0) result += `${days}H `;
  if (hours > 0) result += `${hours}J `;
  if (minutes >= 0) result += `${minutes}M`;

  return result.trim() === "" ? "0M" : result.trim();
};

const TTRCalculator = ({ reportedDate, ttrValue }) => {
  // State untuk menyimpan durasi live
  const [liveDuration, setLiveDuration] = useState(
    calculateLiveDuration(reportedDate)
  );

  useEffect(() => {
    let intervalId = null;

    // Jika TIDAK ada ttrValue (artinya tiket masih open), jalankan timer
    if (reportedDate && !ttrValue) {
      intervalId = setInterval(() => {
        setLiveDuration(calculateLiveDuration(reportedDate));
      }, 60000); // Update setiap menit
    }

    // Fungsi cleanup untuk membersihkan interval
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [reportedDate, ttrValue]); // Efek dievaluasi ulang jika props berubah

  // Logika render:
  // Jika ada ttrValue dari backend, tampilkan itu.
  // Jika tidak, tampilkan liveDuration yang dihitung secara real-time.
  return <span>{ttrValue || liveDuration}</span>;
};

export default TTRCalculator;
