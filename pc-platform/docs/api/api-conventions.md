# API Conventions — PC Platform

> Status: Active | Last Updated: 2026-09

---

## 1. Base URL

```
Development: http://localhost:4000/api/v1
Production:  https://api.pcplatform.in/api/v1
```

All endpoints are prefixed with `/api/v1`. Version increments (`v2`) happen when breaking changes are needed.

---

## 2. Authentication

Protected endpoints require a JWT access token:

```
Authorization: Bearer <access_token>
```

Obtain tokens via:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh` (uses httpOnly cookie)

---

## 3. Response Envelope

All responses use a consistent wrapper:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Success Response (Paginated)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 24,
    "total": 847,
    "totalPages": 36
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Expected number, received string"
    }
  ],
  "timestamp": "2026-09-07T12:00:00.000Z",
  "path": "/api/v1/products"
}
```

---

## 4. HTTP Status Codes

| Code | Meaning | When Used |
|---|---|---|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token, insufficient role |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate (e.g., email already registered) |
| 422 | Unprocessable Entity | Valid format but business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Dependency (e.g., compatibility engine) is down |

---

## 5. Pagination

Paginated endpoints accept query params:

```
GET /api/v1/products?page=1&limit=24
```

| Param | Default | Max | Description |
|---|---|---|---|
| `page` | 1 | — | Page number (1-indexed) |
| `limit` | 24 | 100 | Items per page |

---

## 6. Filtering & Sorting

```
GET /api/v1/products?category=cpu&brand=AMD&minPrice=5000&maxPrice=50000&sort=price&order=asc
```

Common filter params:

| Param | Type | Example |
|---|---|---|
| `category` | string | `cpu`, `gpu` |
| `brand` | string | `AMD`, `Intel` |
| `minPrice` | number | `5000` |
| `maxPrice` | number | `50000` |
| `sort` | string | `price`, `name`, `createdAt` |
| `order` | `asc` \| `desc` | `asc` |
| `search` | string | `ryzen 9` |
| `inStock` | boolean | `true` |

---

## 7. Endpoint Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create user account |
| POST | `/auth/login` | Public | Login, receive tokens |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | Bearer | Revoke refresh token |
| GET | `/auth/me` | Bearer | Get current user |

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | List products (paginated, filterable) |
| GET | `/products/:id` | Public | Get product by ID |
| GET | `/products/slug/:slug` | Public | Get product by slug |

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/categories` | Public | List all categories (tree) |
| GET | `/categories/:id/products` | Public | Products in a category |

### Builds

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/builds` | Bearer | Create/save a build |
| GET | `/builds` | Bearer | List user's builds |
| GET | `/builds/:id` | Bearer | Get build detail |
| PUT | `/builds/:id` | Bearer | Update build |
| DELETE | `/builds/:id` | Bearer | Delete build |
| POST | `/builds/check-compatibility` | Bearer | Check component compatibility |

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Bearer | Place an order |
| GET | `/orders` | Bearer | List user's orders |
| GET | `/orders/:id` | Bearer | Get order detail |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/products` | Admin | List all products |
| POST | `/admin/products` | Admin | Create product |
| PUT | `/admin/products/:id` | Admin | Update product |
| DELETE | `/admin/products/:id` | Admin | Deactivate product |
| GET | `/admin/orders` | Admin | List all orders |
| PATCH | `/admin/orders/:id/status` | Admin | Update order status |
| GET | `/admin/users` | Admin | List all users |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Service health check |
| GET | `/health/db` | Public | Database connectivity check |

---

## 8. Naming Conventions

- Paths: `kebab-case` plural nouns (`/products`, `/product-images`, `/order-items`)
- Resource IDs: cuid strings (e.g., `clxyz123...`)
- JSON fields: `camelCase` in responses (`productId`, `createdAt`)
- Enum values in responses: `SCREAMING_SNAKE_CASE` (`ORDER_STATUS: "CONFIRMED"`)

---

## 9. Rate Limiting

| Endpoint Group | Limit |
|---|---|
| Auth endpoints | 10 req/min per IP |
| Public read endpoints | 100 req/min per IP |
| Authenticated endpoints | 200 req/min per user |
| Admin endpoints | 500 req/min per admin |
