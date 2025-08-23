import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { createPortal } from "react-dom";
import "./LihatWO.css";

const API_BASE_URL = "http://localhost:3000/api";

const getFormatText = (item) => `STO : ${item.workzone || "-"}
NO. TIKET : ${item.incident || "-"}
SERVICE NO : ${item.service_no || "-"}  ${item.service_type || ""}
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

const getInitialVisibleKeys = (allKeys) => {
  try {
    const saved = localStorage.getItem("wo_visible_columns");
    if (saved) return new Set(JSON.parse(saved));
  } catch (error) {
    console.error("Gagal membaca kolom dari localStorage", error);
  }
  const initial = new Set([
    "incident",
    "customer_name",
    "status",
    "sektor",
    "workzone",
    "korlap",
  ]);
  return new Set(allKeys.filter((key) => initial.has(key)));
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const updatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    const isOpening = !isOpen;
    setIsOpen(isOpening);
    if (isOpening) {
      updatePosition();
    }
  }, [isOpen, disabled, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const tableContainer = dropdownRef.current.closest(".table-container");
    const listeners = [
      {
        target: window,
        event: "scroll",
        handler: updatePosition,
        options: true,
      },
      { target: window, event: "resize", handler: updatePosition },
      { target: tableContainer, event: "scroll", handler: updatePosition },
    ];

    listeners.forEach(
      (l) =>
        l.target && l.target.addEventListener(l.event, l.handler, l.options)
    );

    return () => {
      listeners.forEach(
        (l) =>
          l.target &&
          l.target.removeEventListener(l.event, l.handler, l.options)
      );
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const displayValue = value || placeholder;

  return (
    <div
      className={`custom-dropdown ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className="dropdown-toggle"
        onClick={toggleDropdown}
      >
        {displayValue}
        <span className="dropdown-arrow">{isOpen ? "🔼" : "🔽"}</span>
      </button>
      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu-portal"
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
          >
            {placeholder && (
              <div className="dropdown-item" onClick={() => handleSelect("")}>
                {placeholder}
              </div>
            )}
            {options.map((opt) => (
              <div
                key={opt}
                className={`dropdown-item ${opt === value ? "selected" : ""}`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

const SortIcon = ({ direction }) => (
  <span className="sort-icon">
    {direction === "asc" ? "🔼" : direction === "desc" ? "🔽" : "↕️"}
  </span>
);

const WorkOrderRow = memo(
  ({
    item,
    allKeys,
    visibleKeys,
    isSelected,
    onSelect,
    onUpdate, // <--- onUpdate akan kita perbaiki cara memanggilnya
    updatingStatus,
    onEdit,
    onDelete,
    onFormat,
    onCopy,
    allSektorOptions,
    statusOptions,
    getSektorForWorkzone,
    getWorkzonesForSektor,
    getKorlapsForWorkzone,
  }) => {
    const handleDropdownChange = (key, value) => {
      let updatedFields = { [key]: value };
      if (key === "sektor") {
        updatedFields = { sektor: value, workzone: "", korlap: "" };
      }
      if (key === "workzone") {
        const newSektor = getSektorForWorkzone(value);
        updatedFields = { workzone: value, sektor: newSektor, korlap: "" };
      }
      
      // ==> PERBAIKAN 1: Kirim seluruh item dan field yang diupdate <==
      onUpdate(item, updatedFields);
    };

    const effectiveSektor = item.sektor || getSektorForWorkzone(item.workzone);
    const workzoneRowOptions = useMemo(() => getWorkzonesForSektor(effectiveSektor), [effectiveSektor, getWorkzonesForSektor]);
    const korlapRowOptions = useMemo(() => getKorlapsForWorkzone(item.workzone), [item.workzone, getKorlapsForWorkzone]);

    return (
      <tr className={isSelected ? "selected" : ""}>
        <td>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(item.incident)}
          />
        </td>
        <td className="aksi-cell">
          <button
            onClick={() => onFormat(item)}
            className="btn aksi-btn btn-secondary"
          >
            Format
          </button>
          <button
            onClick={() => onCopy(item)}
            className="btn aksi-btn btn-info"
          >
            Salin
          </button>
          <button
            onClick={() => onEdit(item)}
            className="btn aksi-btn btn-warning"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.incident)}
            className="btn aksi-btn btn-danger"
          >
            Hapus
          </button>
        </td>
        {allKeys
          .filter((key) => visibleKeys.has(key))
          .map((key) => {
            const isUpdating = updatingStatus[item.incident + key];
            if (key === "status") {
              return (
                <td key={key} className="interactive-cell">
                  <CustomDropdown
                    options={statusOptions}
                    value={item.status}
                    onChange={(v) => handleDropdownChange("status", v)}
                    disabled={isUpdating}
                    placeholder="- Pilih Status -"
                  />
                  {isUpdating && "⏳"}
                </td>
              );
            }
            if (key === "sektor") {
              return (
                <td key={key} className="interactive-cell">
                  <CustomDropdown
                    options={allSektorOptions}
                    value={effectiveSektor}
                    onChange={(v) => handleDropdownChange("sektor", v)}
                    disabled={isUpdating}
                    placeholder="- Pilih Sektor -"
                  />
                  {isUpdating && "⏳"}
                </td>
              );
            }
            if (key === "workzone") {
              return (
                <td key={key} className="interactive-cell">
                  <CustomDropdown
                    options={workzoneRowOptions}
                    value={item.workzone}
                    onChange={(v) => handleDropdownChange("workzone", v)}
                    disabled={!effectiveSektor || isUpdating}
                    placeholder="- Pilih Workzone -"
                  />
                  {isUpdating && "⏳"}
                </td>
              );
            }
            if (key === "korlap") {
              return (
                <td key={key} className="interactive-cell">
                  <CustomDropdown
                    options={korlapRowOptions}
                    value={item.korlap}
                    onChange={(v) => handleDropdownChange("korlap", v)}
                    disabled={!item.workzone || isUpdating}
                    placeholder="- Pilih Korlap -"
                  />
                  {isUpdating && "⏳"}
                </td>
              );
            }
            return (
              <td key={key} className="data-cell truncate" title={item[key]}>
                {String(item[key] ?? "")}
              </td>
            );
          })}
      </tr>
    );
  }
);

const EditModal = ({
  item,
  onClose,
  onSave,
  allSektorOptions,
  getSektorForWorkzone,
  getWorkzonesForSektor,
  getKorlapsForWorkzone,
}) => {
  const [editForm, setEditForm] = useState({ ...item });

  useEffect(() => {
    if (!editForm.sektor && editForm.workzone) {
      setEditForm((prev) => ({
        ...prev,
        sektor: getSektorForWorkzone(prev.workzone),
      }));
    }
  }, [editForm.workzone, editForm.sektor, getSektorForWorkzone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => {
      let newState = { ...prev, [name]: value };
      if (name === "sektor") {
        newState.workzone = "";
        newState.korlap = "";
      }
      if (name === "workzone") {
        newState.korlap = "";
      }
      return newState;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editForm);
  };
  const workzoneOptions = useMemo(
    () => getWorkzonesForSektor(editForm.sektor),
    [editForm.sektor, getWorkzonesForSektor]
  );
  const korlapOptions = useMemo(
    () => getKorlapsForWorkzone(editForm.workzone),
    [editForm.workzone, getKorlapsForWorkzone]
  );

  return (
    <div className="format-modal" onClick={onClose}>
      <div
        className="format-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Edit Incident: {item.incident}</h2>
        <form onSubmit={handleSubmit}>
          {Object.keys(editForm).map((key) => {
            if (["created_at", "updated_at"].includes(key)) return null;
            if (key === "sektor")
              return (
                <div key={key} className="form-group">
                  <label>{key.replace(/_/g, " ")}:</label>
                  <select
                    name={key}
                    value={editForm[key] || ""}
                    onChange={handleChange}
                  >
                    <option value="">- Pilih Sektor -</option>
                    {allSektorOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            if (key === "workzone")
              return (
                <div key={key} className="form-group">
                  <label>{key.replace(/_/g, " ")}:</label>
                  <select
                    name={key}
                    value={editForm[key] || ""}
                    onChange={handleChange}
                    disabled={!editForm.sektor}
                  >
                    <option value="">- Pilih Workzone -</option>
                    {workzoneOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            if (key === "korlap")
              return (
                <div key={key} className="form-group">
                  <label>{key.replace(/_/g, " ")}:</label>
                  <select
                    name={key}
                    value={editForm[key] || ""}
                    onChange={handleChange}
                    disabled={!editForm.workzone}
                  >
                    <option value="">- Pilih Korlap -</option>
                    {korlapOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            return (
              <div key={key} className="form-group">
                <label>{key.replace(/_/g, " ")}:</label>
                <input
                  name={key}
                  value={editForm[key] || ""}
                  onChange={handleChange}
                  disabled={key === "incident"}
                />
              </div>
            );
          })}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Simpan
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
        const [woResponse, workzoneResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/view-mysql`),
          fetch(`${API_BASE_URL}/workzone-map`),
        ]);

        if (!woResponse.ok || !workzoneResponse.ok) {
          throw new Error(
            `Gagal mengambil data. Status WO: ${woResponse.status}, Status Workzone: ${workzoneResponse.status}`
          );
        }

        const woResult = await woResponse.json();
        const workzoneData = await workzoneResponse.json();

        const unique = [];
        const seen = new Set();
        (Array.isArray(woResult.data) ? woResult.data : []).forEach((item) => {
          if (item.incident && !seen.has(item.incident)) {
            seen.add(item.incident);
            unique.push(item);
          }
        });
        setWoData(unique);
        setWorkzoneMap(Array.isArray(workzoneData) ? workzoneData : []);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError(err.message);
        setWoData([]);
        setWorkzoneMap([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const getSektorForWorkzone = useCallback(
    (workzone) => {
      if (!workzone) return "";
      const normalizedWorkzone = workzone.toLowerCase().trim();
      const match = workzoneMap.find(
        (m) => m.workzone?.toLowerCase().trim() === normalizedWorkzone
      );
      return match?.sektor || "";
    },
    [workzoneMap]
  );

  const getKorlapsForWorkzone = useCallback(
    (workzone) => {
      if (!workzone) return [];
      const normalizedWorkzone = workzone.toLowerCase().trim();
      const match = workzoneMap.find(
        (m) => m.workzone?.toLowerCase().trim() === normalizedWorkzone
      );
      return match?.korlaps || [];
    },
    [workzoneMap]
  );

  const getWorkzonesForSektor = useCallback(
    (sektor) => {
      if (!sektor) return [];
      return [
        ...new Set(
          workzoneMap.filter((m) => m.sektor === sektor).map((m) => m.workzone)
        ),
      ];
    },
    [workzoneMap]
  );

  const allKeys = useMemo(() => {
    const keys = new Set(woData.flatMap((obj) => Object.keys(obj)));
    if (!keys.has("korlap")) keys.add("korlap");
    if (!keys.has("sektor")) keys.add("sektor");
    return Array.from(keys);
  }, [woData]);

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
    const statusSet = new Set(woData.map((d) => d.status).filter(Boolean));
    if (!statusSet.has("NEW")) statusSet.add("NEW");

    const allSektors = [
      ...new Set(workzoneMap.map((item) => item.sektor)),
    ].sort();

    const availableWorkzones = filter.sektor
      ? getWorkzonesForSektor(filter.sektor)
      : [...new Set(workzoneMap.map((i) => i.workzone))];

    const availableKorlaps = filter.workzone
      ? getKorlapsForWorkzone(filter.workzone)
      : [];

    return {
      statusOptions: [
        "NEW",
        ...Array.from(statusSet).filter((s) => s !== "NEW"),
      ],
      witelOptions: Array.from(
        new Set(woData.map((d) => d.witel).filter(Boolean))
      ).sort(),
      sektorOptions: allSektors,
      workzoneFilterOptions: availableWorkzones.sort(),
      korlapFilterOptions: availableKorlaps.sort(),
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
      const itemSektor = item.sektor || getSektorForWorkzone(item.workzone);
      return (
        searchMatch &&
        (!filter.status || item.status === filter.status) &&
        (!filter.witel || item.witel === filter.witel) &&
        (!filter.sektor || itemSektor === filter.sektor) &&
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
  }, [
    debouncedSearchTerm,
    woData,
    filter,
    visibleKeys,
    sortConfig,
    getSektorForWorkzone,
  ]);

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

  // ==> PERBAIKAN 2: Fungsi handleUpdateRow yang baru <==
  const handleUpdateRow = useCallback(async (originalItem, updatedFields) => {
    const incidentId = originalItem.incident;
    const dataToSend = { ...originalItem, ...updatedFields };

    setUpdatingStatus((p) => ({ ...p, [incidentId]: true })); // Tampilkan loading untuk seluruh baris

    try {
      const response = await fetch(`${API_BASE_URL}/work-orders/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend), // Kirim data yang sudah digabung
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Gagal menyimpan perubahan ke server.");
      }

      // ==> PERBAIKAN: Gunakan 'result.data' dari backend untuk update state <==
      setWoData((prev) =>
        prev.map((d) =>
          d.incident === incidentId ? result.data : d // Ganti data lama dengan data baru dari server
        )
      );

    } catch (error) {
      console.error("Gagal update data:", error);
      alert("Gagal memperbarui data.");
    } finally {
      setUpdatingStatus((p) => ({ ...p, [incidentId]: false })); // Hilangkan loading
    }
  }, []); // Dependensi kosong karena semua data didapat dari argumen

    // Ganti fungsi handleEditSave yang lama dengan yang ini
  const handleEditSave = useCallback(
    async (updatedItem) => {
      try {
        const response = await fetch(`${API_BASE_URL}/work-orders/${editItem.incident}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        });

        const result = await response.json();

        if (!result.success) {
          // Jika backend mengirim pesan error, tampilkan
          throw new Error(result.message || "Gagal menyimpan data ke server.");
        }

        // Tutup modal edit
        setEditItem(null);
        alert("Data berhasil disimpan!"); // Beri notifikasi sebelum refresh

        // ==> PERBAIKAN DI SINI: Paksa muat ulang halaman <==
        window.location.reload();

      } catch (error) {
        alert("Error: " + error.message);
      }
    },
    [editItem] // Dependency array tetap diisi agar editItem tidak basi
  );

  const handleDelete = useCallback(async (incident) => {
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
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (
      selectedItems.length > 0 &&
      window.confirm(
        `Yakin ingin menghapus ${selectedItems.length} data terpilih?`
      )
    ) {
      setWoData((prev) =>
        prev.filter((item) => !selectedItems.includes(item.incident))
      );
      setSelectedItems([]);
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
            API sudah benar. Silakan cek tab Console di Developer Tools (F12)
            untuk detail lebih lanjut.
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
                  disabled={!filter.workzone}
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
