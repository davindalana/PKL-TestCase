// Lokasi: frontend/src/components/TTRCalculator.jsx

import React, { useState, useEffect } from "react";

// Fungsi untuk menghitung selisih waktu, mirip dengan fungsi PHP Anda
const calculateDuration = (start, end) => {
  // Jika tidak ada tanggal mulai, kembalikan strip
  if (!start) return "-";

  const startDate = new Date(start);
  // Jika tidak ada tanggal selesai (tiket masih open), gunakan waktu saat ini
  const endDate = end ? new Date(end) : new Date();

  // Jika tanggal mulai tidak valid
  if (isNaN(startDate.getTime())) return "-";

  let diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) diff = 0; // Pastikan selisih tidak negatif

  // Konversi selisih milidetik ke hari, jam, dan menit
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));

  let result = "";
  if (days > 0) result += `${days}H `;
  if (hours > 0) result += `${hours}J `;
  // Selalu tampilkan menit, bahkan jika 0
  if (minutes >= 0) result += `${minutes}M`;

  // Jika tidak ada hasil (misal, selisih < 1 menit), tampilkan "0M"
  return result.trim() === "" ? "0M" : result.trim();
};

const TTRCalculator = ({ reportedDate, resolvedDate }) => {
  // Hitung durasi awal saat komponen pertama kali render
  const [duration, setDuration] = useState(
    calculateDuration(reportedDate, resolvedDate)
  );

  useEffect(() => {
    // Jika tiket belum selesai (tidak ada resolvedDate), kita perlu update durasi secara berkala
    if (reportedDate && !resolvedDate) {
      // Set interval untuk mengkalkulasi ulang setiap 1 menit (60000 ms)
      const interval = setInterval(() => {
        setDuration(calculateDuration(reportedDate, null));
      }, 60000);

      // Fungsi cleanup: hapus interval saat komponen di-unmount (pindah halaman, etc)
      return () => clearInterval(interval);
    }
    // Jika tiket sudah selesai, cukup hitung sekali dan tidak perlu update
    setDuration(calculateDuration(reportedDate, resolvedDate));
  }, [reportedDate, resolvedDate]);

  return <span>{duration}</span>;
};

export default TTRCalculator;
