# Master wilayah MongoDB untuk `/kantor`

Source asli dibaca saja: `wilayah-master/db/wilayah.sql` (kode/nama 4 tingkat) dan `wilayah_level_1_2.sql` (koordinat/polygon provinsi dan kabupaten/kota). Lisensi sumber cahya dsn disertakan pada `LICENSE`.

Dari direktori `redesign/server`:

```powershell
python scripts/buildKantorWilayah.py
node scripts/importKantorWilayah.js
```

Generator menghasilkan JSON perantara dari SQL. Importer memakai profil pertama pada `config/connections.json`; variabel `KANTOR_WILAYAH_CONNECTION_ID` dapat memilih profil tertentu. Import memakai upsert berdasarkan kode, sehingga aman dijalankan ulang dan tidak menulis ke `master_kantor`.

Koleksi hasil:

- `master_wilayah`: `_id`/`kode`, `nama`, `level`, `parent`, `ancestors`, `source`. Indeks unik kode, parent/nama, dan level.
- `master_wilayah_geometry`: kode, nama, level, parent, center, geometry GeoJSON MultiPolygon, bounds, source. Indeks parent dan bounding box untuk pencarian titik.

API runtime membaca MongoDB. File `wilayah.json`/`geometry.json` hanya menjadi input migrasi, bukan sumber API. Indeks nama/kode di memori dicache per koneksi DB untuk relasi kantor lama yang belum punya kode.

Koordinat SQL berupa latitude/longitude dikonversi menjadi longitude/latitude pada GeoJSON. Polygon tunggal dan multipart didukung. Pencarian titik menggunakan boundary lengkap; hanya preview nasional yang disederhanakan. Jika beberapa boundary pada tingkat yang sama menutupi satu titik, pengguna memilih salah satu kandidat. Tidak dibuat polygon buatan atau titik kantor dari koordinat pusat wilayah.

Data memuat 38 provinsi, 514 kabupaten/kota, 7.285 kecamatan, 83.762 desa/kelurahan (91.599 dokumen). Terdapat 552 entri geografis, 551 memiliki boundary. Kode `32.79` tidak memiliki boundary. Sumber ini tidak menyediakan boundary kecamatan/desa.

Endpoint khusus kantor:

- `GET /api/kantor/wilayah?parent=36`: anak langsung dan statistik.
- `GET /api/kantor/wilayah/map?kode=36`: provinsi terpilih dan polygon kabupaten/kota; tanpa kode menampilkan provinsi nasional.
- `GET /api/kantor/wilayah/reverse?lat=...&lng=...`: wilayah yang menutupi titik, atau daftar kandidat jika boundary bertumpuk.

Klik polygon, dropdown, serta breadcrumb peta tersinkron. Marker hijau tetap berasal dari koordinat kantor yang tampil pada halaman tabel.
