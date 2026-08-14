# DOKUMENTASI TEKNIS & OPERASIONAL HALAMAN
## HALAMAN 11 — GATE MONITORING (TRANSIT GATE TERMINAL HUB)

### 📌 METADATA & INTEGRASI SISTEM
| Parameter | Nilai / Spesifikasi |
| :--- | :--- |
| **Nama Modul** | Gate Monitoring Transit (/transit-monitoring) |
| **Kategori Menu** | LOGISTICS |
| **Route URL** | /transit-monitoring |
| **File Komponen React** | src/pages/GateMonitoring.jsx |
| **Backend API Endpoint** | GET /api/gate/status, POST /api/gate/scan-in, POST /api/gate/scan-out |
| **Koleksi MongoDB** | tracking_events, route_journeys, transaksi |
| **Hak Akses Role** | Operator & Super Admin |

---

## 1. Deskripsi & Tujuan Utama Modul

Modul Gate Monitoring mengawasi arus masuk (Scan In / Inbound) dan arus keluar (Scan Out / Outbound) armada logistik serta kantong pos di Pintu Gerbang Terminal Hub SPP / KCU.

## 2. Fitur-Fitur Utama & Komponen UI

### Terminal Gate Radar & Inbound/Outbound Stream
- Board Status Pintu Gerbang (Gate 1, Gate 2, Gate 3 - INBOUND / OUTBOUND / IDLE)
- Stream Feed Antrean Kendaraan Tiba di Terminal Hub SPP
- Form Quick Scan Barcode Kantong Pos / Resi
- Log Verifikasi Jumlah Kantong Dibongkar vs Jumlah Manifest

