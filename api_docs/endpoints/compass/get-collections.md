# GET /compass/collections

## Summary
Mengambil daftar seluruh koleksi MongoDB internal beserta jumlah dokumen per koleksi (Khusus `SUPER_ADMIN`).

## Auth
Bearer token required (`SUPER_ADMIN` only).

## Request
- Method: `GET`
- Path: `/api/compass/collections`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Koleksi database MongoDB berhasil diinspeksi.",
  "data": [
    { "name": "transaksi", "count": 922, "size": "1.2 MB" },
    { "name": "master_kendaraan", "count": 4, "size": "12 KB" },
    { "name": "master_kantor", "count": 13420, "size": "4.8 MB" }
  ],
  "errors": null
}
```
