import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { createPortal } from "react-dom";
import "./LihatWO.css";

const API_BASE_URL = "http://localhost:3000/api";

const sektorWorkzoneKorlapMap = [
  {
    sektor: "MLG 1",
    workzone: "BLB",
    korlaps: ["@nicosuryanata", "@hndika", "@triyuni75", "@Endrasakti"],
  },
  {
    sektor: "MLG 1",
    workzone: "KLJ",
    korlaps: ["@rolimartin", "@JackSpaarroww", "@firdausmulia", "@YantiMohadi"],
  },
  {
    sektor: "MLG 2",
    workzone: "SGS",
    korlaps: [
      "@iqbal_albana",
      "@merin97",
      "@RizkyAHermawan",
      "@Choliz87",
      "@agungspoetra",
    ],
  },
  {
    sektor: "MLG 2",
    workzone: "PKS",
    korlaps: [
      "@iqbal_albana",
      "@merin97",
      "@RizkyAHermawan",
      "@Choliz87",
      "@agungspoetra",
    ],
  },
  {
    sektor: "MLG 2",
    workzone: "LWG",
    korlaps: [
      "@iqbal_albana",
      "@merin97",
      "@RizkyAHermawan",
      "@Choliz87",
      "@agungspoetra",
    ],
  },
  {
    sektor: "MLG 2",
    workzone: "TMP",
    korlaps: [
      "@iqbal_albana",
      "@merin97",
      "@RizkyAHermawan",
      "@Choliz87",
      "@agungspoetra",
    ],
  },
  {
    sektor: "MLG 2",
    workzone: "SWJ",
    korlaps: [
      "@iqbal_albana",
      "@merin97",
      "@RizkyAHermawan",
      "@Choliz87",
      "@agungspoetra",
    ],
  },
  {
    sektor: "MLG 2",
    workzone: "BRG",
    korlaps: [
      "@iqbal_albana",
      "@merin97",
      "@RizkyAHermawan",
      "@Choliz87",
      "@agungspoetra",
    ],
  },
  {
    sektor: "MLG 3",
    workzone: "MLG",
    korlaps: ["@huliaihzlq", "@Rizkymaulana_06", "@Kikuch", "@anovitass"],
  },
  {
    sektor: "MLG 3",
    workzone: "GDG",
    korlaps: ["@azislutfi", "@anindya_putra", "@alibassss", "@bimalaksana90"],
  },
  {
    sektor: "MLG 3",
    workzone: "KEP",
    korlaps: ["@azislutfi", "@anindya_putra", "@alibassss", "@bimalaksana90"],
  },
  {
    sektor: "MLG 3",
    workzone: "SBP",
    korlaps: ["@azislutfi", "@anindya_putra", "@alibassss", "@bimalaksana90"],
  },
  {
    sektor: "MLG 3",
    workzone: "GKW",
    korlaps: ["@azislutfi", "@anindya_putra", "@alibassss", "@bimalaksana90"],
  },
  {
    sektor: "MLG 3",
    workzone: "DNO",
    korlaps: ["@azislutfi", "@anindya_putra", "@alibassss", "@bimalaksana90"],
  },
  {
    sektor: "MLG 3",
    workzone: "PGK",
    korlaps: ["@azislutfi", "@anindya_putra", "@alibassss", "@bimalaksana90"],
  },
  {
    sektor: "MLG 3",
    workzone: "TUR",
    korlaps: ["@mochammadmulya", "@Penjozasmara", "@ipunklutfy", "@Gotam27"],
  },
  {
    sektor: "MLG 3",
    workzone: "GDI",
    korlaps: ["@mochammadmulya", "@Penjozasmara", "@ipunklutfy", "@Gotam27"],
  },
  {
    sektor: "MLG 3",
    workzone: "BNR",
    korlaps: ["@mochammadmulya", "@Penjozasmara", "@ipunklutfy", "@Gotam27"],
  },
  {
    sektor: "MLG 3",
    workzone: "DPT",
    korlaps: ["@mochammadmulya", "@Penjozasmara", "@ipunklutfy", "@Gotam27"],
  },
  {
    sektor: "MLG 3",
    workzone: "SBM",
    korlaps: ["@mochammadmulya", "@Penjozasmara", "@ipunklutfy", "@Gotam27"],
  },
  {
    sektor: "MLG 3",
    workzone: "APG",
    korlaps: ["@mochammadmulya", "@Penjozasmara", "@ipunklutfy", "@Gotam27"],
  },
  {
    sektor: "MLG 4",
    workzone: "BTU",
    korlaps: ["@arishere", "@Flyco", "@aanksueb", "@diditdwif", "@athunk05"],
  },
  {
    sektor: "MLG 4",
    workzone: "NTG",
    korlaps: ["@arishere", "@Flyco", "@aanksueb", "@diditdwif", "@athunk05"],
  },
  {
    sektor: "MLG 4",
    workzone: "KPO",
    korlaps: ["@arishere", "@Flyco", "@aanksueb", "@diditdwif", "@athunk05"],
  },
];

const getSektorOptions = () =>
  [...new Set(sektorWorkzoneKorlapMap.map((item) => item.sektor))].sort();

const getWorkzonesForSektor = (sektor) =>
  !sektor
    ? []
    : [
        ...new Set(
          sektorWorkzoneKorlapMap
            .filter((m) => m.sektor === sektor)
            .map((m) => m.workzone)
        ),
      ];

