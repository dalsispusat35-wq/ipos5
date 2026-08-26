# POST /gate/transit

## Summary
**Checkpoint 2:** Scan masuk inbound manifest di Hub Transit SPP Bandung 40400. Seluruh connote di dalam manifest otomatis beralih menjadi status `TRANSIT_SPP_BANDUNG`.

## Auth
Bearer token required (`DISPATCHER`, `SUPER_ADMIN`).

## Request
- Method: `POST`
- Path: `/api/gate/transit`
- Body:
```json
{
  "manifest_id": "MNF260826001",
  "hub_nopen": "40400"
}
```

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Inbound transit SPP Bandung berhasil diproses.",
  "data": {
    "manifest_id": "MNF260826001",
    "updated_count": 3,
    "new_state": "TRANSIT_SPP_BANDUNG"
  },
  "errors": null
}
```
