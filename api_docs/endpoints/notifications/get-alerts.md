# GET /notifications/alerts

## Summary
Mengambil notifikasi peringatan kapasitas muatan dan status operasional sistem.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/notifications/alerts`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Notifikasi berhasil diambil.",
  "data": {
    "unreadCount": 1,
    "alerts": [
      {
        "id": "alt_01",
        "type": "WARNING",
        "title": "Kapasitas Armada B 9910 PCX",
        "message": "Muatan telah mencapai 850 kg (56.7% dari 1.500 kg).",
        "timestamp": "2026-08-26T09:00:00.000Z",
        "read": false
      }
    ]
  },
  "errors": null
}
```
