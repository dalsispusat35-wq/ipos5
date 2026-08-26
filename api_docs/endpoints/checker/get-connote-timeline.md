# GET /checker/events/:connote

## Summary
Mengambil seluruh rekaman kronologis jejak audit (*audit trail*) perjalanan paket berdasarkan kode connote.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/checker/events/:connote`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Riwayat audit trail berhasil diambil.",
  "data": {
    "connote_code": "P26082400109",
    "events": [
      {
        "state": "DITERIMA_DI_CIMAHI",
        "location": "KCP Cimahicisangkan (40511)",
        "officer": "Budi Setiawan (Loket)",
        "timestamp": "2026-08-24T08:30:00.000Z",
        "description": "Paket diterima di loket kantor pos asal."
      },
      {
        "state": "IN_MANIFEST",
        "location": "KCU Cimahi 40500",
        "manifest_id": "MNF260824001",
        "officer": "Sari Rahayu (Dispatcher)",
        "timestamp": "2026-08-24T10:15:00.000Z",
        "description": "Paket digabungkan ke Manifest Kontainer Truk B 9910 PCX."
      },
      {
        "state": "TRANSIT_SPP_BANDUNG",
        "location": "SPP Bandung 40400",
        "officer": "Yudi Permana (Hub Transit)",
        "timestamp": "2026-08-24T13:45:00.000Z",
        "description": "Scan masuk gerbang inbound transit SPP Bandung."
      }
    ]
  },
  "errors": null
}
```
