// Lokasi: frontend/src/pages/LihatWO/WorkOrderRow.jsx

import React, { memo, useMemo } from "react";
import CustomDropdown from "../../components/CustomDropdown";
import ActionDropdown from "../../components/ActionDropdown";
import { formatReadableDate } from "../../utils/dateFormatter";
import TTRCalculator from "../../components/TTRCalculator";

const dateColumns = new Set([
  "reported_date",
  "status_date",
  "resolve_date",
  "date_modified",
  "booking_date",
  "last_update_worklog",
]);

const ttrColumns = new Set([
  "ttr_customer",
  "ttr_agent",
  "ttr_mitra",
  "ttr_nasional",
  "ttr_end_to_end",
]);

export const WorkOrderRow = memo(
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
    onComplete,
    statusOptions,
    allWorkzoneOptions, // Prop baru untuk semua pilihan workzone
    getKorlapsForWorkzone,
  }) => {
    // Logika update disederhanakan. Komponen induk akan menangani logika bisnis.
    const handleDropdownChange = (key, value) => {
      const updatedFields = { [key]: value };

      // Saat workzone berubah, kosongkan korlap untuk pemilihan ulang.
      // Komponen induk akan menambahkan 'sektor' secara otomatis.
      if (key === "workzone") {
        updatedFields.korlap = null;
      }
      onUpdate(item, updatedFields);
    };

    // Memo-isasi untuk pilihan korlap tetap digunakan, ini sudah benar.
    const korlapRowOptions = useMemo(
      () => getKorlapsForWorkzone(item.workzone),
      [item.workzone, getKorlapsForWorkzone]
    );

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
          <ActionDropdown
            item={item}
            onFormat={onFormat}
            onCopy={onCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
          />
        </td>
        {allKeys
          .filter((key) => visibleKeys.has(key))
          .map((key) => {
            const isUpdating = updatingStatus[item.incident];

            if (ttrColumns.has(key)) {
              return (
                <td key={key} className="data-cell">
                  <TTRCalculator
                    reportedDate={item.reported_date}
                    ttrValue={item[key]}
                  />
                </td>
              );
            }

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

            // 'Sektor' sekarang hanya menampilkan teks, tidak bisa diubah langsung.
            if (key === "sektor") {
              const cellValue = String(item[key] ?? "");
              return (
                <td key={key} className="data-cell" title={cellValue}>
                  {cellValue}
                </td>
              );
            }

            // 'Workzone' menjadi dropdown utama yang memicu perubahan.
            if (key === "workzone") {
              return (
                <td key={key} className="interactive-cell">
                  <CustomDropdown
                    options={allWorkzoneOptions} // Menggunakan semua pilihan workzone
                    value={item.workzone}
                    onChange={(v) => handleDropdownChange("workzone", v)}
                    disabled={isUpdating} // Tidak lagi bergantung pada sektor
                    placeholder="- Pilih Workzone -"
                  />
                  {isUpdating && "⏳"}
                </td>
              );
            }

            // 'Korlap' akan ter-filter berdasarkan 'Workzone'.
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

            const cellValue = dateColumns.has(key)
              ? formatReadableDate(item[key])
              : String(item[key] ?? "");
            return (
              <td key={key} className="data-cell truncate" title={cellValue}>
                {cellValue}
              </td>
            );
          })}
      </tr>
    );
  }
);