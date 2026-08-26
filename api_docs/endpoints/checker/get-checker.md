# GET /checker/:code

## Summary
Melakukan pencarian ganda (*Dual Search*) berdasarkan **Nomor Resi Connote** (contoh: `P26082400109`) atau **Nomor Polisi Armada Truk** (contoh: `B 9910 PCX`). Mengembalikan jejak rute multi-stop transit dan daftar manifest muatan.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/checker/:code`
- Path Param: `code` (string) — Nomor resi connote atau nopol plat kendaraan.
- Query: `date=YYYY-MM-DD` (opsional)

## Success Response - Mode Connote Resi (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Data tracking resi ditemukan.",
  "data": {
    "type": "connote",
    "connote": {
      "connote_code": "P26082400109",
      "service": "Pos Nextday (PE)",
      "weight_kg": 2.5,
      "amount": 35000,
      "sender_name": "PT Sumber Rejeki Cimahi",
      "sender_address": "Jl. Gandawijaya No. 12, Cimahi",
      "receiver_name": "Ahmad Dani",
      "receiver_address": "Jl. Asia Afrika No. 49, Bandung",
      "origin_nopen": "40511",
      "origin_name": "KCP Cimahi Cisangkan (40511)",
      "destination_nopen": "40000",
      "destination_name": "KCU Bandung (40000)",
      "connote_state": "TRANSIT_SPP_BANDUNG"
    },
    "assignedVehicle": {
      "nopol": "B 9910 PCX",
      "name": "Isuzu Giga Box 9910",
      "driver": "Ahmad Supriadi",
      "phone": "0812-9876-5432"
    },
    "route": {
      "route_id": "RUTE_FEEDER_CIMAHI_01",
      "route_name": "Feeder Cisangkan - SPP Bandung",
      "waypoints": [
        { "seq": 1, "nopen": "40511", "name": "KCP Cimahicisangkan", "status": "COMPLETED" },
        { "seq": 2, "nopen": "40511CB", "name": "Agenpos SANGKURIANG", "status": "COMPLETED" },
        { "seq": 3, "nopen": "40400", "name": "SPP Bandung (Transit Hub)", "status": "IN_PROGRESS" },
        { "seq": 4, "nopen": "40000", "name": "KCU Bandung (Tujuan Akhir)", "status": "PENDING" }
      ]
    }
  },
  "errors": null
}
```
