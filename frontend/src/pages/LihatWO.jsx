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
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({}); // {incident: true/false}
  const [filter, setFilter] = useState({ status: "", workzone: "", witel: "" });

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
        const response = await fetch("http://localhost:3000/api/view-mysql");
        const result = await response.json();
        // Anti duplikat berdasarkan incident
        const unique = [];
        const seen = new Set();
        (Array.isArray(result.data) ? result.data : []).forEach((item) => {
          if (item.incident && !seen.has(item.incident)) {
            seen.add(item.incident);
            unique.push(item);
          }
        });
        setWoData(unique);
      } catch (error) {
        setWoData([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Filter dropdown options
  let statusOptions = Array.from(
    new Set(woData.map((d) => d.status).filter(Boolean))
  );
  if (!statusOptions.includes("NEW")) statusOptions = ["NEW", ...statusOptions];
  const workzoneOptions = Array.from(
    new Set(woData.map((d) => d.workzone).filter(Boolean))
  );
  const witelOptions = Array.from(
    new Set(woData.map((d) => d.witel).filter(Boolean))
  );

  useEffect(() => {
    let filtered = woData.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    // Filter by dropdowns
    if (filter.status)
      filtered = filtered.filter((d) => d.status === filter.status);
    if (filter.workzone)
      filtered = filtered.filter((d) => d.workzone === filter.workzone);
    if (filter.witel)
      filtered = filtered.filter((d) => d.witel === filter.witel);
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, woData, filter]);

  const handleDelete = async (incident) => {
    if (
      window.confirm("Apakah Anda yakin ingin menghapus data incident ini?")
    ) {
      try {
        await fetch(`http://localhost:3000/api/work-orders/${incident}`, {
          method: "DELETE",
        });
      } catch {}
      setWoData(woData.filter((item) => item.incident !== incident));
      setSelectedItems(selectedItems.filter((item) => item !== incident));
    }
  };
  // Dummy mapping workzone -> korlap
  const korlapMap = {
    BTU: "Budi",
    MLG: "Siti",
    KDR: "Andi",
    default: "Korlap Default",
  };
  const getKorlap = (workzone) => korlapMap[workzone] || korlapMap["default"];
  // Edit logic
  const handleEdit = (item) => {
    setEditItem(item);
    setEditForm({ ...item });
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSave = async () => {
    try {
      await fetch(
        `http://localhost:3000/api/work-orders/${editItem.incident}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );
      setWoData((prev) =>
        prev.map((d) =>
          d.incident === editItem.incident ? { ...editForm } : d
        )
      );
      setEditItem(null);
    } catch {
      alert("Gagal update data");
    }
  };
  const handleEditCancel = () => setEditItem(null);

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
  let allKeys = Array.from(
    new Set(filteredData.flatMap((obj) => Object.keys(obj)))
  );
  // Tambahkan kolom korlap jika belum ada
  if (!allKeys.includes("korlap")) allKeys.push("korlap");

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
          <div
            className="filter-box"
            style={{ display: "flex", gap: 8, marginTop: 8 }}
          >
            <select
              value={filter.status}
              onChange={(e) =>
                setFilter((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">Semua Status</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select
              value={filter.workzone}
              onChange={(e) =>
                setFilter((f) => ({ ...f, workzone: e.target.value }))
              }
            >
              <option value="">Semua Workzone</option>
              {workzoneOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select
              value={filter.witel}
              onChange={(e) =>
                setFilter((f) => ({ ...f, witel: e.target.value }))
              }
            >
              <option value="">Semua Witel</option>
              {witelOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
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
            {getCurrentPageData().length === 0 ? (
              <tr>
                <td
                  colSpan={1 + allKeys.length}
                  style={{ textAlign: "center" }}
                >
                  Tidak ada data incident
                </td>
              </tr>
            ) : (
              getCurrentPageData().map((item) => (
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
                      onClick={() => handleEdit(item)}
                      className="btn btn-warning aksi-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.incident)}
                      className="btn btn-danger aksi-btn"
                    >
                      Hapus
                    </button>
                  </td>
                  {allKeys.map((key) => {
                    let value = item[key];
                    let cellClass = "data-cell";
                    if (key === "korlap") {
                      value = getKorlap(item.workzone);
                      cellClass = "korlap-cell";
                    }
                    value =
                      value !== null && value !== undefined
                        ? String(value)
                        : "";
                    // Inline dropdown untuk kolom status
                    if (key === "status") {
                      return (
                        <td key={key} className={cellClass} title={value}>
                          <select
                            value={item.status || ""}
                            disabled={!!updatingStatus[item.incident]}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              setUpdatingStatus((prev) => ({
                                ...prev,
                                [item.incident]: true,
                              }));
                              try {
                                await fetch(
                                  `http://localhost:3000/api/work-orders/${item.incident}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      ...item,
                                      status: newStatus,
                                    }),
                                  }
                                );
                                setWoData((prev) =>
                                  prev.map((d) =>
                                    d.incident === item.incident
                                      ? { ...d, status: newStatus }
                                      : d
                                  )
                                );
                              } catch {
                                alert("Gagal update status");
                              }
                              setUpdatingStatus((prev) => ({
                                ...prev,
                                [item.incident]: false,
                              }));
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          {updatingStatus[item.incident] && (
                            <span style={{ marginLeft: 4, fontSize: 12 }}>
                              ⏳
                            </span>
                          )}
                        </td>
                      );
                    }
                    // Inline dropdown untuk kolom lain bisa ditambah di sini
                    return (
                      <td key={key} className={cellClass} title={value}>
                        {value}
                      </td>
                    );
                  })}
                  {/* Modal Edit Incident */}
                  {editItem && (
                    <div className="format-modal" onClick={handleEditCancel}>
                      <div
                        className="format-modal-content"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h2>Edit Incident</h2>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditSave();
                          }}
                        >
                          {Object.keys(editForm).map((key) =>
                            key === "incident" ? (
                              <div key={key}>
                                <b>ID: {editForm[key]}</b>
                              </div>
                            ) : (
                              <div key={key} style={{ marginBottom: 8 }}>
                                <label style={{ fontWeight: 600 }}>
                                  {key.replace(/_/g, " ")}:
                                </label>
                                {["status", "workzone", "witel"].includes(
                                  key
                                ) ? (
                                  <select
                                    name={key}
                                    value={editForm[key] || ""}
                                    onChange={handleEditChange}
                                  >
                                    <option value="">-</option>
                                    {key === "status" &&
                                      statusOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    {key === "workzone" &&
                                      workzoneOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    {key === "witel" &&
                                      witelOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                  </select>
                                ) : (
                                  <input
                                    name={key}
                                    value={editForm[key] || ""}
                                    onChange={handleEditChange}
                                  />
                                )}
                              </div>
                            )
                          )}
                          <div
                            style={{ marginTop: 16, display: "flex", gap: 8 }}
                          >
                            <button type="submit" className="btn btn-primary">
                              Simpan
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={handleEditCancel}
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </tr>
              ))
            )}
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
