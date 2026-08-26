# POST /settings/connection/switch

## Summary
Mengubah profil target string koneksi URI MongoDB secara dinamis tanpa perlu restart server Express (Khusus `SUPER_ADMIN`).

## Auth
Bearer token required (`SUPER_ADMIN` only).

## Request
- Method: `POST`
- Path: `/api/settings/connection/switch`
- Body:
```json
{
  "connection_uri": "mongodb://Valdric:****@192.168.5.219:27017/ipos5_reporting?authSource=admin"
}
```

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Koneksi database MongoDB berhasil dialihkan.",
  "data": {
    "connected": true,
    "database": "ipos5_reporting"
  },
  "errors": null
}
```
