// src/pages/LihatWO/WorkOrderRow.jsx
import React, { memo, useMemo } from 'react';
import CustomDropdown from '../../components/CustomDropdown';

export const WorkOrderRow = memo(({
    item, allKeys, visibleKeys, isSelected, onSelect, onUpdate,
    updatingStatus, onEdit, onDelete, onFormat, onCopy, onComplete,
    allSektorOptions, statusOptions, getSektorForWorkzone,
    getWorkzonesForSektor, getKorlapsForWorkzone
}) => {
    // ... (kode dari WorkOrderRow di file asli Anda)
    // Salin dan tempel seluruh kode komponen WorkOrderRow di sini
    const handleDropdownChange = (key, value) => {
      let updatedFields = { [key]: value };

      if (key === "sektor") {
        updatedFields = { sektor: value, workzone: null, korlap: null };
      } else if (key === "workzone") {
        const newSektor = getSektorForWorkzone(value);
        updatedFields = { workzone: value, korlap: null, sektor: newSektor };
      } else if (key === "korlap") {
        updatedFields = {
          korlap: value,
          workzone: item.workzone,
          sektor: item.sektor,
        };
      }

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
          <button onClick={() => onFormat(item)} className="btn aksi-btn btn-secondary">Format</button>
          <button onClick={() => onCopy(item)} className="btn aksi-btn btn-info">Salin</button>
          <button onClick={() => onEdit(item)} className="btn aksi-btn btn-warning">Edit</button>
          <button onClick={() => onDelete(item.incident)} className="btn aksi-btn btn-danger">Hapus</button>
          <button onClick={() => onComplete(item.incident)} className="btn aksi-btn btn-success">Selesai</button>
        </td>
        {allKeys
          .filter((key) => visibleKeys.has(key))
          .map((key) => {
            const isUpdating = updatingStatus[item.incident];
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
            return (
              <td key={key} className="data-cell truncate" title={item[key]}>
                {String(item[key] ?? "")}
              </td>
            );
          })}
      </tr>
    );
});