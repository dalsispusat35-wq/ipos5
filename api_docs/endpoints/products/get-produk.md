# GET /master/produk

## Summary
Mengambil katalog seluruh produk dan layanan resmi PT Pos Indonesia.

## Auth
Bearer token required.

## Request
- Method: `GET`
- Path: `/api/master/produk`

## Success Response (200 OK)
```json
{
  "status": 200,
  "success": true,
  "message": "Katalog produk layanan pos berhasil diambil.",
  "data": [
    { "code": "Q9", "name": "Pos Sameday", "category": "Express", "sla": "Same Day (8 Jam)", "active": true },
    { "code": "PE", "name": "Pos Nextday", "category": "Express", "sla": "Next Day (1 Hari)", "active": true },
    { "code": "PKH", "name": "Pos Reguler", "category": "Standard", "sla": "2-3 Hari", "active": true },
    { "code": "EC3", "name": "Pos Shopee", "category": "E-Commerce", "sla": "2-4 Hari", "active": true }
  ],
  "errors": null
}
```
