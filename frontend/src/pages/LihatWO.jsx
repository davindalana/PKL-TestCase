import { useState, useEffect, useMemo } from "react";
import "./LihatWO.css";

// Komponen ikon sederhana untuk sorting
const SortIcon = ({ direction }) => (
  <span className="sort-icon">
    {direction === "asc" ? "🔼" : direction === "desc" ? "🔽" : "↕️"}
  </span>
);

// Fungsi untuk mendapatkan pengaturan kolom dari localStorage atau menggunakan default
const getInitialVisibleKeys = (allKeys) => {
  try {
    const savedColumns = localStorage.getItem("wo_visible_columns");
    if (savedColumns) {
      return new Set(JSON.parse(savedColumns));
    }
  } catch (error) {
    console.error("Gagal membaca kolom dari localStorage", error);
  }
  // Default jika tidak ada yang tersimpan
  const initialVisible = new Set([
    "incident",
    "customer_name",
    "summary",
    "witel",
    "workzone",
    "status",
    "korlap",
  ]);
  // Pastikan hanya menampilkan kolom default yang benar-benar ada di data
  return new Set(allKeys.filter((key) => initialVisible.has(key)));
};

const LihatWO = () => {
  // State dari kode asli Anda
  const [woData, setWoData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formatIncident, setFormatIncident] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [filter, setFilter] = useState({ status: "", workzone: "", witel: "" });

  // State untuk fitur tambahan
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [draftVisibleKeys, setDraftVisibleKeys] = useState(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Helper dari kode asli Anda
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

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(getFormatText(item));
      alert("Format berhasil disalin!");
    } catch {}
  };

  // Fetch data dari kode asli Anda
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/view-mysql");
        const result = await response.json();
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

  // Logika kolom dinamis dari kode asli Anda (dipertahankan)
  const allKeys = useMemo(() => {
    const keys = Array.from(new Set(woData.flatMap((obj) => Object.keys(obj))));
    if (!keys.includes("korlap")) keys.push("korlap");
    return keys;
  }, [woData]);

  // Inisialisasi visibleKeys setelah 'allKeys' tersedia dari data
  useEffect(() => {
    if (allKeys.length > 0) {
      setVisibleKeys(getInitialVisibleKeys(allKeys));
    }
  }, [allKeys]);

  // =================================================================
  // ▼▼▼ BAGIAN YANG DIPERBAIKI: OPSI FILTER DAN KORLAP DINAMIS ▼▼▼
  // =================================================================
  const { statusOptions, workzoneOptions, witelOptions, korlapOptions } =
    useMemo(() => {
      const statusSet = new Set(woData.map((d) => d.status).filter(Boolean));
      if (!statusSet.has("NEW")) statusSet.add("NEW");

      // Membuat daftar korlap dinamis
      const korlapSet = new Set(["Budi", "Siti", "Andi", "Rina", "Dedi"]); // Nama default
      woData.forEach((item) => {
        if (item.korlap) {
          korlapSet.add(item.korlap); // Tambah nama dari data
        }
      });

      return {
        statusOptions: [
          "NEW",
          ...Array.from(statusSet).filter((s) => s !== "NEW"),
        ],
        workzoneOptions: Array.from(
          new Set(woData.map((d) => d.workzone).filter(Boolean))
        ),
        witelOptions: Array.from(
          new Set(woData.map((d) => d.witel).filter(Boolean))
        ),
        korlapOptions: Array.from(korlapSet).sort(), // Mengurutkan nama korlap
      };
    }, [woData]);
  // =================================================================
  // ▲▲▲ AKHIR DARI BAGIAN YANG DIPERBAIKI ▲▲▲
  // =================================================================

  // Logika filter & search
  useEffect(() => {
    let filtered = woData.filter((item) =>
      Object.entries(item).some(([key, value]) =>
        visibleKeys.size > 0
          ? visibleKeys.has(key) &&
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          : value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    if (filter.status)
      filtered = filtered.filter((d) => d.status === filter.status);
    if (filter.workzone)
      filtered = filtered.filter((d) => d.workzone === filter.workzone);
    if (filter.witel)
      filtered = filtered.filter((d) => d.witel === filter.witel);

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, woData, filter, visibleKeys]);

  // Logika Penyortiran (Sorting)
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  // Logika CRUD
  const handleDelete = async (incident) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        await fetch(`http://localhost:3000/api/work-orders/${incident}`, {
          method: "DELETE",
        });
      } catch {}
      setWoData(woData.filter((item) => item.incident !== incident));
      setSelectedItems(selectedItems.filter((item) => item !== incident));
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setEditForm({ ...item });
  };
  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEditCancel = () => setEditItem(null);
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

  // Logika Aksi Massal
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    if (
      window.confirm(
        `Yakin ingin menghapus ${selectedItems.length} data terpilih?`
      )
    ) {
      setWoData(
        woData.filter((item) => !selectedItems.includes(item.incident))
      );
      setSelectedItems([]);
    }
  };

  const handleSelectAll = (e) => {
    const currentPageItems = getCurrentPageData().map((item) => item.incident);
    if (e.target.checked) {
      setSelectedItems([...new Set([...selectedItems, ...currentPageItems])]);
    } else {
      setSelectedItems(
        selectedItems.filter((incident) => !currentPageItems.includes(incident))
      );
    }
  };

  const handleSelectItem = (incident) => {
    setSelectedItems((prev) =>
      prev.includes(incident)
        ? prev.filter((item) => item !== incident)
        : [...prev, incident]
    );
  };

  // Logika Paginasi
  const getCurrentPageData = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedData.slice(indexOfFirstItem, indexOfLastItem);
  };

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const dataToShow = getCurrentPageData();
  const isAllOnPageSelected =
    dataToShow.length > 0 &&
    dataToShow.every((item) => selectedItems.includes(item.incident));

  // Logika Kustomisasi Kolom
  const handleOpenColumnSelector = () => {
    setDraftVisibleKeys(new Set(visibleKeys));
    setShowColumnSelector(true);
  };

  const handleDraftColumnChange = (key) => {
    setDraftVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const handleApplyColumnChanges = () => {
    setVisibleKeys(draftVisibleKeys);
    try {
      localStorage.setItem(
        "wo_visible_columns",
        JSON.stringify(Array.from(draftVisibleKeys))
      );
    } catch (error) {
      console.error("Gagal menyimpan kolom ke localStorage", error);
    }
    setShowColumnSelector(false);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div> <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="lihat-wo-container">
      <div className="page-header">
        <h1>📋 Lihat Incident Management</h1>
      </div>

      <div className="table-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Cari di kolom yang tampil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-box">
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
        <div className="action-section">
          <button
            onClick={handleOpenColumnSelector}
            className="btn btn-outline"
          >
            ⚙️ Atur Kolom
          </button>
          <button
            onClick={handleBulkDelete}
            className="btn btn-danger"
            disabled={selectedItems.length === 0}
          >
            🗑️ Hapus ({selectedItems.length})
          </button>
        </div>
      </div>

      {showColumnSelector && (
        <div className="column-selector">
          <h4>Tampilkan Kolom:</h4>
          <div className="column-selector-grid">
            {allKeys.map((key) => (
              <div key={key} className="column-item">
                <input
                  type="checkbox"
                  id={`col-${key}`}
                  checked={draftVisibleKeys.has(key)}
                  onChange={() => handleDraftColumnChange(key)}
                />
                <label htmlFor={`col-${key}`}>{key.replace(/_/g, " ")}</label>
              </div>
            ))}
          </div>
          <div className="column-selector-actions">
            <button
              onClick={() => setShowColumnSelector(false)}
              className="btn btn-outline"
            >
              Batal
            </button>
            <button
              onClick={handleApplyColumnChanges}
              className="btn btn-primary"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="wo-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllOnPageSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th>AKSI</th>
              {allKeys
                .filter((key) => visibleKeys.has(key))
                .map((key) => (
                  <th key={key} onClick={() => requestSort(key)}>
                    {key.replace(/_/g, " ").toUpperCase()}
                    <SortIcon
                      direction={
                        sortConfig.key === key ? sortConfig.direction : null
                      }
                    />
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {dataToShow.length === 0 ? (
              <tr>
                <td colSpan={2 + visibleKeys.size} className="no-data">
                  Tidak ada data yang cocok dengan filter Anda.
                </td>
              </tr>
            ) : (
              dataToShow.map((item) => (
                <tr
                  key={item.incident}
                  className={
                    selectedItems.includes(item.incident) ? "selected" : ""
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.incident)}
                      onChange={() => handleSelectItem(item.incident)}
                    />
                  </td>
                  <td className="aksi-cell">
                    <button
                      onClick={() => setFormatIncident(item)}
                      className="btn aksi-btn btn-secondary"
                    >
                      Format
                    </button>
                    <button
                      onClick={() => handleCopy(item)}
                      className="btn aksi-btn btn-info"
                    >
                      Salin
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn aksi-btn btn-warning"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.incident)}
                      className="btn aksi-btn btn-danger"
                    >
                      Hapus
                    </button>
                  </td>
                  {allKeys
                    .filter((key) => visibleKeys.has(key))
                    .map((key) => {
                      let value = item[key] != null ? String(item[key]) : "";
                      if (key === "status") {
                        return (
                          <td key={key} className="data-cell">
                            <select
                              value={item.status || ""}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                setUpdatingStatus((p) => ({
                                  ...p,
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
                                  setWoData((p) =>
                                    p.map((d) =>
                                      d.incident === item.incident
                                        ? { ...d, status: newStatus }
                                        : d
                                    )
                                  );
                                } catch {
                                  alert("Gagal update status");
                                }
                                setUpdatingStatus((p) => ({
                                  ...p,
                                  [item.incident]: false,
                                }));
                              }}
                              disabled={updatingStatus[item.incident]}
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>{" "}
                            {updatingStatus[item.incident] && "⏳"}
                          </td>
                        );
                      }
                      if (key === "korlap") {
                        return (
                          <td key={key} className="data-cell">
                            <select
                              value={item.korlap || ""}
                              onChange={async (e) => {
                                const newKorlap = e.target.value;
                                setUpdatingStatus((p) => ({
                                  ...p,
                                  [item.incident + "-k"]: true,
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
                                        korlap: newKorlap,
                                      }),
                                    }
                                  );
                                  setWoData((p) =>
                                    p.map((d) =>
                                      d.incident === item.incident
                                        ? { ...d, korlap: newKorlap }
                                        : d
                                    )
                                  );
                                } catch {
                                  alert("Gagal update korlap");
                                }
                                setUpdatingStatus((p) => ({
                                  ...p,
                                  [item.incident + "-k"]: false,
                                }));
                              }}
                              disabled={updatingStatus[item.incident + "-k"]}
                            >
                              <option value="">- Pilih -</option>
                              {/* Gunakan korlapOptions yang dinamis */}
                              {korlapOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>{" "}
                            {updatingStatus[item.incident + "-k"] && "⏳"}
                          </td>
                        );
                      }
                      return (
                        <td key={key} className="data-cell" title={value}>
                          {value}
                        </td>
                      );
                    })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="page-info">
          Menampilkan{" "}
          {dataToShow.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
          {Math.min(sortedData.length, currentPage * itemsPerPage)} dari{" "}
          {sortedData.length} data
        </span>
        <div>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &laquo; Sebelumnya
          </button>
          <span className="page-number">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Berikutnya &raquo;
          </button>
        </div>
      </div>

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
      {editItem && (
        <div className="format-modal" onClick={handleEditCancel}>
          <div
            className="format-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Edit Incident: {editItem.incident}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              {Object.keys(editForm).map((key) => {
                if (key === "korlap") {
                  return (
                    <div key={key} className="form-group">
                      <label>{key.replace(/_/g, " ")}:</label>
                      <input
                        list="korlap-options"
                        name={key}
                        value={editForm[key] || ""}
                        onChange={handleEditChange}
                        placeholder="Pilih atau ketik korlap baru"
                      />
                      <datalist id="korlap-options">
                        {/* Gunakan korlapOptions yang dinamis */}
                        {korlapOptions.map((korlapName) => (
                          <option key={korlapName} value={korlapName} />
                        ))}
                      </datalist>
                    </div>
                  );
                }

                return (
                  <div key={key} className="form-group">
                    <label>{key.replace(/_/g, " ")}:</label>
                    <input
                      name={key}
                      value={editForm[key] || ""}
                      onChange={handleEditChange}
                      disabled={key === "incident"}
                    />
                  </div>
                );
              })}
              <div className="form-actions">
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
    </div>
  );
};

export default LihatWO;
