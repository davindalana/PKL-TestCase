// src/utils/dateFormatter.js

/**
 * Mengubah string tanggal ISO (contoh: "2025-08-09T19:42:20.000Z") 
 * menjadi format yang mudah dibaca (contoh: "09 Agustus 2025, 19:42").
 * @param {string | null | undefined} dateString String tanggal dalam format ISO.
 * @returns {string} Tanggal yang sudah diformat atau string kosong jika input tidak valid.
 */
export const formatReadableDate = (dateString) => {
  if (!dateString) {
    return ""; // Kembalikan string kosong jika data tanggal tidak ada
  }

  try {
    const date = new Date(dateString);

    // Opsi untuk format tanggal dan waktu
    const options = {
      day: '2-digit',       // Angka tanggal (e.g., 09)
      month: 'long',        // Nama bulan (e.g., Agustus)
      year: 'numeric',      // Angka tahun (e.g., 2025)
      hour: '2-digit',      // Jam (e.g., 19)
      minute: '2-digit',    // Menit (e.g., 42)
      hour12: false,        // Gunakan format 24 jam
      timeZone: 'Asia/Jakarta' // Sesuaikan dengan zona waktu Anda (WIB)
    };

    // Buat formatter untuk Bahasa Indonesia
    const formatter = new Intl.DateTimeFormat('id-ID', options);
    
    return formatter.format(date); // Hasil: "09 Agustus 2025, 19.42"
  } catch (error) {
    console.error("Gagal memformat tanggal:", dateString, error);
    return dateString; // Kembalikan string asli jika terjadi error
  }
};