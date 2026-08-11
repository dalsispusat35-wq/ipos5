# 🎨 IPOS5 Redesign - Frontend Client (React + Vite)

Single Page Application (SPA) berbasis React 18 dan Vite untuk **Cimahi Origin Delivery System (IPOS5 Redesign)**.

## 🚀 Cara Menjalankan

```bash
# Inisialisasi dependensi
npm install

# Menjalankan Server Pengembang (Dev Server)
npm run dev
```

Aplikasi web dapat diakses melalui browser pada `http://localhost:5173`.

## 📦 Stack & Fitur Utama

- **Framework:** React 18 & Vite
- **Router:** React Router DOM v6
- **Icon Library:** Lucide React
- **Theme:** Navy Premium Glassmorphism Design Token
- **Halaman Utama (16 Modul):**
  1. `Dashboard` (`/`) - Real-time statistics & status breakdown
  2. `Transaksi` (`/transaksi`) - Data transaksi resi & multi-filter
  3. `Checker` (`/checker`) - Tracking connote & timeline audit trail
  4. `MasterKantor` (`/kantor`) - Master data kantor pos (nopend)
  5. `MasterProduk` (`/produk`) - Master layanan produk pos
  6. `MasterKendaraan` (`/kendaraan`) - Master armada transportasi
  7. `MasterRoute` (`/route`) - Master rute logistik & autocomplete
  8. `JadwalPickup` (`/jadwal-pickup`) - Jadwal pickup SPP Bandung & KCU Cimahi
  9. `TemplateJadwal` (`/template`) - Template jadwal transportasi mingguan
  10. `JadwalTransportasi` (`/jadwal`) - Generasi jadwal transportasi bulanan
  11. `RouteJourney` (`/route-journey`) - Telemetri Milk Run & capacity load
  12. `EstimasiMilkRun` (`/estimasi`) - Simulator optimasi Milk Run
  13. `GateMonitoring` (`/transit-monitoring`) - Checkpoint 1, 2, & 3 gate monitoring
  14. `Compass` (`/compass`) - Internal MongoDB Compass Viewer
  15. `Settings` (`/settings`) - Profiler koneksi database
  16. `Profile` (`/profile`) - Profil operator & log aktivitas pengguna

