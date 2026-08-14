# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 9 — MILK RUN TELEMETRY & EXECUTION

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Milk Run Telemetry & Execution (/route-journey) |
| **Kategori Menu** | LOGISTICS |
| **Route URL** | /route-journey |
| **File Komponen React** | src/pages/RouteJourney.jsx |
| **Backend API Endpoint** | GET /api/route-journeys/active, POST /api/route-journeys/start, POST /api/route-journeys/:journeyId/process-stop/:seq |
| **Koleksi MongoDB** | route_journeys, detail_route, transaksi, master_kantor |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Milk Run Telemetry merupakan jantung dari eksekusi perjalanan armada multi-stop. Modul ini menangani simulasi dan eksekusi ACID transaction penambahan/penurunan muatan di setiap perhentian kantor pos (Stop 1 sampai Stop N) secara real-time dengan proteksi Idempotency Key.

## 2. Fitur-Fitur Utama & Komponen UI

### Visual Execution Panel & ACID Control
- Stepper Progress Waypoint Aktif (Origin -> Waypoint Transit -> Destination Final)
- Panel Input Scan / Load Paket per Stop Perhentian
- Gauge Kapasitas Kendaraan Real-Time (% Muatan & Kg Sisa)
- Tombol Eksekusi 'Proses Stop' dengan ACID Transaction MongoDB
- Proteksi Header Idempotency Key (Mencegah pemrosesan ganda saat gangguan koneksi)

