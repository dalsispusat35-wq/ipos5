# POST /auth/logout

## Summary
Mengakhiri sesi aktif pengguna dan me-revoke token.

## Auth
Bearer token required.

## Request
- Method: `POST`
- Path: `/api/auth/logout`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Logout berhasil.",
  "data": null,
  "errors": null
}
```
