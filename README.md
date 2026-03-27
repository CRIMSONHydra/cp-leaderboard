# CP Leaderboard

A comprehensive leaderboard system for tracking competitive programming ratings across multiple platforms.

## Architecture

This is a monorepo containing:

- **`frontend/`** - React + Vite frontend application
- **`backend/`** - Express.js backend API
- **`shared/`** - Shared constants and utilities used by both frontend and backend
- **`scripts/`** - Build and validation scripts

## Shared Constants

The `shared/constants.js` file contains platform definitions that are used by both frontend and backend to ensure consistency. This includes:

- `PLATFORMS` - Array of supported platform identifiers
- `PLATFORM_NAMES` - Display names for each platform
- `PLATFORM_URLS` - Base URLs for platform profiles

**Important**: Always import from `shared/constants.js` rather than duplicating these values. A validation script (`scripts/validate-constants.js`) runs automatically during builds to ensure consistency.

## Supported Platforms

- **Codeforces** - Russian competitive programming platform
- **AtCoder** - Japanese competitive programming platform  
- **LeetCode** - Algorithm practice and contest platform
- **CodeChef** - Indian competitive programming platform

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- MongoDB instance

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install root dependencies
   pnpm install
   
   # Install frontend dependencies
   cd frontend && pnpm install
   
   # Install backend dependencies
   cd backend && pnpm install
   ```

3. Configure environment variables (see backend/README.md and frontend/README.md)

### Running the Application

**Backend**:
```bash
cd backend
pnpm run dev
```

**Frontend**:
```bash
cd frontend
pnpm run dev
```

### Validation

Run the constants validation script:
```bash
pnpm run validate:constants
```

This script automatically runs before builds to ensure platform constants remain synchronized between frontend and backend.

## Project Structure

```
cp-leaderboard/
├── shared/              # Shared constants and utilities
│   └── constants.js     # Platform definitions (single source of truth)
├── backend/             # Express.js API server
│   ├── src/
│   │   ├── config/      # Database, Redis configuration
│   │   ├── controllers/ # Request handlers
│   │   ├── middlewares/ # Auth, rate limiting, etc.
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # API routes
│   │   ├── scripts/     # Cron jobs, utilities
│   │   └── services/    # Business logic, platform fetchers
│   └── README.md        # Backend documentation
├── frontend/            # React + Vite application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── constants/   # Frontend constants (re-exports shared)
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   └── utils/       # Utility functions
│   └── README.md        # Frontend documentation
└── scripts/             # Build and validation scripts
    └── validate-constants.js
```

## Features

- **Multi-platform tracking** - Aggregates ratings from Codeforces, AtCoder, LeetCode, and CodeChef
- **Normalized scoring** - Converts different rating scales to a unified 0-100 scale
- **Rating history** - Tracks rating changes over time with interactive charts
- **Admin panel** - Protected interface for adding users and managing credentials
- **Rate limiting** - Built-in protection against abuse with Redis support
- **Web scraping fallback** - Gracefully handles API failures with HTML parsing
- **Real-time updates** - Automated cron jobs to keep ratings current

## Security

- Basic authentication for admin endpoints
- Rate limiting on authentication attempts to prevent brute force
- Redis-backed distributed rate limiting for production clusters
- Secure credential handling with in-memory storage
- CRON secret validation via headers (not URL parameters)

## Contributing

When adding new platforms or modifying platform configurations:

1. Update `shared/constants.js` only - never duplicate platform definitions
2. Run `pnpm run validate:constants` to verify consistency
3. Update normalization tiers in `backend/src/services/ratingUpdater.js` if needed
4. Add platform fetchers in `backend/src/services/platformFetchers/`

## License

ISC

