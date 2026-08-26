# GET /kendaraan/:nopol/detail

## Summary
Mengambil profil detail cockpit armada, rincian rute perhentian, meteran beban (*Load Gauge*), dan seluruh daftar manifest muatan aktif.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/kendaraan/:nopol/detail`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Detail armada berhasil diambil.",
  "data": {
    "vehicle": {
      "nopol": "B 9910 PCX",
      "driver": "Ahmad Supriadi",
      "max_capacity_kg": 1500,
      "current_load_kg": 850.5,
      "status_kapasitas": "SAFE"
    },
    "activeManifest": {
      "manifest_id": "MNF260824001",
      "total_packages": 65,
      "total_weight_kg": 850.5
    },
    "transactions": [
      {
        "connote_code": "P26082400109",
        "service": "Pos Nextday",
        "weight_kg": 2.5,
        "destination": "SPP Bandung (40400)"
      }
    ]
  },
  "errors": null
}
```
