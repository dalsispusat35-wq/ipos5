# GET /users

## Summary
Mengambil daftar seluruh akun pengguna sistem (Khusus `SUPER_ADMIN`).

## Auth
Bearer token required (`SUPER_ADMIN` only).

## Request
- Method: `GET`
- Path: `/api/users`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Daftar pengguna berhasil diambil.",
  "data": [
    {
      "id": "usr_01",
      "username": "admin",
      "name": "Super Administrator",
      "role": "SUPER_ADMIN",
      "nip": "POS-ADM-99001",
      "branch": "KCU Cimahi 40500"
    },
    {
      "id": "usr_02",
      "username": "sari",
      "name": "Sari Rahayu",
      "role": "DISPATCHER",
      "nip": "POS-SPV-40502",
      "branch": "KCU Cimahi (40511)"
    }
  ],
  "errors": null
}
```
