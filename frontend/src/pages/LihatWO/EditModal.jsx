// src/pages/LihatWO/EditModal.jsx
import React, { useState, useEffect, useMemo } from "react";

export const EditModal = ({
  item,
  onClose,
  onSave,
  allSektorOptions,
  getWorkzonesForSektor,
  getKorlapsForWorkzone,
}) => {
  const [editForm, setEditForm] = useState({ ...item });

  // Efek ini tidak lagi diperlukan jika API edit sudah mengembalikan data lengkap.
  // Namun, bisa dipertahankan untuk pengalaman pengguna yang lebih baik di dalam modal.
  // useEffect(() => {
  //   if (!editForm.sektor && editForm.workzone) {
  //     setEditForm((prev) => ({
  //       ...prev,
  //       sektor: getSektorForWorkzone(prev.workzone),
  //     }));
  //   }
  // }, [editForm.workzone, editForm.sektor, getSektorForWorkzone]);

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
