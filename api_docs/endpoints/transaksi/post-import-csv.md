# POST /transaksi/import-csv

## Summary
Melakukan import data transaksi connote massal dari file CSV ke dalam koleksi MongoDB `transaksi`.

## Auth
Bearer token required (`SUPER_ADMIN`).

## Request
- Method: `POST`
- Path: `/api/transaksi/import-csv`
- Header: `Content-Type: multipart/form-data`
- Form field: `file` (file `.csv`)

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Import 500 baris data transaksi CSV berhasil.",
  "data": {
    "insertedCount": 500,
    "skippedCount": 0,
    "timestamp": "2026-08-26T10:30:00.000Z"
  },
  "errors": null
}
```
