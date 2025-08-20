import { useState } from "react";
import "./InputWO.css";

const InputWO = () => {
  const [excelData, setExcelData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [jsonPreview, setJsonPreview] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!excelData.trim()) {
      setMessage("⚠️ Silakan paste data Excel terlebih dahulu!");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Kirim ke backend MySQL

      // Parse TSV to array of object
      // Kolom yang diizinkan (harus sama dengan field di MySQL)
      const allowedFields = [
        "incident",
        "ttr_customer",
        "summary",
        "reported_date",
        "owner_group",
        "owner",
        "customer_segment",
        "service_type",
        "witel",
        "workzone",
        "status",
        "status_date",
        "ticket_id_gamas",
        "reported_by",
        "contact_phone",
        "contact_name",
        "contact_email",
        "booking_date",
        "description_assignment",
        "reported_priority",
        "source_ticket",
        "subsidiary",
        "external_ticket_id",
        "channel",
        "customer_type",
        "closed_by",
        "closed_reopen_by",
        "customer_id",
        "customer_name",
        "service_id",
        "service_no",
        "slg",
        "technology",
        "lapul",
        "gaul",
        "onu_rx",
        "pending_reason",
        "date_modified",
        "incident_domain",
        "region",
        "symptom",
        "hierarchy_path",
        "solution",
        "description_actual_solution",
        "kode_produk",
        "perangkat",
        "technician",
        "device_name",
        "worklog_summary",
        "last_update_worklog",
        "classification_flag",
        "realm",
        "related_to_gamas",
        "tsc_result",
        "scc_result",
        "ttr_agent",
        "ttr_mitra",
        "ttr_nasional",
        "ttr_pending",
        "ttr_region",
        "ttr_witel",
        "ttr_end_to_end",
        "note",
        "guarantee_status",
        "resolve_date",
        "sn_ont",
        "tipe_ont",
        "manufacture_ont",
        "impacted_site",
        "cause",
        "resolution",
        "notes_eskalasi",
        "rk_information",
        "external_ticket_tier_3",
        "customer_category",
        "classification_path",
        "territory_near_end",
        "territory_far_end",
        "urgency",
        "alamat",
      ];

      // Kolom bertipe DATETIME (harus valid date atau null)
      const datetimeFields = [
        "reported_date",
        "status_date",
        "booking_date",
        "date_modified",
        "last_update_worklog",
        "resolve_date",
      ];

      // Fungsi validasi date (YYYY-MM-DD atau YYYY-MM-DD HH:mm:ss)
      const isValidDate = (val) => {
        if (!val) return false;
        // Cek format date
        return /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(val.trim());
      };

      const parseTSV = (tsv) => {
        const lines = tsv.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        // Normalisasi header: lowercase, spasi/garis miring jadi underscore, hapus karakter aneh
        const headers = lines[0].split("\t").map((h) =>
          h
            .trim()
            .toLowerCase()
            .replace(/\s+|\//g, "_")
            .replace(/[^a-z0-9_]/g, "")
        );
        return lines.slice(1).map((line) => {
          const values = line.split("\t");
          const obj = {};
          headers.forEach((h, i) => {
            if (allowedFields.includes(h)) {
              let v = values[i] !== undefined ? values[i] : "";
              if (datetimeFields.includes(h)) {
                obj[h] = isValidDate(v) ? v : null;
              } else {
                obj[h] = v;
              }
            }
          });
          return obj;
        });
      };

      const parsedData = parseTSV(excelData);
      setJsonPreview(parsedData);
      if (!parsedData.length)
        throw new Error("Format data tidak valid atau kosong!");

      // Ganti endpoint ke backend BMYSQLaPOSTG
      const response = await fetch("http://localhost:3000/api/mypost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData),
      });

      if (response.ok) {
        setMessage("✅ Data berhasil disimpan ke database!");
        setExcelData("");
        setJsonPreview([]);
      } else {
        // Coba ambil pesan error dari backend
        let errMsg = "Gagal menyimpan data";
        try {
          const err = await response.json();
          if (err && err.message) errMsg = err.message;
        } catch {}
        throw new Error(errMsg);
      }
    } catch (error) {
      setMessage("❌ Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setExcelData("");
    setMessage("");
    setJsonPreview([]);
  };

  const sampleData = `Aksi\tINCIDENT\tTTR CUSTOMER\tSUMMARY\tREPORTED DATE\tOWNER GROUP\tOWNER\tCUSTOMER SEGMENT\tSERVICE TYPE\tWITEL\tWORKZONE\tSTATUS\tSTATUS DATE\tTICKET ID GAMAS\tREPORTED BY\tCONTACT PHONE\tCONTACT NAME\tCONTACT EMAIL\tBOOKING DATE\tDESCRIPTION ASSIGMENT\tREPORTED PRIORITY\tSOURCE TICKET\tSUBSIDIARY\tEXTERNAL TICKET ID\tCHANNEL\tCUSTOMER TYPE\tCLOSED BY\tCLOSED / REOPEN by\tCUSTOMER ID\tCUSTOMER NAME\tSERVICE ID\tSERVICE NO\tSLG\tTECHNOLOGY\tLAPUL\tGAUL\tONU RX\tPENDING REASON\tDATEMODIFIED\tINCIDENT DOMAIN\tREGION\tSYMPTOM\tHIERARCHY PATH\tSOLUTION\tDESCRIPTION ACTUAL SOLUTION\tKODE PRODUK\tPERANGKAT\tTECHNICIAN\tDEVICE NAME\tWORKLOG SUMMARY\tLAST UPDATE WORKLOG\tCLASSIFICATION FLAG\tREALM\tRELATED TO GAMAS\tTSC RESULT\tSCC RESULT\tTTR AGENT\tTTR MITRA\tTTR NASIONAL\tTTR PENDING\tTTR REGION\tTTR WITEL\tTTR END TO END\tNOTE\tGUARANTE STATUS\tRESOLVE DATE\tSN ONT\tTIPE ONT\tMANUFACTURE ONT\tIMPACTED SITE\tCAUSE\tRESOLUTION\tNOTES ESKALASI\tRK INFORMATION\tEXTERNAL TICKET TIER 3\tCUSTOMER CATEGORY\tCLASSIFICATION PATH\tTERITORY NEAR END\tTERITORY FAR END\tURGENCY\tURGENCY DESCRIPTION
Format Hapus\tINC38587292\t01:56:01\tWAJIB DIISI MSISDN CONTACT PELANGGAN 085852387143\t2025-08-12 17:42:15\tTIF HD DISTRICT MALANG\t\tPL-TSEL\tINTERNET\tMALANG\tBTU\tBACKEND\t2025-08-12 17:42:20\t\t23255804\t6285852387143\tIKA\t\t\tAssigned By STO\t\tCUSTOMER\t\t\t1-NOL1KRM\t21\tREGULER\t\t\t\t1-MOUEVP2\tIKA\t1-MOUEVP2_152707234425_INTERNET\t152707234425\t\tFiber\t0\t0\t-504\t\t2025-08-12 19:38:21\t\tREG-5\tINTERNET | TECHNICAL | Tidak Bisa Browsing - 2P / 3P Mati Total\t\t\t\t\t\t16830458\tODP-BTU-FX/08 FX/D01/08.01\t\t\tTECHNICAL\ttelkom.net\tNO\tN/A | N/A\t\t00:00:00\t00:00:00\t01:56:01\t00:00:00\t01:56:01\t01:56:01\t01:56:01\t\tNOT GUARANTEE\t\tZTEGD826190E\tZTEG-F672Y\t\t\t\t\t\tODC-BTU-FX ODC-BTU-FX\tINC000015453134\t\tA_INTERNET_001_001_002\t\t\t3-Medium\t
Format Hapus\tINC38587293\t02:15:30\tGangguan pada layanan internet fiber\t2025-08-12 18:30:45\tTIF HD DISTRICT MALANG\t\tPL-TSEL\tINTERNET\tMALANG\tMLG\tCLOSED\t2025-08-12 20:45:12\t\t23255805\t6285852387144\tBUDI\t\t\tResolved\t\tCUSTOMER\t\t\t1-NOL1KRN\t22\tREGULER\t\t\t\t1-MOUEVP3\tBUDI\t1-MOUEVP3_152707234426_INTERNET\t152707234426\t\tFiber\t0\t0\t-480\t\t2025-08-12 20:45:12\t\tREG-5\tINTERNET | TECHNICAL | Slow Browsing\t\t\t\t\t\t16830459\tODP-MLG-FX/09 FX/D02/09.02\t\t\tTECHNICAL\ttelkom.net\tYES\tResolved\t\t00:15:20\t00:00:00\t02:15:30\t00:00:00\t02:15:30\t02:15:30\t02:15:30\t\tGUARANTEE\t2025-08-12 20:45:12\tZTEGD826191F\tZTEG-F672Y\t\t\t\t\t\tODC-MLG-FX ODC-MLG-FX\tINC000015453135\t\tA_INTERNET_001_001_003\t\t\t2-High\t`;

  const handleSampleData = () => {
    setExcelData(sampleData);
    setMessage("📋 Sample data telah dimuat");
  };

  return (
    <div className="input-wo-container">
      <div className="page-header">
        <h1>📝 Input Incident Data</h1>
        <p>
          Paste data incident dari Excel (format tab-separated) dan simpan ke
          database MySQL
        </p>
      </div>

      <div className="input-form-card">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="excelData" className="form-label">
              Data Incident Excel (Tab Separated Values)
            </label>
            <div className="textarea-container">
              <textarea
                id="excelData"
                value={excelData}
                onChange={(e) => setExcelData(e.target.value)}
                placeholder="Paste data Excel di sini...
Contoh format incident management:
Aksi	INCIDENT	TTR CUSTOMER	SUMMARY	REPORTED DATE	OWNER GROUP	WITEL	WORKZONE	STATUS	...
Format Hapus	INC38587292	01:56:01	WAJIB DIISI MSISDN CONTACT	2025-08-12 17:42:15	TIF HD DISTRICT MALANG	MALANG	BTU	BACKEND	..."
                className="excel-textarea"
                rows={12}
              />
            </div>
            <div className="textarea-info">
              <span>
                💡 Tips: Copy data dari Excel dan paste di sini (Ctrl+V)
              </span>
            </div>
          </div>

          <div className="button-group">
            <button
              type="button"
              onClick={handleSampleData}
              className="btn btn-secondary"
            >
              📋 Load Sample Data
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-outline"
              disabled={!excelData}
            >
              🗑️ Clear
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !excelData.trim()}
            >
              {isLoading ? "⏳ Menyimpan..." : "💾 Simpan ke Database"}
            </button>
          </div>
        </form>

        {message && (
          <div
            className={`message ${
              message.includes("✅")
                ? "success"
                : message.includes("❌")
                ? "error"
                : "info"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Preview JSON hasil parsing TSV */}
      {jsonPreview && jsonPreview.length > 0 && (
        <div className="json-preview-panel">
          <h3>Preview JSON (otomatis dari data TSV):</h3>
          <pre
            style={{
              maxHeight: 300,
              overflow: "auto",
              background: "#f6f8fa",
              fontSize: 13,
              border: "1px solid #eee",
              padding: 10,
            }}
          >
            {JSON.stringify(jsonPreview, null, 2)}
          </pre>
        </div>
      )}
      <div className="info-panel">
        <h3>ℹ️ Informasi</h3>
        <ul>
          <li>
            Data akan disimpan ke database <strong>MySQL</strong>
          </li>
          <li>Format yang didukung: Tab-separated values (TSV)</li>
          <li>Baris pertama harus berisi header kolom incident</li>
          <li>Setiap baris data dipisahkan dengan enter</li>
          <li>Setiap kolom dipisahkan dengan tab</li>
          <li>Data incident mencakup: Aksi, INCIDENT, TTR, SUMMARY, dll.</li>
        </ul>
      </div>
    </div>
  );
};

export default InputWO;
