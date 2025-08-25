// src/utils/woUtils.js

export const getFormatText = (item) => `STO : ${item.workzone || "-"}
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

export const getInitialVisibleKeys = (allKeys) => {
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