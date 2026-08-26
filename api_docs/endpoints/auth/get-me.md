# GET /auth/me

## Summary
Mengambil profil akun dan otoritas pengguna yang sedang login berdasarkan Bearer token.

## Auth
Bearer token required (`Authorization: Bearer <token>`).

## Request
- Method: `GET`
- Path: `/api/auth/me`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Profil pengguna berhasil diambil.",
  "data": {
    "user": {
      "id": "usr_60b7e289f1d2",
      "username": "sari",
      "name": "Sari Rahayu",
      "nip": "POS-SPV-40502",
      "role": "DISPATCHER",
      "branch": "KCU Cimahi (40511)",
      "regional": "Regional III Bandung"
    }
  },
  "errors": null
}
```
