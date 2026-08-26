# POST /gate/manifest

## Summary
**Checkpoint 1:** Menggabungkan paket-paket individual berstatus `DITERIMA_DI_CIMAHI` menjadi dokumen Manifest Kontainer baru (`MNF...`) menggunakan transaksi atomik MongoDB (ACID Session).

## Auth
Bearer token required (`DISPATCHER`, `SUPER_ADMIN`).

## Request
- Method: `POST`
- Path: `/api/gate/manifest`
- Body:
```json
{
  "vehicle_nopol": "B 9910 PCX",
  "route_id": "RUTE_FEEDER_CIMAHI_01",
  "connote_codes": [
    "P26082400109",
    "P26082400110",
    "P26082400111"
  ]
}
```

## Success Response (201 Created)
```json
{
  "status": 201,
  "success": true,
  "message": "Manifest kontainer berhasil dibentuk.",
  "data": {
    "manifest_id": "MNF260826001",
    "vehicle_nopol": "B 9910 PCX",
    "total_packages": 3,
    "new_state": "IN_MANIFEST",
    "created_at": "2026-08-26T11:00:00.000Z"
  },
  "errors": null
}
```
