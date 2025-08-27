// src/pages/LihatWO/index.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import "./LihatWO.css";
import { useDebounce } from "../../hooks/useDebounce";
import { getFormatText, getInitialVisibleKeys } from "../../utils/woUtils";
import { WorkOrderRow } from "./WorkOrderRow";
import { EditModal } from "./EditModal";
import SortIcon from "../../components/SortIcon";

const API_BASE_URL = "http://localhost:3000/api";

// Daftar lengkap semua kolom yang mungkin ada, berdasarkan gambar Anda.
// Urutan item di sini menentukan urutan default kolom di tabel.
const ALL_POSSIBLE_KEYS = [
  "incident",
  "ticket_id_gamas",
  "external_ticket_id",
  "customer_id",
  "customer_name",
  "service_id",
  "service_no",
  "summary",
  "description_assignment",
  "reported_date",
  "reported_by",
  "reported_priority",
  "source_ticket",
  "channel",
  "contact_phone",
  "contact_name",
  "contact_email",
  "status",
  "status_date",
  "booking_date",
  "resolve_date",
  "date_modified",
  "last_update_worklog",
  "closed_by",
  "closed_reopen_by",
  "guarantee_status",
  "ttr_customer",
  "ttr_agent",
  "ttr_mitra",
  "ttr_nasional",
  "th_pending",
  "th_region",
  "th_witel",
  "ttr_end_to_end",
  "owner_group",
  "owner",
  "witel",
  "workzone",
  "region",
  "subsidiary",
  "territory_near_end",
  "territory_far_end",
  "customer_segment",
  "customer_type",
  "customer_category",
  "service_type",
  "slg",
  "technology",
  "lapul",
  "gaul",
  "onu_rx",
  "pending_reason",
  "incident_domain",
  "symptom",
  "hierarchy_path",
  "solution",
  "description_actual_solution",
  "kode_produk",
  "perangkat",
  "technician",
  "device_name",
  "sn_ont",
  "tipe_ont",
  "manufacture_ont",
  "impacted_site",
  "cause",
  "resolution",
  "worklog_summary",
  "classification_flag",
  "realm",
  "related_to_gamas",
  "toc_result",
  "scc_result",
  "note",
  "notes_eskalasi",
  "rk_information",
  "external_ticket_tier_3",
  "classification_path",
  "urgency",
  "alamat",
  "korlap",
  "sektor",
];

// Daftar statis untuk filter status
const ALL_STATUS_OPTIONS = [
  "IN PROGRESS",
  "PENDING",
  "RESOLVED",
  "CLOSED",
  "OPEN",
];

