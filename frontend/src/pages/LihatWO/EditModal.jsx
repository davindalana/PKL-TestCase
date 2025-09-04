import React, { useState, useEffect, useMemo } from 'react';

export const EditModal = ({
    item,
    onClose,
    onSave,
    allSektorOptions,
    getSektorForWorkzone,
    getWorkzonesForSektor,
    getKorlapsForWorkzone
}) => {
    // State untuk menyimpan data form, diinisialisasi dengan data item
    const [editForm, setEditForm] = useState(item);

    // Efek ini memastikan form di-update jika item yang diedit berubah
    useEffect(() => {
        setEditForm(item);
    }, [item]);

    // Fungsi untuk menangani semua perubahan pada input form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => {
            let newState = { ...prev, [name]: value };

            // Jika 'workzone' berubah, update 'sektor' secara otomatis
            if (name === "workzone") {
                const newSektor = getSektorForWorkzone(value);
                newState.sektor = newSektor;
                newState.korlap = ""; // Reset korlap karena workzone berubah
            }

            // Jika 'sektor' berubah, reset 'workzone' dan 'korlap'
            if (name === "sektor") {
                newState.workzone = "";
                newState.korlap = "";
            }

            return newState;
        });
    };


    // Fungsi untuk mengirim data saat form di-submit
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(editForm);
    };

    // Memoized options untuk dropdown yang dependen
    const workzoneOptions = useMemo(
        () => (editForm?.sektor ? getWorkzonesForSektor(editForm.sektor) : []),
        [editForm?.sektor, getWorkzonesForSektor]
    );

    const korlapOptions = useMemo(
        () => (editForm?.workzone ? getKorlapsForWorkzone(editForm.workzone) : []),
        [editForm?.workzone, getKorlapsForWorkzone]
    );

    // Jangan render apapun jika tidak ada item
    if (!item) {
        return null;
    }

    return (
        <div className="format-modal" onClick={onClose}>
            <div className="format-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Incident: {item.incident}</h2>
                <form onSubmit={handleSubmit}>
                    {/* Incident (Read-only) */}
                    <div className="form-group">
                        <label>Incident:</label>
                        <input name="incident" value={editForm.incident || ""} onChange={handleChange} disabled />
                    </div>

                    {/* Sektor Dropdown */}
                    <div className="form-group">
                        <label>Sektor:</label>
                        <select name="sektor" value={editForm.sektor || ""} onChange={handleChange}>
                            <option value="">- Pilih Sektor -</option>
                            {allSektorOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Workzone Dropdown (Tergantung Sektor) */}
                    <div className="form-group">
                        <label>Workzone:</label>
                        <select name="workzone" value={editForm.workzone || ""} onChange={handleChange} disabled={!editForm.sektor}>
                            <option value="">- Pilih Workzone -</option>
                            {workzoneOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Korlap Dropdown (Tergantung Workzone) */}
                    <div className="form-group">
                        <label>Korlap:</label>
                        <select name="korlap" value={editForm.korlap || ""} onChange={handleChange} disabled={!editForm.workzone}>
                            <option value="">- Pilih Korlap -</option>
                            {korlapOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Tampilkan sisa field lainnya yang bisa diedit */}
                    {Object.keys(editForm).filter(key => 
                        !["incident", "sektor", "workzone", "korlap", "created_at", "updated_at"].includes(key)
                    ).map(key => (
                         <div key={key} className="form-group">
                            <label>{key.replace(/_/g, " ")}:</label>
                            <input name={key} value={editForm[key] || ""} onChange={handleChange} />
                        </div>
                    ))}
                    
                    {/* Tombol Aksi */}
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Simpan</button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};