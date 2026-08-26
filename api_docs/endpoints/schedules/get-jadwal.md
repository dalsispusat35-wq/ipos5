# GET /jadwal

## Summary
Mengambil kalender jadwal perjalanan armada bulanan per rute dan per tanggal.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/jadwal`
- Query: `month=YYYY-MM` (contoh: `2026-08`)

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Jadwal transportasi berhasil diambil.",
  "data": [
    {
      "id": "jdw_01",
      "tanggal": "2026-08-24",
      "start_hour": 8,
      "duration": 2,
      "route": "Feeder Cimahi 01",
      "vehicle": "B 9910 PCX"
    }
  ],
  "errors": null
}
```
