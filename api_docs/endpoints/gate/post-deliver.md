# POST /gate/deliver

## Summary
**Checkpoint 3:** Konfirmasi serah terima paket di SPP tujuan / kurir last-mile dan memperbarui status paket menjadi `DELIVERED`.

## Auth
Bearer token required (`DISPATCHER`, `DRIVER`, `SUPER_ADMIN`).

## Request
- Method: `POST`
- Path: `/api/gate/deliver`
- Body:
```json
{
  "connote_code": "P26082400109",
  "received_by": "Ahmad Dani (Penerima Langsung)",
  "notes": "Paket diterima dalam kondisi baik."
}
```

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Paket telah berhasil diserahterimakan (DELIVERED).",
  "data": {
    "connote_code": "P26082400109",
    "connote_state": "DELIVERED",
    "delivered_at": "2026-08-26T14:30:00.000Z"
  },
  "errors": null
}
```
