# POST /transaksi

## Summary
Membuat pencatatan transaksi resi pengiriman baru di loket.

## Auth
Bearer token required (`LOKET_OPERATOR`, `DISPATCHER`, `SUPER_ADMIN`).

## Request
- Method: `POST`
- Path: `/api/transaksi`
- Body:
```json
{
  "service_code": "PE",
  "actual_weight": 2.5,
  "amount": 35000,
  "origin_nopen": "40511",
  "destination_nopen": "40000",
  "sender_name": "PT Sumber Rejeki",
  "sender_address": "Jl. Gandawijaya No. 12, Cimahi",
  "receiver_name": "Ahmad Dani",
  "receiver_address": "Jl. Asia Afrika No. 49, Bandung"
}
```

## Success Response (201 Created)
```json
{
  "status": 201,
  "success": true,
  "message": "Transaksi resi baru berhasil dibuat.",
  "data": {
    "connote_code": "P26082600991",
    "connote_state": "DITERIMA_DI_CIMAHI",
    "amount": 35000,
    "created_at": "2026-08-26T10:00:00.000Z"
  },
  "errors": null
}
```
