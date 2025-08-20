import { useState, useEffect } from "react";
import "./LihatWO.css";

const LihatWO = () => {
  const [woData, setWoData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formatIncident, setFormatIncident] = useState(null);

  // Helper to get formatted text for an incident
  const getFormatText = (item) =>
    `STO : ${item.workzone || "-"}
NO. TIKET : ${item.incident || "-"}
SERVICE NO : ${item.service_no || "-"}    ${item.service_type || ""}
CUSTOMER NAME : ${item.customer_name || "-"}
SUMMARY : ${item.summary || "-"}
ALAMAT : ${item.alamat || "-"}

GAUL : ${item.gaul || "-"}
REPORTED BY : ${item.reported_by || "-"}
CUSTOMER TYPE : ${item.customer_type || "-"}
OWNER GROUP : ${item.owner_group || "-"}

REPORTED DATE : ${item.reported_date || "-"}
BOOKING DATE : ${item.booking_date || "-"}
`;

  // Helper to copy formatted text
  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(getFormatText(item));
    } catch {}
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:3001/api/wo");
        const data = await response.json();
        setWoData(data);
      } catch (error) {
        setWoData([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = woData.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, woData]);

  const handleDelete = async (incident) => {
    if (
      window.confirm("Apakah Anda yakin ingin menghapus data incident ini?")
    ) {
      setWoData(woData.filter((item) => item.incident !== incident));
      setSelectedItems(selectedItems.filter((item) => item !== incident));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus ${selectedItems.length} incident terpilih?`
      )
    ) {
      setWoData(
        woData.filter((item) => !selectedItems.includes(item.incident))
      );
      setSelectedItems([]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageItems = getCurrentPageData().map(
        (item) => item.incident
      );
      setSelectedItems([...new Set([...selectedItems, ...currentPageItems])]);
    } else {
      const currentPageItems = getCurrentPageData().map(
        (item) => item.incident
      );
      setSelectedItems(
        selectedItems.filter((incident) => !currentPageItems.includes(incident))
      );
    }
  };

  const handleSelectItem = (incident) => {
    if (selectedItems.includes(incident)) {
      setSelectedItems(selectedItems.filter((item) => item !== incident));
    } else {
      setSelectedItems([...selectedItems, incident]);
    }
  };

  const getCurrentPageData = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredData.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Memuat data incident...</p>
      </div>
    );
  }

  // Get all unique keys from data for dynamic table columns
  const allKeys = Array.from(
    new Set(filteredData.flatMap((obj) => Object.keys(obj)))
  );

  return (
    <div className="lihat-wo-container">
      <div className="page-header">
        <h1>📋 Lihat Incident Management</h1>
      </div>
      <div className="table-controls">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Cari berdasarkan incident, summary, customer, witel, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="wo-table">
          <thead>
            <tr>
              <th>AKSI</th>
              {allKeys.map((key) => (
                <th key={key}>{key.replace(/_/g, " ").toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getCurrentPageData().map((item) => (
              <tr key={item.incident || item.id}>
                <td className="aksi-cell">
                  <button
                    onClick={() => setFormatIncident(item)}
                    className="btn btn-secondary aksi-btn"
                  >
                    Format
                  </button>
                  <button
                    onClick={() => handleCopy(item)}
                    className="btn btn-info aksi-btn"
                  >
                    Salin
                  </button>
                  <button
                    onClick={() => handleDelete(item.incident)}
                    className="btn btn-danger aksi-btn"
                  >
                    Hapus
                  </button>
                </td>
                {allKeys.map((key) => {
                  const value =
                    item[key] !== null && item[key] !== undefined
                      ? String(item[key])
                      : "";
                  return (
                    <td key={key} className="data-cell" title={value}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal Format Incident - only here, outside table-container */}
      {formatIncident && (
        <div className="format-modal" onClick={() => setFormatIncident(null)}>
          <div
            className="format-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Format Incident</h2>
            <pre className="format-pre">{getFormatText(formatIncident)}</pre>
            <button
              className="btn btn-primary"
              onClick={() => setFormatIncident(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LihatWO;
