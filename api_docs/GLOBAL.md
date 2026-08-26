# Global API Overview — IPOS5 Logistics Control Tower

Dokumen ini memberikan panduan global standar arsitektur REST API sistem **IPOS5 (Integrated Postal Operational System Redesign)** PT Pos Indonesia (Persero).

## 1. Base URL

- **Development:** `http://localhost:5000/api`
- **Staging / Remote:** `http://192.168.5.219:5000/api`
- **Production:** `https://ipos5.posindonesia.co.id/api`

## 2. Authentication & Authorization

- **Tipe Autentikasi:** Bearer JWT (JSON Web Token)
- **Header:** `Authorization: Bearer <token>`
- **Token Expiry:** 24 Jam
- **Role Pengguna (RBAC):**
  - `SUPER_ADMIN`: Hak akses tertinggi seluruh modul, termasuk Compass MongoDB & Pengaturan Koneksi Sistem.
  - `DISPATCHER`: Pengelolaan armada, manifesting, gate monitoring, dan operasional logistik.
  - `DRIVER`: Akses live manifest muatan truk, status GPS radar, dan konfirmasi serah terima POD.
  - `LOKET_OPERATOR`: Input data resi connote, jadwal pickup agenpos, dan manifestasi awal.

## 3. Standard Response Format

Seluruh respons API menggunakan amplop JSON yang konsisten:

### Success Response (200 / 201)
```json
{
  "status": 200,
  "success": true,
  "message": "Operasi berhasil dijalankan.",
  "data": { ... },
  "errors": null
}
```

### Generic Error Response (400 / 404 / 500)
```json
{
  "status": 404,
  "success": false,
  "message": "Data tidak ditemukan dalam basis data.",
  "data": null,
  "errors": null
}
```

### Validation Error Response (422 Unprocessable Entity)
```json
{
  "status": 422,
  "success": false,
  "message": "Validasi data gagal diproses.",
  "data": null,
  "errors": {
    "field_name": "Keterangan kesalahan validasi"
  }
}
```

### Database Not Connected Error (503 Service Unavailable)
```json
{
  "status": 503,
  "success": false,
  "message": "DATABASE_NOT_CONNECTED",
  "data": null,
  "errors": "MongoDB belum terhubung. Silakan hubungkan cluster terlebih dahulu."
}
```

## 4. Standard Query Parameters (List & Pagination)

| Parameter | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `page` | `number` | `1` | Nomor halaman aktif pagination. |
| `limit` / `per_page` | `number` | `25` | Jumlah data baris per halaman (opsi: 10, 25, 50, 100). |
| `search` | `string` | `""` | Kata kunci pencarian nama, nopen, nopol, atau kode resi. |
| `status` | `string` | `""` | Filter status spesifik (contoh: `DITERIMA_DI_CIMAHI`, `IN_MANIFEST`, dll). |
| `sort_by` | `string` | `created_at` | Nama field pengurutan data. |
| `sort_direction` | `string` | `desc` | Arah urutan (`asc` atau `desc`). |

## 5. HTTP Status Codes Standar

| Status Code | Nama | Penjelasan |
| :--- | :--- | :--- |
| `200` | OK | Permintaan berhasil diproses. |
| `201` | Created | Sumber daya data baru berhasil dibuat. |
| `400` | Bad Request | Parameter atau struktur data request tidak valid. |
| `401` | Unauthorized | Token JWT tidak valid atau sesi telah berakhir. |
| `403` | Forbidden | Pengguna tidak memiliki role akses untuk modul ini. |
| `404` | Not Found | Data atau endpoint yang diminta tidak ditemukan. |
| `422` | Unprocessable Entity | Kesalahan validasi format input data. |
| `500` | Internal Server Error | Kesalahan pemrosesan internal pada server Express / MongoDB. |
| `503` | Service Unavailable | Layanan database MongoDB sedang terputus / offline. |
