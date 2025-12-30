# CP Leaderboard Backend API Documentation

Backend API for Competitive Programming Leaderboard - tracks ratings from Codeforces, AtCoder, LeetCode, and CodeChef.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Some endpoints require Basic Authentication. Include credentials in the `Authorization` header:

```
Authorization: Basic <base64(username:password)>
```

Admin credentials are stored in MongoDB.

### Authentication Rate Limiting

To prevent brute-force attacks, authentication endpoints have rate limiting based on failed attempts:

- **Maximum failed attempts:** 5 attempts per IP/username combination
- **Window duration:** 15 minutes
- **Lockout duration:** 15 minutes after exceeding the threshold
- **Tracking:** Failed attempts are tracked by both IP address and username

After 5 failed authentication attempts within 15 minutes, the account will be temporarily locked for 15 minutes. Successful authentication clears the failed attempt counter.

**Rate limit exceeded response (429):**
```json
{
  "success": false,
  "error": "Too many failed authentication attempts. Account temporarily locked.",
  "retryAfter": 900
}
```

The `retryAfter` field indicates the number of seconds until the lockout expires.

---

## Endpoints

### Health Check

#### `GET /api/health`

Check if the API is running.

**Authentication:** None

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Leaderboard Endpoints

### `GET /api/leaderboard`

Get the full leaderboard sorted by aggregate score or platform-specific ratings.

**Authentication:** None

**Query Parameters:**
- `sortBy` (optional): Sort field. Options: `aggregate`, `codeforces`, `atcoder`, `leetcode`, `codechef`, `name`. Default: `aggregate`
- `order` (optional): Sort order. Options: `asc`, `desc`. Default: `desc`

**Example Request:**
```
GET /api/leaderboard?sortBy=codeforces&order=desc
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Tourist",
      "handles": {
        "codeforces": "tourist",
        "atcoder": "tourist",
        "codechef": null,
        "leetcode": null
      },
      "ratings": {
        "codeforces": {
          "rating": 3500,
          "maxRating": 3600,
          "rank": "Legendary Grandmaster",
          "lastUpdated": "2024-01-01T00:00:00.000Z",
          "error": null
        },
        "atcoder": {
          "rating": 4000,
          "maxRating": 4100,
          "rank": "Red",
          "lastUpdated": "2024-01-01T00:00:00.000Z",
          "error": null
        }
      },
      "aggregateScore": 3750,
      "lastFullUpdate": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/leaderboard/platform/:platform`

Get platform-specific leaderboard for a single platform.

**Authentication:** None

**URL Parameters:**
- `platform` (required): Platform name. Options: `codeforces`, `atcoder`, `leetcode`, `codechef`

**Example Request:**
```
GET /api/leaderboard/platform/codeforces
```

**Response:**
```json
{
  "success": true,
  "platform": "codeforces",
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Tourist",
      "handles": {
        "codeforces": "tourist"
      },
      "ratings": {
        "codeforces": {
          "rating": 3500,
          "maxRating": 3600,
          "rank": "Legendary Grandmaster",
          "lastUpdated": "2024-01-01T00:00:00.000Z",
          "error": null
        }
      }
    }
  ]
}
```

**Error Response (Invalid Platform):**
```json
{
  "success": false,
  "error": "Invalid platform. Valid options: codeforces, atcoder, leetcode, codechef"
}
```

---

### `GET /api/leaderboard/user/:id`

Get detailed information about a specific user.

**Authentication:** None

**URL Parameters:**
- `id` (required): MongoDB ObjectId of the user

