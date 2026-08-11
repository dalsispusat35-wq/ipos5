# Package Tracking Database Architecture & Notes (iPOS5)

Dokumen ini menjelaskan struktur data, pemetaan entitas, skema collection, indeks database, dan aturan penanganan data untuk fitur **Package Tracking** dan **Daily Operation CSV Importer** pada proyek iPOS5.

---

## 1. PEMETAAN ENTITAS & COLLECTION (EXISTING vs SEEDED)

| Entitas Logistik | Collection MongoDB | Status | Keterangan |
|---|---|---|---|
| **Package / Transaksi** | `transaksi` | Existing | Menyimpan data resi (`connote_code`), pengirim, penerima, layanan, berat (`actual_weight`), status (`connote_state`), dan array `tracking_history`. |
| **Kantor Pos / Node** | `master_kantor` | Existing | Menyimpan data kantor pos (`nopend`, `nama_nopend`, `tipe`, `status`). |
| **Kendaraan / Armada** | `master_kendaraan` | Existing | Menyimpan data kendaraan (`nopol`, `jenis`, `kapasitas_kg`, `status`). |
| **Rute Statis (Header)** | `master_route` | Existing | Menyimpan definisi rute (`route_id`, `nama_route`, `asal_nopen`, `tujuan_nopen`). |
| **Waypoint / Stop Statis** | `detail_route` | Existing | Menyimpan urutan stop statis rute (`route_id`, `seq`, `asal_nopen`, `tujuan_nopen`, `jarak_km`, `estimasi_menit`). |
| **Daily Journey Operasional** | `route_journeys` | Existing | Menyimpan instans operasional rute harian (`journey_id`, `journey_date`, `vehicle_nopol`, `current_stop_seq`, `status`, `cargo`, `current_load_kg`). |
| **Tracking Event Logs** | `tracking_events` | New/Seeded | Menyimpan event riwayat scan/logistik individual (`event_id`, `connote_code`, `event_type`, `event_datetime`, `office_code`, `route_code`, `vehicle_code`, `stop_sequence`, `import_batch_id`). |

---

## 2. ATURAN HITUNG & LOGIKA OPERASIONAL (SINGLE SOURCE OF TRUTH)

### 2.1 Derived Vehicle Load (`current_load_kg`)
- `current_load_kg` dihitung ulang secara **derived** pada saat query/import berdasarkan penjumlahan berat paket aktif yang berada di dalam kendaraan (paket dengan event `LOADED` yang belum mengalami event `UNLOADED` / `DELIVERED`).
- `available_capacity_kg = max_capacity_kg - current_load_kg`.
- `utilization_pct = (current_load_kg / max_capacity_kg) * 100`.
- Status Kapasitas:
  - `< 70%`: `NORMAL` (Hijau/Emerald)
  - `70% – 90%`: `NEAR CAPACITY` (Kuning/Amber)
  - `90% – 100%`: `FULL` (Oranye)
  - `> 100%`: `OVER CAPACITY` (Merah/Danger)

### 2.2 Aturan `current_stop_seq` (Lokasi Kendaraan)
- **Sebelum ada event `ARRIVED` pertama**: `current_stop_seq = 1` (stop Origin).
- **Event `ARRIVED` atau `DELIVERED` di Stop $N$**: Mengubah `current_stop_seq = N`.
- **Event `LOADED` / `UNLOADED`**: Tidak menggeser sequence stop.
- **Event `IN_TRANSIT`**: `current_stop_seq = N` (berada di jalur menuju Stop $N+1$).
- Pemetaan status stop di UI:
  - `seq < current_stop_seq` $\rightarrow$ `COMPLETED`
  - `seq === current_stop_seq` $\rightarrow$ `CURRENT`
  - `seq > current_stop_seq` $\rightarrow$ `UPCOMING`

### 2.3 Idempotensi Event & Batch Tagging (`import_batch_id`)
- Kunci unik event tracking: `event_id = ${connote}_${event_type}_${event_datetime}_${office_code}`.
- Menggunakan MongoDB `upsert` pada `event_id` sehingga re-import CSV yang sama tidak duplikat.
- Setiap sesi import CSV menghasilkan `import_batch_id` unik (e.g. `BATCH-20260724-153045-8A2F`).
- Seluruh event dan data hasil import ditagging dengan `import_batch_id` untuk mendukung rollback/cleanup via API `DELETE /api/daily-operation/import-batch/:batchId`.

---

## 3. INDEKS DATABASE

```javascript
// tracking_events
{ event_id: 1 } // Unique
{ import_batch_id: 1 }
{ connote_code: 1, event_datetime: -1 }
{ route_code: 1, event_datetime: -1 }

// transaksi
{ connote_code: 1 }
{ 'connote.connote_code': 1 }
{ import_batch_id: 1 }

// route_journeys
{ journey_date: 1, vehicle_nopol: 1 }
{ journey_id: 1 }
```
