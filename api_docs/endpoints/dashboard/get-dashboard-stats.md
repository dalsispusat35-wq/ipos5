# GET /dashboard-stats

## Summary
Mengambil seluruh metrik statistik KPI operasional, breakdown status linier, volume bulanan, dan telemetri live connote secara real-time dari koleksi `transaksi`.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/dashboard-stats`
- Query Parameters:
  - `datePreset`: `today` | `7d` | `30d` | `All`
  - `startDate`: `YYYY-MM-DD` (opsional)
  - `endDate`: `YYYY-MM-DD` (opsional)
  - `service`: `Pos Sameday` | `Pos Nextday` | `Pos Reguler` | `All`
  - `period`: `Week` | `Month` | `Year`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Statistik dasbor berhasil diambil.",
  "data": {
    "counts": {
      "totalKantor": 13420,
      "totalProduk": 12,
      "totalKendaraan": 4,
      "totalRoute": 8,
      "totalPackages": 922
    },
    "kpi": {
      "received": 210,
      "manifest": 140,
      "inTransit": 315,
      "arrived": 120,
      "delivered": 137,
      "returned": 0,
      "totalRevenue": 18450000,
      "totalWeightKg": 1420.5
    },
    "statusBreakdown": {
      "DITERIMA_DI_CIMAHI": 210,
      "IN_MANIFEST": 140,
      "TRANSIT_SPP_BANDUNG": 315,
      "TIBA_DI_SPP_TUJUAN": 120,
      "DELIVERED": 137
    },
    "monthlyShipments": [
      { "month": "Jan", "total": 850, "delivered": 810, "onDelivery": 40 },
      { "month": "Aug", "total": 922, "delivered": 137, "onDelivery": 785 }
    ],
    "popularCategories": [
      { "name": "Pos Reguler (PKH)", "count": 480, "percentage": 52, "totalRevenue": 9600000 },
      { "name": "Pos Nextday (PE)", "count": 310, "percentage": 34, "totalRevenue": 6200000 },
      { "name": "Pos Sameday (Q9)", "count": 132, "percentage": 14, "totalRevenue": 2650000 }
    ],
    "recentTransactions": [
      {
        "connote_code": "P26082400109",
        "connote_service": "Pos Nextday",
        "connote_state": "TRANSIT_SPP_BANDUNG",
        "receiver_name": "Budi Hartono",
        "destination": "KCU Bandung (40000)",
        "amount": 25000,
        "weight_kg": 1.4,
        "statusType": "transit"
      }
    ]
  },
  "errors": null
}
```
