# GET /master/routes

## Summary
Mengambil daftar seluruh master rute koridor logistik operasional.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/master/routes`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Daftar rute logistik berhasil diambil.",
  "data": [
    {
      "route_id": "RUTE_FEEDER_CIMAHI_01",
      "nama_rute": "Feeder Cisangkan - SPP Bandung",
      "nopen_asal": "40511",
      "nopen_tujuan": "40400",
      "total_stops": 7,
      "aktif": "Y"
    }
  ],
  "errors": null
}
```
