# GET /gate/pipeline

## Summary
Mengambil data antrean kiriman pada 3 tahap Checkpoint Gate Monitoring secara real-time.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/gate/pipeline`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Pipeline gate monitoring berhasil diambil.",
  "data": {
    "checkpoint1_bagging": {
      "count": 210,
      "status": "DITERIMA_DI_CIMAHI",
      "total_weight_kg": 340.2
    },
    "checkpoint2_transit": {
      "count": 140,
      "status": "IN_MANIFEST",
      "total_weight_kg": 520.8
    },
    "checkpoint3_delivery": {
      "count": 315,
      "status": "TRANSIT_SPP_BANDUNG",
      "total_weight_kg": 710.0
    }
  },
  "errors": null
}
```
