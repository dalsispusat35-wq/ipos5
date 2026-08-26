# POST /auth/login

## Summary
Otentikasi pengguna sistem IPOS5 dan menerbitkan token JWT resmi.

## Auth
Tidak memerlukan otentikasi (Public).

## Request
- Method: `POST`
- Path: `/api/auth/login`
- Body:
```json
{
  "username": "admin",
  "password": "password123"
}
```

### Field Details
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `username` | `string` | **Yes** | Username akun terdaftar (contoh: `admin`, `sari`, `operator`). |
| `password` | `string` | **Yes** | Kata sandi akun pengguna. |

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_60b7e289f1d2",
      "username": "admin",
      "name": "Super Administrator",
      "nip": "POS-ADM-99001",
      "role": "SUPER_ADMIN",
      "branch": "KCU Cimahi 40500",
      "created_at": "2026-08-01T08:00:00.000Z"
    }
  },
  "errors": null
}
```

## Error Responses
- **401 Unauthorized:** Username atau kata sandi tidak cocok.
- **503 Service Unavailable:** Basis data MongoDB sedang offline.
