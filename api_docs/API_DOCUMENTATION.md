# IPOS5 Logistics Control Tower — Master API Documentation

Dokumentasi resmi seluruh endpoint API backend sistem **IPOS5 Redesign (Cimahi Origin Delivery & Logistics Control Tower)**.

- **Base Path:** `/api`
- **Auth Type:** `Bearer <JWT_TOKEN>`
- **Global Overview & Standar Respon:** Lihat [`GLOBAL.md`](./GLOBAL.md)

---

## 📑 Daftar Seluruh Modul & Endpoint API

### 1. 🔐 Autentikasi & Akun Pengguna (`/api/auth`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Otentikasi login & generate JWT token | Public | [post-login.md](./endpoints/auth/post-login.md) |
| `GET` | `/api/auth/me` | Mengambil data sesi pengguna aktif | Authenticated | [get-me.md](./endpoints/auth/get-me.md) |
| `POST` | `/api/auth/logout` | Revoke & logout sesi pengguna | Authenticated | [post-logout.md](./endpoints/auth/post-logout.md) |

### 2. 📊 Dashboard & KPI Eksekutif (`/api/dashboard-stats`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard-stats` | Statistik KPI real-time, volume grafik & revenue | All Roles | [get-dashboard-stats.md](./endpoints/dashboard/get-dashboard-stats.md) |

### 3. 🔍 Package Tracking & Connote Checker (`/api/checker`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/checker/:code` | Tracking resi connote / plat nopol armada | All Roles | [get-checker.md](./endpoints/checker/get-checker.md) |
| `GET` | `/api/checker/events/:connote` | Riwayat timeline audit trail resi paket | All Roles | [get-connote-timeline.md](./endpoints/checker/get-connote-timeline.md) |

### 4. 🧾 Transaksi Kiriman & Invoices (`/api/transaksi`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/transaksi` | Daftar seluruh transaksi kiriman (paginated) | All Roles | [get-transaksi.md](./endpoints/transaksi/get-transaksi.md) |
| `GET` | `/api/transaksi/:id` | Detail spesifik transaksi kiriman connote | All Roles | [get-transaksi-id.md](./endpoints/transaksi/get-transaksi-id.md) |
| `POST` | `/api/transaksi` | Pembuatan data transaksi resi baru | Loket, Admin | [post-transaksi.md](./endpoints/transaksi/post-transaksi.md) |
| `POST` | `/api/transaksi/import-csv`| Import data transaksi massal format CSV | Super Admin | [post-import-csv.md](./endpoints/transaksi/post-import-csv.md) |

### 5. 🚚 Armada & Fleet Management (`/api/kendaraan`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/kendaraan` | Daftar armada aktif beserta beban muatan | Dispatcher, Admin | [get-kendaraan.md](./endpoints/fleet/get-kendaraan.md) |
| `GET` | `/api/kendaraan/:nopol/detail`| Profil cockpit armada, driver, & manifest | Dispatcher, Admin | [get-kendaraan-nopol.md](./endpoints/fleet/get-kendaraan-nopol.md) |
| `POST` | `/api/kendaraan` | Penambahan armada logistik baru | Super Admin | [post-kendaraan.md](./endpoints/fleet/post-kendaraan.md) |
| `PUT` | `/api/kendaraan/:id` | Update data armada & kapasitas tonase | Super Admin | [put-kendaraan-id.md](./endpoints/fleet/put-kendaraan-id.md) |
| `DELETE` | `/api/kendaraan/:id` | Nonaktifkan data armada logistik | Super Admin | [delete-kendaraan-id.md](./endpoints/fleet/delete-kendaraan-id.md) |

### 6. 🛡️ Gate & Inbound Transit Monitoring (`/api/gate`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/gate/pipeline` | Data kanban 3 checkpoint transit gate | Dispatcher, Admin | [get-pipeline.md](./endpoints/gate/get-pipeline.md) |
| `POST` | `/api/gate/manifest` | Checkpoint 1: Konsolidasi & Bagging Manifest | Dispatcher | [post-manifest.md](./endpoints/gate/post-manifest.md) |
| `POST` | `/api/gate/transit` | Checkpoint 2: Scan Inbound Transit SPP 40400 | Dispatcher | [post-transit.md](./endpoints/gate/post-transit.md) |
| `POST` | `/api/gate/deliver` | Checkpoint 3: Arrival & Konfirmasi POD Final | Dispatcher, Driver | [post-deliver.md](./endpoints/gate/post-deliver.md) |

### 7. 🏢 Master Kantor Pos & Nopend (`/api/master/kantor`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/master/kantor` | Direktori 13.000+ kantor pos (paginated) | All Roles | [get-kantor.md](./endpoints/offices/get-kantor.md) |
| `GET` | `/api/master/kantor/:nopend`| Detail profil kantor pos & koordinat GPS | All Roles | [get-kantor-nopend.md](./endpoints/offices/get-kantor-nopend.md) |
| `POST` | `/api/master/kantor` | Tambah data kantor pos / agenpos baru | Super Admin | [post-kantor.md](./endpoints/offices/post-kantor.md) |
| `PUT` | `/api/master/kantor/:id` | Update data alamat & koordinat kantor | Super Admin | [put-kantor-id.md](./endpoints/offices/put-kantor-id.md) |
| `DELETE` | `/api/master/kantor/:id` | Nonaktifkan status kantor pos | Super Admin | [delete-kantor-id.md](./endpoints/offices/delete-kantor-id.md) |

