# GET /kendaraan

## Summary
Mengambil daftar seluruh armada mobil/truk logistik aktif beserta kalkulasi beban muatan fisik (Kg) dan persentase utilisasi muatan real-time.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/kendaraan`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Daftar armada kendaraan berhasil diambil.",
  "data": [
    {
      "id": "vh_9910",
      "nopol": "B 9910 PCX",
      "nama_kendaraan": "Isuzu Giga Box 9910",
      "jenis": "TRUCK_BOX",
      "max_capacity_kg": 1500,
      "current_load_kg": 850.5,
      "utilization_pct": 56.7,
      "status_kapasitas": "SAFE",
      "driver": "Ahmad Supriadi",
      "driver_phone": "0812-9876-5432",
      "home_base": "KCU Cimahi",
      "assigned_route": "Feeder Cimahi Raya (40511 - 40400)",
      "status": "AKTIF"
    }
  ],
  "errors": null
}
```
