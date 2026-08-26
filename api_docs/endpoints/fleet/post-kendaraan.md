# POST /kendaraan

## Summary
Menambahkan armada logistik baru ke dalam basis data MongoDB `master_kendaraan`.

## Auth
Bearer token required (`SUPER_ADMIN`).

## Request
- Method: `POST`
- Path: `/api/kendaraan`
- Body:
```json
{
  "nopol": "D 8812 AB",
  "nama_kendaraan": "Mitsubishi Fuso Canter",
  "jenis": "TRUCK_BOX",
  "max_capacity_kg": 2000,
  "driver": "Dede Kurnia",
  "driver_phone": "081576543210",
  "home_base": "KCU Bandung"
}
```

## Success Response (201 Created)
```json
{
  "status": 201,
  "success": true,
  "message": "Armada baru berhasil didaftarkan.",
  "data": {
    "id": "vh_8812",
    "nopol": "D 8812 AB",
    "status": "AKTIF"
  },
  "errors": null
}
```