### 8. 🗺️ Master Rute & Koridor Logistik (`/api/master/routes`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/master/routes` | Daftar rute koridor pengiriman aktif | All Roles | [get-routes.md](./endpoints/routes/get-routes.md) |
| `GET` | `/api/master/routes/:id` | Rincian waypoint perhentian rute | All Roles | [get-routes-id.md](./endpoints/routes/get-routes-id.md) |
| `POST` | `/api/master/routes` | Pembuatan rute koridor logistik baru | Super Admin | [post-routes.md](./endpoints/routes/post-routes.md) |
| `GET` | `/api/master/detail-routes`| Detail sequence stop waypoints | All Roles | [get-detail-routes.md](./endpoints/routes/get-detail-routes.md) |

### 9. 📦 Master Produk Layanan POSIND (`/api/master/produk`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/master/produk` | Katalog produk pos (Sameday, Nextday, Jumbo)| All Roles | [get-produk.md](./endpoints/products/get-produk.md) |
| `POST` | `/api/master/produk` | Tambah produk layanan pos baru | Super Admin | [post-produk.md](./endpoints/products/post-produk.md) |
| `PUT` | `/api/master/produk/:id` | Toggle status aktifasi produk | Super Admin | [put-produk-id.md](./endpoints/products/put-produk-id.md) |

### 10. 📅 Jadwal Transportasi & Pickup Loket (`/api/jadwal`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/jadwal` | Kalender perjalanan armada bulanan | All Roles | [get-jadwal.md](./endpoints/schedules/get-jadwal.md) |
| `POST` | `/api/jadwal/generate` | Generator jadwal bulanan otomatis | Dispatcher, Admin | [post-generate-jadwal.md](./endpoints/schedules/post-generate-jadwal.md) |
| `GET` | `/api/pickup-schedules`| Jadwal penjemputan rutin loket agenpos | All Roles | [get-pickup-schedules.md](./endpoints/schedules/get-pickup-schedules.md) |
| `GET` | `/api/template-jadwal` | Template pola jadwal mingguan | All Roles | [get-templates.md](./endpoints/schedules/get-templates.md) |

### 11. ⏱️ Simulator Milk Run & Estimasi ETA (`/api/estimasi`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/estimasi/milkrun` | Simulator rute Milk Run & partition muatan | All Roles | [get-milkrun-simulation.md](./endpoints/estimasi/get-milkrun-simulation.md) |
| `POST` | `/api/estimasi/calculate-eta`| Hitung estimasi waktu tiba berbasis kecepatan | All Roles | [post-calculate-eta.md](./endpoints/estimasi/post-calculate-eta.md) |

### 12. 📈 Analitik & Laporan SLA Regional (`/api/analytics`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/report` | Data tren performa pengiriman & SLA | Dispatcher, Admin | [get-analytics-report.md](./endpoints/analytics/get-analytics-report.md) |
| `GET` | `/api/analytics/sla-compliance`| Persentase SLA On-Time per Regional | Dispatcher, Admin | [get-sla-compliance.md](./endpoints/analytics/get-sla-compliance.md) |

### 13. 🧭 MongoDB Compass GUI Internal (`/api/compass`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/compass/collections`| Daftar koleksi database & total dokumen | Super Admin | [get-collections.md](./endpoints/compass/get-collections.md) |
| `GET` | `/api/compass/collections/:name`| Query inspeksi dokumen JSON internal | Super Admin | [get-collection-data.md](./endpoints/compass/get-collection-data.md) |

### 14. ⚙️ Pengaturan Koneksi Sistem (`/api/settings`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/settings/connection`| Status konektivitas remote cluster MongoDB | Super Admin | [get-connection-status.md](./endpoints/settings/get-connection-status.md) |
| `POST` | `/api/settings/connection/switch`| Switch target URI koneksi MongoDB dinamis| Super Admin | [post-switch-connection.md](./endpoints/settings/post-switch-connection.md) |

### 15. 👤 Profil & Manajemen Pengguna (`/api/profile` & `/api/users`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Profil akun pengguna aktif | Authenticated | [get-profile.md](./endpoints/profile/get-profile.md) |
| `PUT` | `/api/profile` | Perbarui profil & kata sandi pengguna | Authenticated | [put-profile.md](./endpoints/profile/put-profile.md) |
| `GET` | `/api/users` | Daftar seluruh akun pengguna (CRUD) | Super Admin | [get-users.md](./endpoints/users/get-users.md) |
| `POST` | `/api/users` | Buat akun pengguna baru | Super Admin | [post-users.md](./endpoints/users/post-users.md) |
| `PUT` | `/api/users/:id` | Update role & status akun user | Super Admin | [put-users-id.md](./endpoints/users/put-users-id.md) |
| `DELETE` | `/api/users/:id` | Hapus akun pengguna | Super Admin | [delete-users-id.md](./endpoints/users/delete-users-id.md) |
| `GET` | `/api/users/activities` | Riwayat log audit aktivitas operasional | Super Admin | [get-user-activities.md](./endpoints/users/get-user-activities.md) |

### 16. 🔔 Notifikasi Sistem (`/api/notifications`)
| Method | Endpoint | Ringkasan Fungsi | Akses Role | Detail Doc |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications/alerts`| Ambil daftar alert kapasitas & sistem | All Roles | [get-alerts.md](./endpoints/notifications/get-alerts.md) |
| `POST` | `/api/notifications/alerts/:id/read`| Tandai alert telah dibaca | All Roles | [post-mark-read.md](./endpoints/notifications/post-mark-read.md) |
