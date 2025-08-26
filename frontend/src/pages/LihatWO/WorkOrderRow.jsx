// src/pages/LihatWO/WorkOrderRow.jsx
<<<<<<< HEAD
import React, { memo, useMemo } from "react";
import CustomDropdown from "../../components/CustomDropdown";

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
    allSektorOptions,
    statusOptions,
    getWorkzonesForSektor,
    getKorlapsForWorkzone,
  }) => {
    const handleDropdownChange = (key, value) => {
      // Siapkan data perubahan
      const updatedFields = { [key]: value };

      // Logika reset dropdown dependen
      if (key === "sektor") {
        updatedFields.workzone = null;
        updatedFields.korlap = null;
      } else if (key === "workzone") {
        updatedFields.korlap = null;
      }

      // Panggil fungsi onUpdate dengan data item asli dan field yang sudah diubah.
      onUpdate(item, updatedFields);
    };

    const workzoneRowOptions = useMemo(
      () => getWorkzonesForSektor(item.sektor),
      [item.sektor, getWorkzonesForSektor]
    );

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
          <button
            onClick={() => onComplete(item.incident)}
            className="btn aksi-btn btn-success"
          >
            Selesai
          </button>
        </td>
        {allKeys
          .filter((key) => visibleKeys.has(key))
          .map((key) => {
            const isUpdating = updatingStatus[item.incident];

            // Render dropdown untuk kolom interaktif
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
                    value={item.sektor}
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
                    disabled={!item.sektor || isUpdating}
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
            // Render sel data biasa
=======
import React, { memo, useMemo } from 'react';
import CustomDropdown from '../../components/CustomDropdown';
import ActionDropdown from '../../components/ActionDropdown';
import { formatReadableDate } from '../../utils/dateFormatter';

const dateColumns = new Set([
  'reported_date',
  'status_date',
  'resolve_date',
  'date_modified',
  'booking_date',
  'last_update_worklog'
]);

export const WorkOrderRow = memo(({
  item, allKeys, visibleKeys, isSelected, onSelect, onUpdate,
  updatingStatus, onEdit, onDelete, onFormat, onCopy, onComplete,
  allSektorOptions, statusOptions,
  getWorkzonesForSektor, getKorlapsForWorkzone
}) => {

  const handleDropdownChange = (key, value) => {

    // Siapkan data perubahan
    const updatedFields = { [key]: value };

    // **LOGIKA KUNCI ADA DI SINI**
    // Jika pengguna mengubah Sektor, kita harus mereset Workzone dan Korlap
    // agar pengguna memilih ulang sesuai urutan.
    if (key === "sektor") {
      updatedFields.workzone = null; // Kosongkan workzone
      updatedFields.korlap = null;   // Kosongkan korlap
    }
    // Jika pengguna mengubah Workzone, hanya Korlap yang direset.
    else if (key === "workzone") {
      updatedFields.korlap = null;   // Kosongkan korlap
    }
    console.log("1. [WorkOrderRow] Perubahan terdeteksi:", updatedFields);


    // Panggil fungsi onUpdate dengan data item asli dan field yang sudah diubah.
    // Fungsi onUpdate di file index.jsx akan mengirim ini ke backend untuk disimpan.
    onUpdate(item, updatedFields);
  };

  const workzoneRowOptions = useMemo(
    () => getWorkzonesForSektor(item.sektor),
    [item.sektor, getWorkzonesForSektor]
  );

  const korlapRowOptions = useMemo(
    () => getKorlapsForWorkzone(item.workzone),
    [item.workzone, getKorlapsForWorkzone]
  );

  // Bagian return JSX tidak perlu diubah sama sekali.
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
          if (key === "status") {
>>>>>>> 7951dd8948f766b364f3814008ff4ecc62b4e668
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
<<<<<<< HEAD
          })}
      </tr>
    );
  }
);
=======
          }
          if (key === "sektor") {
            return (
              <td key={key} className="interactive-cell">
                <CustomDropdown
                  options={allSektorOptions}
                  value={item.sektor}
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
                  disabled={!item.sektor || isUpdating}
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

          // Pakai Formater untuk kolom tanggal
          const cellValue = dateColumns.has(key)
            ? formatReadableDate(item[key])
            : String(item[key] ?? "");
          return (
            <td key={key} className="data-cell truncate" title={cellValue}>
              {cellValue}
            </td>
          );

          // Misal Gk pakai Formater 
          // return (
          //   <td key={key} className="data-cell truncate" title={item[key]}>
          //     {String(item[key] ?? "")}
          //   </td>
          // );

        })}
    </tr>
  );
});
>>>>>>> 7951dd8948f766b364f3814008ff4ecc62b4e668
