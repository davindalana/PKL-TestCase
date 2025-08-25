import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./Report.css";

const API_BASE_URL = "http://localhost:3000/api";

const Report = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setReports(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(err.message);
        console.error("Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getTableHeaders = () => {
    if (reports.length === 0) return [];
    // IMPROVEMENT: Sort keys alphabetically for consistent column order
    return Object.keys(reports[0]).sort();
  };

  const handleExportExcel = () => {
    if (reports.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Tiket Selesai");
    XLSX.writeFile(workbook, "laporan_tiket_selesai.xlsx");
  };

  const handleExportCSV = () => {
    if (reports.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "laporan_tiket_selesai.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (reports.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    const headers = getTableHeaders();
    const body = reports.map((row) =>
      headers.map((header) => row[header] ?? "")
    );

    doc.autoTable({
      head: [headers.map((h) => h.replace(/_/g, " ").toUpperCase())],
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] },
      margin: { top: 10 },
    });

    doc.save("laporan_tiket_selesai.pdf");
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
          <h2> Gagal Memuat Laporan 🔌</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="page-header">
        <h1>📊 Laporan Tiket Selesai</h1>
      </div>

      <div className="export-controls">
        <div className="export-buttons">
          <button onClick={handleExportExcel} className="btn btn-primary">
            Ekspor Excel
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            Ekspor CSV
          </button>
          <button onClick={handleExportPDF} className="btn btn-info">
            Ekspor PDF
          </button>
        </div>
        <div className="report-summary">
          Total Tiket Selesai: <strong>{reports.length}</strong>
        </div>
      </div>

      <div className="table-container">
        <table className="report-table">
          <thead>
            <tr>
              {getTableHeaders().map((key) => (
                <th key={key}>{key.replace(/_/g, " ").toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={getTableHeaders().length || 1} className="no-data">
                  Tidak ada data laporan yang tersedia.
                </td>
              </tr>
            ) : (
              reports.map((report, index) => (
                <tr key={report.incident || index}>
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
    </div>
  );
};

export default Report;