**Example Request:**
```
GET /api/leaderboard/user/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Tourist",
    "handles": {
      "codeforces": "tourist",
      "atcoder": "tourist",
      "codechef": null,
      "leetcode": null
    },
    "ratings": {
      "codeforces": {
        "rating": 3500,
        "maxRating": 3600,
        "rank": "Legendary Grandmaster",
        "lastUpdated": "2024-01-01T00:00:00.000Z",
        "error": null
      },
      "atcoder": {
        "rating": 4000,
        "maxRating": 4100,
        "rank": "Red",
        "lastUpdated": "2024-01-01T00:00:00.000Z",
        "error": null
      }
    },
    "aggregateScore": 3750,
    "lastFullUpdate": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (User Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### `GET /api/leaderboard/stats`

Get leaderboard statistics including total users, average scores, and platform-specific counts.

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 50,
    "avgAggregate": 2500.5,
    "maxAggregate": 4000,
    "cfUsers": 45,
    "acUsers": 40,
    "lcUsers": 30,
    "ccUsers": 25
  }
}
```

---

## User Management Endpoints

### `POST /api/users`

Add a new user to the leaderboard. Automatically fetches ratings from all platforms after creation.

**Authentication:** Required (Basic Auth)

**Request Headers:**
```
Authorization: Basic <base64(username:password)>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tourist",
  "handles": {
    "codeforces": "tourist",
    "atcoder": "tourist",
    "codechef": null,
    "leetcode": null
  }
}
```

**Body Parameters:**
- `name` (required): User's display name
- `handles` (required): Object containing platform handles
  - `codeforces` (optional): Codeforces handle
  - `atcoder` (optional): AtCoder handle
  - `codechef` (optional): CodeChef handle
  - `leetcode` (optional): LeetCode handle

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Basic bmF2aToxMjM0MzIx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tourist",
    "handles": {
      "codeforces": "tourist",
      "atcoder": "tourist"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Tourist",
    "handles": {
      "codeforces": "tourist",
      "atcoder": "tourist",
      "codechef": null,
      "leetcode": null
    },
    "ratings": {
      "codeforces": {
        "rating": 3500,
        "maxRating": 3600,
        "rank": "Legendary Grandmaster",
        "lastUpdated": "2024-01-01T00:00:00.000Z",
        "error": null
      },
      "atcoder": {
        "rating": 4000,
        "maxRating": 4100,
        "rank": "Red",
        "lastUpdated": "2024-01-01T00:00:00.000Z",
        "error": null
      }
    },
    "aggregateScore": 3750,
    "lastFullUpdate": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "ratingErrors": []
}
```

**Response with Rating Errors:**
```json
{
  "success": true,
  "data": {
    // User object with available ratings
  },
  "ratingErrors": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "platform": "codechef",
      "error": "User not found"
    }
  ]
}
```

**Error Responses:**

**400 Bad Request (Missing Name):**
```json
{
  "success": false,
  "error": "Name is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized - Basic authentication required"
}
```

**429 Too Many Requests (Rate Limited):**
```json
{
  "success": false,
  "error": "Too many failed authentication attempts. Account temporarily locked.",
  "retryAfter": 900
}
```

**409 Conflict (User Already Exists):**
```json
{
  "success": false,
  "error": "User with this name already exists"
}
```

---

## Update Endpoints

### `POST /api/update/trigger`

Manually trigger a full update of all users' ratings. Intended for cron jobs.

**Authentication:** Required (Cron Secret)

**Request Headers:**
```
x-cron-secret: <CRON_SECRET>
```

**Request Body (POST over TLS only):**
For POST requests over HTTPS, the secret may also be provided in the request body:
```json
{
  "secret": "<CRON_SECRET>"
}
```

**Note:** Query parameters are not accepted for security reasons (secrets should not appear in URLs/logs).

**Example Request (Header):**
```bash
curl -X POST https://your-domain.com/api/update/trigger \
  -H "x-cron-secret: your-secret-key" \
  -H "Content-Type: application/json"
