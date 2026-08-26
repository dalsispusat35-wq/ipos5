# GET /transaksi

## Summary
Mengambil daftar data transaksi kiriman connote dengan filter multi-parameter dan pagination.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/transaksi`
- Query Parameters:
  - `page` (number, default: 1)
  - `limit` (number, default: 25)
  - `search` (string, pencarian connote / penerima / kota)
  - `status` (string, filter status connote)
  - `service` (string, filter layanan produk)
  - `nopol` (string, filter armada pembawa)

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Daftar transaksi kiriman berhasil diambil.",
  "data": {
    "items": [
      {
        "id": "tx_66c29a",
        "connote_code": "P26082400109",
        "service": "Pos Nextday",
        "amount": 35000,
        "weight_kg": 2.5,
        "origin_name": "KCP Cimahicisangkan",
        "destination_name": "KCU Bandung",
        "receiver_name": "Ahmad Dani",
        "connote_state": "TRANSIT_SPP_BANDUNG",
        "created_at": "2026-08-24T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 922,
      "totalPages": 37
    }
  },
  "errors": null
}
```
