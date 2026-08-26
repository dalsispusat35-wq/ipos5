# POST /jadwal/generate

## Summary
Men-generate jadwal perjalanan bulanan secara otomatis berdasarkan template rutin mingguan yang aktif.

## Auth
Bearer token required (`DISPATCHER`, `SUPER_ADMIN`).

## Request
- Method: `POST`
- Path: `/api/jadwal/generate`
- Body:
```json
{
  "target_month": "2026-09"
}
```

## Success Response (201 Created)
```json
{
  "status": 201,
  "success": true,
  "message": "Jadwal transportasi bulan 2026-09 berhasil dibuat.",
  "data": {
    "generatedCount": 120,
    "month": "2026-09"
  },
  "errors": null
}
```
