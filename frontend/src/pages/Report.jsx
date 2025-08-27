import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <-- PERUBAHAN 1: Cara import diubah
import "./Report.css";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = "http://localhost:3000/api";
const ITEMS_PER_PAGE = 15;

const Report = () => {
  const [allReports, setAllReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "reported_date",
    direction: "descending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/reports`);
        if (!response.ok) {
          throw new Error("Gagal mengambil data laporan dari server.");
        }
        const result = await response.json();
        setAllReports(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(err.message);
        console.error("Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    let processedData = [...allReports];

    if (dateFilter !== "all") {
      const now = new Date();
      const startDate = new Date();
      if (dateFilter === "1m") startDate.setMonth(now.getMonth() - 1);
      if (dateFilter === "3m") startDate.setMonth(now.getMonth() - 3);
      if (dateFilter === "6m") startDate.setMonth(now.getMonth() - 6);
      if (dateFilter === "1y") startDate.setFullYear(now.getFullYear() - 1);
      processedData = processedData.filter(
        (report) => new Date(report.reported_date) >= startDate
      );
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      processedData = processedData.filter((report) =>
        Object.values(report).some((value) =>
          String(value).toLowerCase().includes(lowercasedTerm)
        )
      );
    }

    if (sortConfig.key) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return processedData;
  }, [allReports, searchTerm, dateFilter, sortConfig]);

  const chartData = useMemo(() => {
    const monthlyCounts = {};

    filteredReports.forEach((report) => {
      const date = new Date(report.reported_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      if (!monthlyCounts[key]) {
        monthlyCounts[key] = 0;
      }
      monthlyCounts[key]++;
    });

    const sortedKeys = Object.keys(monthlyCounts).sort();

    const sortedLabels = sortedKeys.map((key) => {
      const [year, month] = key.split("-");
      const date = new Date(year, month - 1);
      return date.toLocaleString("id-ID", { month: "long", year: "numeric" });
    });

    const dataValues = sortedKeys.map((key) => monthlyCounts[key]);

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: "Tiket Selesai per Bulan",
          data: dataValues,
          backgroundColor: "rgba(102, 126, 234, 0.6)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [filteredReports]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Tren Tiket Selesai Bulanan",
        font: {
          size: 18,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const handleReopen = async (incident) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin membuka kembali tiket ${incident} dan memindahkannya ke Work Order?`
      )
    ) {
      setActionLoading(incident);
      try {
        const response = await fetch(
          `${API_BASE_URL}/reports/${incident}/reopen`,
          { method: "POST" }
        );
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Gagal membuka kembali tiket.");
        setAllReports((prev) =>
          prev.filter((report) => report.incident !== incident)
        );
        alert("Tiket berhasil dibuka kembali!");
      } catch (err) {
        console.error("Re-open Error:", err);
        alert(`Error: ${err.message}`);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getTableHeaders = () => {
    if (allReports.length === 0) return [];
    return Object.keys(allReports[0]).sort();
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleExport = (format) => {
    const dataToExport = filteredReports;
    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const filename = `laporan_tiket_selesai_${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "pdf") {
      try {
        const doc = new jsPDF({ orientation: "landscape" });

        doc.setFontSize(18);
        doc.text("Laporan Tiket Selesai", 14, 22);

        const pdfHeaders = [
          "incident",
          "summary",
          "reported_date",
          "owner_group",
          "witel",
          "status",
          "sektor",
          "workzone",
        ];

        const displayHeaders = pdfHeaders.map((h) =>
          h.replace(/_/g, " ").toUpperCase()
        );

        const body = dataToExport.map((row) =>
          pdfHeaders.map((header) => String(row[header] ?? ""))
        );

        // <-- PERUBAHAN 2: Cara memanggil diubah
        autoTable(doc, {
          head: [displayHeaders],
          body: body,
          startY: 30,
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          styles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save(`${filename}.pdf`);
      } catch (err) {
        console.error("Gagal membuat PDF:", err);
        alert(
          "Terjadi kesalahan saat membuat file PDF. Silakan cek console (F12) untuk detailnya."
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="report-container">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>{" "}
          <p>Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-container">
        <div className="error-container">
          <h2>Gagal Memuat Laporan 🔌</h2> <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="page-header">
        <h1>📊 Laporan Tiket Selesai</h1>
      </div>

      <div className="controls-panel">
        <div className="export-controls">
          <button
            onClick={() => handleExport("excel")}
            className="btn btn-primary"
          >
            Ekspor Excel
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="btn btn-secondary"
          >
            Ekspor CSV
          </button>
          <button onClick={() => handleExport("pdf")} className="btn btn-info">
            Ekspor PDF
          </button>
        </div>
        <div className="report-summary">
          Menampilkan: <strong>{filteredReports.length}</strong> dari{" "}
          <strong>{allReports.length}</strong>
        </div>
      </div>

      <div className="filter-container">
        <input
          type="text"
          placeholder="🔍 Cari di semua kolom..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="date-filter-dropdown"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">Semua Waktu</option>
          <option value="1m">1 Bulan Terakhir</option>
          <option value="3m">3 Bulan Terakhir</option>
          <option value="6m">6 Bulan Terakhir</option>
          <option value="1y">1 Tahun Terakhir</option>
        </select>
      </div>

      <div className="table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th className="action-header sticky-col">AKSI</th>
              {getTableHeaders().map((key) => (
                <th
                  key={key}
                  onClick={() => requestSort(key)}
                  className="sortable-header"
                >
                  {key.replace(/_/g, " ").toUpperCase()}
                  {sortConfig.key === key && (
                    <span className="sort-indicator">
                      {sortConfig.direction === "ascending" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length === 0 ? (
              <tr>
                <td colSpan={getTableHeaders().length + 1} className="no-data">
                  Tidak ada data laporan yang cocok.
                </td>
              </tr>
            ) : (
              paginatedReports.map((report) => (
                <tr key={report.incident}>
                  <td className="action-cell sticky-col">
                    <button
                      onClick={() => handleReopen(report.incident)}
                      className="btn btn-reopen"
                      disabled={actionLoading === report.incident}
                    >
                      {actionLoading === report.incident
                        ? "Memproses..."
                        : "Re-open"}
                    </button>
                  </td>
                  {getTableHeaders().map((key) => (
                    <td
                      key={key}
                      className="data-cell truncate"
                      title={report[key]}
                    >
                      {String(report[key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &laquo; Sebelumnya
          </button>
          <span>
            Halaman <strong>{currentPage}</strong> dari{" "}
            <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Berikutnya &raquo;
          </button>
        </div>
      )}

      <div className="chart-container">
        {filteredReports.length > 0 ? (
          <Bar options={chartOptions} data={chartData} />
        ) : (
          !isLoading && (
            <p className="no-data">
              Tidak ada data untuk ditampilkan pada rentang waktu ini.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default Report;