const getKorlapsForWorkzone = (workzone) =>
  sektorWorkzoneKorlapMap.find((m) => m.workzone === workzone)?.korlaps || [];

const getSektorForWorkzone = (workzone) =>
  sektorWorkzoneKorlapMap.find((m) => m.workzone === workzone)?.sektor || "";

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
    onUpdate,
    updatingStatus,
    onEdit,
    onDelete,
    onFormat,
    onCopy,
    allSektorOptions,
    statusOptions,
  }) => {
    const effectiveSektor = item.sektor || getSektorForWorkzone(item.workzone);

    const handleDropdownChange = (key, value) => {
      let updatedFields = { [key]: value };
      if (key === "sektor") {
        updatedFields = { sektor: value, workzone: "", korlap: "" };
      }
      if (key === "workzone") {
        const newSektor = getSektorForWorkzone(value);
        updatedFields = { workzone: value, sektor: newSektor, korlap: "" };
      }
      onUpdate(item.incident, updatedFields);
    };

    const workzoneRowOptions = useMemo(() => {
      const options = getWorkzonesForSektor(effectiveSektor);
      if (item.workzone && !options.includes(item.workzone)) {
        options.unshift(item.workzone);
      }
      return options;
    }, [effectiveSektor, item.workzone]);

    const korlapRowOptions = useMemo(() => {
      const options = getKorlapsForWorkzone(item.workzone);
      if (item.korlap && !options.includes(item.korlap)) {
        options.unshift(item.korlap);
      }
      return options;
    }, [item.workzone, item.korlap]);

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

const EditModal = ({ item, onClose, onSave, allSektorOptions }) => {
  const [editForm, setEditForm] = useState({ ...item });

  useEffect(() => {
    if (!editForm.sektor && editForm.workzone) {
      setEditForm((prev) => ({
        ...prev,
        sektor: getSektorForWorkzone(prev.workzone),
      }));
    }
  }, [editForm.workzone, editForm.sektor]);

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
    [editForm.sektor]
  );
  const korlapOptions = useMemo(
    () => getKorlapsForWorkzone(editForm.workzone),
    [editForm.workzone]
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
      try {
        const response = await fetch(`${API_BASE_URL}/view-mysql`);
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
        console.error("Gagal mengambil data:", error);
        setWoData([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

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
    const allSektors = getSektorOptions();
    const availableWorkzones = filter.sektor
      ? getWorkzonesForSektor(filter.sektor)
      : [...new Set(sektorWorkzoneKorlapMap.map((i) => i.workzone))];
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
  }, [woData, filter.sektor, filter.workzone]);

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
  }, [debouncedSearchTerm, woData, filter, visibleKeys, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedData.length]);

  const requestSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (field, value) => {
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
  };

  const handleUpdateRow = useCallback(
    async (incidentId, updatedFields) => {
      const fieldKeys = Object.keys(updatedFields);
      const updatingKeys = fieldKeys.reduce((acc, key) => {
        acc[incidentId + key] = true;
        return acc;
      }, {});
      setUpdatingStatus((p) => ({ ...p, ...updatingKeys }));
      try {
        const currentItem = woData.find((d) => d.incident === incidentId);
        await fetch(`${API_BASE_URL}/work-orders/${incidentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...currentItem, ...updatedFields }),
        });
        setWoData((prev) =>
          prev.map((d) =>
            d.incident === incidentId ? { ...d, ...updatedFields } : d
          )
        );
      } catch (error) {
        console.error("Gagal update data:", error);
        alert("Gagal memperbarui data.");
      } finally {
        const finalUpdatingKeys = fieldKeys.reduce((acc, key) => {
          acc[incidentId + key] = false;
          return acc;
        }, {});
        setUpdatingStatus((p) => ({ ...p, ...finalUpdatingKeys }));
      }
    },
    [woData]
  );

  const handleEditSave = async (updatedItem) => {
    try {
      await fetch(`${API_BASE_URL}/work-orders/${editItem.incident}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      setWoData((prev) =>
        prev.map((d) => (d.incident === editItem.incident ? updatedItem : d))
      );
      setEditItem(null);
    } catch {
      alert("Gagal update data");
    }
  };

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

  const handleBulkDelete = () => {
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
  };

  const handleCopy = async (item) => {
    try {
      await navigator.clipboard.writeText(getFormatText(item));
      alert("Format berhasil disalin!");
    } catch (err) {
      console.error("Gagal menyalin teks:", err);
    }
  };

  const handleSelectAll = (e) => {
    const currentPageIds = getCurrentPageData().map((item) => item.incident);
    if (e.target.checked) {
      setSelectedItems((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      setSelectedItems((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  };

  const dataToShow = getCurrentPageData();
  const isAllOnPageSelected =
    dataToShow.length > 0 &&
    dataToShow.every((item) => selectedItems.includes(item.incident));

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
                  onSelect={(id) =>
                    setSelectedItems((prev) =>
                      prev.includes(id)
                        ? prev.filter((i) => i !== id)
                        : [...prev, id]
                    )
                  }
                  onUpdate={handleUpdateRow}
                  updatingStatus={updatingStatus}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                  onFormat={setFormatIncident}
                  onCopy={handleCopy}
                  allSektorOptions={sektorOptions}
                  statusOptions={statusOptions}
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
        />
      )}
    </div>
  );
};

export default LihatWO;