```

**Example Request (Body - HTTPS only):**
```bash
curl -X POST https://your-domain.com/api/update/trigger \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-secret-key"}'
```

**Response:**
```json
{
  "success": true,
  "usersUpdated": 50,
  "errors": []
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing cron secret"
}
```

**409 Conflict (Update Already Running):**
```json
{
  "success": false,
  "error": "An update is already in progress",
  "startedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### `POST /api/update/user/:id`

Manually update ratings for a specific user.

**Authentication:** None (but rate-limited)

**URL Parameters:**
- `id` (required): MongoDB ObjectId of the user

**Rate Limiting:** 10 requests per hour per IP

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/update/user/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated user object with latest ratings
  },
  "errors": []
}
```

**Response with Errors:**
```json
{
  "success": true,
  "data": {
    // User object with available ratings
  },
  "errors": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "platform": "codechef",
      "error": "User not found"
    }
  ]
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "error": "User not found"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": "Update rate limit exceeded, please try again later"
}
```

---

### `GET /api/update/status`

Get the status of the last update operation.

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:05:00.000Z",
    "status": "completed",
    "usersUpdated": 50,
    "errors": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:05:00.000Z"
  }
}
```

**Response (No Updates Yet):**
```json
{
  "success": true,
  "data": null
}
```

---

## Admin Endpoints

### `GET /api/admin/verify`

Verify admin authentication credentials.

**Authentication:** Required (Basic Auth)

**Request Headers:**
```
Authorization: Basic <base64(username:password)>
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/admin/verify \
  -H "Authorization: Basic bmF2aToxMjM0MzIx"
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication verified",
  "username": "navi"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

**429 Too Many Requests (Rate Limited):**
```json
{
  "success": false,
  "error": "Too many failed authentication attempts. Account temporarily locked.",
  "retryAfter": 900
}
```

---

### `POST /api/admin/credentials`

Add a new admin credential.

**Authentication:** Required (Basic Auth)

**Request Headers:**
```
Authorization: Basic <base64(username:password)>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "newadmin",
  "password": "securepassword123"
}
```

**Body Parameters:**
- `username` (required): Admin username (must be unique, cannot contain colon `:`)
- `password` (required): Admin password (cannot contain colon `:` character due to Basic Auth limitations)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/admin/credentials \
  -H "Authorization: Basic bmF2aToxMjM0MzIx" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newadmin",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "newadmin",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Username is required"
}
```
```json
{
  "success": false,
  "error": "Password is required"
}
```
```json
{
  "success": false,
  "error": "Password cannot contain colon (:) character"
}
```
```json
{
  "success": false,
  "error": "Username cannot contain colon (:) character"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized - Basic authentication required"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "Username already exists"
}
```

---

## Rate Limiting

The API implements multiple rate limiting strategies:

### General API Rate Limiting
- **General API routes:** 100 requests per 15 minutes per IP
- **Update endpoints:** 10 requests per hour per IP

### Authentication Rate Limiting
- **Failed authentication attempts:** 5 attempts per IP/username combination within 15 minutes
- **Lockout duration:** 15 minutes after exceeding threshold
- **Applies to:** All endpoints requiring Basic Authentication

Rate limit exceeded response:
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

Authentication rate limit exceeded response:
```json
{
  "success": false,
  "error": "Too many failed authentication attempts. Account temporarily locked.",
  "retryAfter": 900
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Environment Variables

Required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `CRON_SECRET` - Secret key for cron job authentication (optional, for `/api/update/trigger`)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (`development` or `production`)

---

## Platform Rating Sources

- **Codeforces:** Official API (`codeforces.com/api/user.info`)
- **AtCoder:** Public JSON endpoint (`atcoder.jp/users/{handle}/history/json`)
- **LeetCode:** GraphQL API (`leetcode.com/graphql/`)
- **CodeChef:** Third-party API (`codechef-api.vercel.app`)

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- User IDs are MongoDB ObjectIds
- Ratings are automatically fetched when a new user is created
- Aggregate score is calculated as a weighted average of all platform ratings
- Users with `isActive: false` are excluded from leaderboard queries
- Empty handles (`null`) are allowed and won't cause errors

