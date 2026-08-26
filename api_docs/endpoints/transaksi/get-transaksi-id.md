# GET /transaksi/:id

## Summary
Mengambil data detail lengkap satu transaksi resi pengiriman.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/transaksi/:id`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Detail transaksi ditemukan.",
  "data": {
    "id": "tx_66c29a",
    "connote_code": "P26082400109",
    "service": "Pos Nextday (PE)",
    "amount": 35000,
    "actual_weight": 2.5,
    "connote_state": "TRANSIT_SPP_BANDUNG",
    "sender": { "name": "PT Sumber Rejeki", "phone": "08123456789", "city": "Cimahi" },
    "receiver": { "name": "Ahmad Dani", "phone": "08198765432", "city": "Bandung" }
  },
  "errors": null
}
```