const LihatWO = () => {
  const [woData, setWoData] = useState([]);
  const [workzoneMap, setWorkzoneMap] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formatIncident, setFormatIncident] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [filter, setFilter] = useState({
    status: "",
    sektor: "",
    workzone: "",
    korlap: "",
    witel: "",
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "incident",
    direction: "asc",
  });
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [draftVisibleKeys, setDraftVisibleKeys] = useState(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [woResponse, workzoneMapResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/view-mysql`),
          fetch(`${API_BASE_URL}/workzone-map`),
        ]);

        if (!woResponse.ok || !workzoneMapResponse.ok) {
          throw new Error(`Gagal mengambil data.`);
        }

        const woResult = await woResponse.json();
        const workzoneMapResult = await workzoneMapResponse.json();

        setWoData(Array.isArray(woResult.data) ? woResult.data : []);
        setWorkzoneMap(
          Array.isArray(workzoneMapResult) ? workzoneMapResult : []
        );
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSektorForWorkzone = useCallback(
    (workzone) => {
      if (!workzone) return "";
      const match = workzoneMap.find((m) => m.workzone === workzone);
      return match ? match.sektor : "";
    },
    [workzoneMap]
  );

  const getKorlapsForWorkzone = useCallback(
    (workzone) => {
      if (!workzone) return [];
      const match = workzoneMap.find((m) => m.workzone === workzone);
      return match ? match.korlaps.sort() : [];
    },
    [workzoneMap]
  );

  const getWorkzonesForSektor = useCallback(
    (sektor) => {
      if (!sektor) return [];
      return workzoneMap
        .filter((m) => m.sektor === sektor)
        .map((m) => m.workzone)
        .sort();
    },
    [workzoneMap]
  );

  const allKeys = useMemo(() => ALL_POSSIBLE_KEYS, []);

  useEffect(() => {
    if (allKeys.length > 0 && visibleKeys.size === 0) {
      setVisibleKeys(getInitialVisibleKeys(allKeys));
    }
  }, [allKeys, visibleKeys.size]);

  const {
    statusOptions,
    witelOptions,
    sektorOptions,
    workzoneFilterOptions,
    korlapFilterOptions,
  } = useMemo(() => {
    const allSektors = [
      ...new Set(workzoneMap.map((item) => item.sektor)),
    ].sort();
    const availableWorkzones = filter.sektor
      ? getWorkzonesForSektor(filter.sektor)
      : [...new Set(workzoneMap.map((i) => i.workzone))].sort();
    const availableKorlaps = filter.workzone
      ? getKorlapsForWorkzone(filter.workzone)
      : [...new Set(workzoneMap.flatMap((item) => item.korlaps))].sort();
    return {
      statusOptions: ALL_STATUS_OPTIONS,
      witelOptions: Array.from(
        new Set(woData.map((d) => d.witel).filter(Boolean))
      ).sort(),
      sektorOptions: allSektors,
      workzoneFilterOptions: availableWorkzones,
      korlapFilterOptions: availableKorlaps,
    };
  }, [
    woData,
    filter.sektor,
    filter.workzone,
    workzoneMap,
    getWorkzonesForSektor,
    getKorlapsForWorkzone,
  ]);

  const sortedData = useMemo(() => {
    const filtered = woData.filter((item) => {
      const searchMatch = Object.entries(item).some(
        ([key, value]) =>
          visibleKeys.has(key) &&
          String(value)
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase())
      );
      return (
        searchMatch &&
        (!filter.status || item.status === filter.status) &&
        (!filter.witel || item.witel === filter.witel) &&
        (!filter.sektor || item.sektor === filter.sektor) &&
        (!filter.workzone || item.workzone === filter.workzone) &&
        (!filter.korlap || item.korlap === filter.korlap)
      );
    });
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [debouncedSearchTerm, woData, filter, visibleKeys, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedData.length]);

  const requestSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setFilter((prev) => {
      const newFilter = { ...prev, [field]: value };
      if (field === "sektor") {
        newFilter.workzone = "";
        newFilter.korlap = "";
      }
      if (field === "workzone") {
        newFilter.korlap = "";
      }
      return newFilter;
    });
  }, []);

  const handleUpdateRow = async (originalItem, updatedFields) => {
    const incidentId = originalItem.incident;
    const optimisticData = { ...originalItem, ...updatedFields };
    setUpdatingStatus((p) => ({ ...p, [incidentId]: true }));
    setWoData((prev) =>
      prev.map((d) => (d.incident === incidentId ? optimisticData : d))
    );
    try {
      const response = await fetch(
        `${API_BASE_URL}/work-orders/${incidentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optimisticData),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Gagal menyimpan");
      }
      setWoData((prev) =>
        prev.map((d) => (d.incident === incidentId ? result.data : d))
      );
    } catch (error) {
      console.error("Gagal update data:", error);
      alert("Gagal memperbarui data. Mengembalikan ke kondisi semula.");
      setWoData((prev) =>
        prev.map((d) => (d.incident === incidentId ? originalItem : d))
      );
    } finally {
      setUpdatingStatus((p) => ({ ...p, [incidentId]: false }));
    }
  };

  const handleEditSave = useCallback(
    async (updatedItem) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/work-orders/${editItem.incident}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedItem),
          }
        );

        const result = await response.json();
        if (!result.success)
          throw new Error(result.message || "Gagal menyimpan");

        setWoData((prev) =>
          prev.map((d) => (d.incident === editItem.incident ? result.data : d))
        );
        setEditItem(null);
      } catch (error) {
        alert("Gagal update data: " + error.message);
      }
    },
    [editItem]
  );

  const handleDelete = async (incident) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        await fetch(`${API_BASE_URL}/work-orders/${incident}`, {
          method: "DELETE",
        });
        setWoData((prev) => prev.filter((item) => item.incident !== incident));
        setSelectedItems((prev) => prev.filter((item) => item !== incident));
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const handleCompleteTicket = useCallback(
    async (incident) => {
      const ticketToComplete = woData.find(
        (item) => item.incident === incident
      );

      if (!ticketToComplete || !ticketToComplete.sektor) {
        alert(
          "⚠️ Gagal! Pastikan Sektor sudah dipilih sebelum menyelesaikan tiket."
        );
        return;
      }

      if (
        window.confirm(
          "Apakah Anda yakin ingin menyelesaikan tiket ini? Data akan dipindahkan ke laporan."
        )
      ) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/work-orders/${incident}/complete`,
            {
              method: "POST",
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Gagal menyelesaikan tiket di server."
            );
          }

          setWoData((prev) =>
            prev.filter((item) => item.incident !== incident)
          );
          setSelectedItems((prev) => prev.filter((item) => item !== incident));
          alert("Tiket berhasil diselesaikan dan dipindahkan ke laporan.");
        } catch (err) {
          console.error("Gagal menyelesaikan tiket:", err);
          alert("Gagal menyelesaikan tiket: " + err.message);
        }
      }
    },
    [woData]
  );

  const handleBulkDelete = useCallback(() => {
    if (
      selectedItems.length > 0 &&
      window.confirm(
        `Yakin ingin menghapus ${selectedItems.length} data terpilih?`
      )
    ) {
      Promise.all(
        selectedItems.map((id) =>
          fetch(`${API_BASE_URL}/work-orders/${id}`, { method: "DELETE" })
        )
      )
        .then(() => {
          setWoData((prev) =>
            prev.filter((item) => !selectedItems.includes(item.incident))
          );
          setSelectedItems([]);
        })
        .catch(() => alert("Gagal menghapus beberapa item."));
    }
  }, [selectedItems]);

  const handleCopy = useCallback(async (item) => {
    try {
      await navigator.clipboard.writeText(getFormatText(item));
      alert("Format berhasil disalin!");
    } catch (err) {
      console.error("Gagal menyalin teks:", err);
    }
  }, []);

  const handleSelectItem = useCallback((id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const getCurrentPageData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const dataToShow = getCurrentPageData();

  const isAllOnPageSelected = useMemo(
    () =>
      dataToShow.length > 0 &&
      dataToShow.every((item) => selectedItems.includes(item.incident)),
    [dataToShow, selectedItems]
  );

  const handleSelectAll = useCallback(
    (e) => {
      const currentPageIds = dataToShow.map((item) => item.incident);
      if (e.target.checked) {
        setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
      } else {
        setSelectedItems((prev) =>
          prev.filter((id) => !currentPageIds.includes(id))
        );
      }
    },
    [dataToShow]
  );

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

  if (isLoading)
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div> <p>Memuat data...</p>
      </div>
    );

  if (error)
    return (
      <div className="lihat-wo-container">
        <div className="error-container">
          <h2> Gagal Memuat Data 🔌</h2>
          <p>Terjadi kesalahan saat mengambil data dari server. </p>
          <pre className="error-message">{error}</pre>
          <p>
            <strong>Pastikan server backend Anda berjalan</strong> dan alamat
            API sudah benar.
          </p>
        </div>
      </div>
    );

  return (
    <div className="lihat-wo-container">
      <div className="page-header">
        <h1>📋 Lihat Incident Management</h1>
      </div>

      <div className="table-controls">
        <div className="search-and-filters">
          <input
            type="text"
            placeholder="🔍 Cari di kolom yang tampil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-box">
            <div className="filter-group">
              <div className="filter-item">
                <label>Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">Semua Status</option>
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Witel</label>
                <select
                  value={filter.witel}
                  onChange={(e) => handleFilterChange("witel", e.target.value)}
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
            <div className="filter-group">
              <div className="filter-item">
                <label>Sektor</label>
                <select
                  value={filter.sektor}
                  onChange={(e) => handleFilterChange("sektor", e.target.value)}
                >
                  <option value="">Semua Sektor</option>
                  {sektorOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Workzone</label>
                <select
                  value={filter.workzone}
                  onChange={(e) =>
                    handleFilterChange("workzone", e.target.value)
                  }
                >
                  <option value="">Semua Workzone</option>
                  {workzoneFilterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Korlap</label>
                <select
                  value={filter.korlap}
                  onChange={(e) => handleFilterChange("korlap", e.target.value)}
                >
                  <option value="">Semua Korlap</option>
                  {korlapFilterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="action-section">
          <button
            onClick={() => {
              setDraftVisibleKeys(new Set(visibleKeys));
              setShowColumnSelector(true);
            }}
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
                  onChange={() =>
                    setDraftVisibleKeys((prev) => {
                      const newSet = new Set(prev);
                      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
                      return newSet;
                    })
                  }
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
                <td colSpan={visibleKeys.size + 2} className="no-data">
                  Tidak ada data yang cocok.
                </td>
              </tr>
            ) : (
              dataToShow.map((item) => (
                <WorkOrderRow
                  key={item.incident}
                  item={item}
                  allKeys={allKeys}
                  visibleKeys={visibleKeys}
                  isSelected={selectedItems.includes(item.incident)}
                  onSelect={handleSelectItem}
                  onUpdate={handleUpdateRow}
                  updatingStatus={updatingStatus}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                  onFormat={setFormatIncident}
                  onCopy={handleCopy}
                  onComplete={handleCompleteTicket}
                  allSektorOptions={sektorOptions}
                  statusOptions={statusOptions}
                  getSektorForWorkzone={getSektorForWorkzone}
                  getWorkzonesForSektor={getWorkzonesForSektor}
                  getKorlapsForWorkzone={getKorlapsForWorkzone}
                />
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
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleEditSave}
          allSektorOptions={sektorOptions}
          getSektorForWorkzone={getSektorForWorkzone}
          getWorkzonesForSektor={getWorkzonesForSektor}
          getKorlapsForWorkzone={getKorlapsForWorkzone}
        />
      )}
    </div>
  );
};

export default LihatWO;
