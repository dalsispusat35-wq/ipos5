# GET /master/kantor

## Summary
Mengambil direktori seluruh kantor pos dan nopend di Indonesia (13.000+ data) dengan filter pencarian dan pagination.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/master/kantor`
- Query:
  - `search`: Nama kantor atau Nopend
  - `page`: Nomor halaman (default 1)
  - `limit`: Jumlah data (default 25)
  - `tipe`: `KCU` | `KC` | `KCP` | `Agenpos`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Data kantor pos berhasil diambil.",
  "data": {
    "items": [
      {
        "id": "ofc_40511",
        "nopend": "40511",
        "nama_kantor": "KCP Cimahicisangkan",
        "tipe": "KCP",
        "regional": "Regional III Bandung",
        "lat": -6.8652,
        "lng": 107.5385,
        "status": "AKTIF"
      }
    ],
    "pagination": { "page": 1, "limit": 25, "total": 13420, "totalPages": 537 }
  },
  "errors": null
}
```
