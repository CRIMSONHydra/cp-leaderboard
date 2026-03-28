# CLAUDE.md - Project Guidelines for AI Assistants

## Project Overview

CP Leaderboard is a monorepo tracking competitive programming ratings across Codeforces, AtCoder, LeetCode, and CodeChef. It uses a pnpm workspace with:

- `backend/` — Express 5 API (ESM, Node 18+), MongoDB via Mongoose, optional Redis
- `frontend/` — React 19 + Vite, React Router, Recharts
- `shared/` — Constants shared between frontend and backend

## Design Principles

### Single Responsibility Principle (SRP)

Every module, component, and function must have one clearly defined responsibility.

- **Backend**: Each controller handles one resource. Each service encapsulates one domain operation. Each middleware addresses one cross-cutting concern. Platform fetchers each handle one platform.
- **Frontend**: Each component renders one UI concern. Hooks encapsulate one data-fetching or state pattern. Utility files group functions by domain (e.g., rating colors, encoding).
- **When adding new code**: If a function does two unrelated things, split it. If a component manages its own data fetching AND complex rendering, extract a hook or child component.

### Open/Closed Principle (OCP)

Modules should be open for extension but closed for modification.

- **Adding a new platform** (see checklist in `shared/constants.js`):
  1. Add to `PLATFORMS`, `PLATFORM_NAMES`, `PLATFORM_URLS`, `PLATFORM_CHART_COLORS` in `shared/constants.js`
  2. Create a fetcher in `backend/src/services/platformFetchers/` and register in `index.js`
  3. Add normalization tiers to `NORMALIZATION_TIERS` in `ratingUpdater.js`
  4. Add a color function and register it in `platformColorResolvers` in `frontend/src/utils/ratingUtils.js`
  5. All dynamic code (sort options, stats, form fields, chart lines) picks it up automatically
- **Adding new normalization tiers**: Add entries to `NORMALIZATION_TIERS` in `ratingUpdater.js`. The `normalizeRating` function handles any tier array without modification.
- **Adding new routes**: Mount a new router in `backend/src/routes/index.js`. Existing route files don't change.
- **Platform config is centralized**: `shared/constants.js` is the single source of truth. Frontend components import via `constants/platforms.js`. Never duplicate platform names, URLs, or colors locally.

### File Size Limit

**No source file should exceed 800 lines.** If a file approaches or exceeds this limit, refactor by extracting logic into separate modules or components:

- Backend: Split into sub-services, helper modules, or separate middleware files.
- Frontend: Extract child components, custom hooks, or utility functions.

## Development Workflow

### Every Feature or Change Must Include

1. **Tests** — Add or update tests for all new/changed logic.
   - Backend tests: `backend/src/**/__tests__/*.test.js`
   - Frontend tests: `frontend/src/**/__tests__/*.test.{js,jsx}`
   - Pure function tests for any new utility/helper logic.
   - Component tests for new React components.
   - Middleware tests for new Express middleware.

2. **Run checks before considering work complete:**
   ```bash
   pnpm test          # Runs validate:constants + backend tests + frontend tests
   pnpm lint          # Runs ESLint on frontend
   pnpm build         # Ensures production build succeeds
   ```

3. **All checks must pass.** Do not leave failing tests or lint errors.

## Commands

```bash
# Development
pnpm dev              # Run backend + frontend concurrently
pnpm dev:backend      # Backend only (nodemon)
pnpm dev:frontend     # Frontend only (vite)

# Testing
pnpm test             # All tests (validates constants first)
pnpm test:backend     # Backend tests only
pnpm test:frontend    # Frontend tests only
pnpm test:watch       # Watch mode for both
pnpm test:coverage    # Coverage reports

# Quality
pnpm lint             # ESLint (frontend)
pnpm build            # Production build (frontend + backend)
pnpm validate:constants  # Verify shared constants consistency
```

## Project Structure Conventions

- Tests live in `__tests__/` directories adjacent to the code they test.
- Shared constants in `shared/constants.js` are the single source of truth for platform configuration — never duplicate them.
- Backend uses ESM (`"type": "module"`) throughout.
- Environment variables: `MONGODB_URI`, `REDIS_URL` (optional), `BOOTSTRAP_SECRET`, `CRON_SECRET`.

## Architecture Notes

### Backend Request Flow

```
Request → Rate Limiter → Auth Middleware (if protected) → Controller → Service → Response
```

- **Rate limiters** (`rateLimiter.js`, `authRateLimiter.js`) use Redis when available, in-memory fallback otherwise.
- **basicAuth middleware** validates HTTP Basic Auth against `AdminCredential` model in MongoDB (bcrypt-hashed passwords).
- **Update locking** uses MongoDB atomic `findOneAndUpdate` with a fixed `GLOBAL_UPDATE_LOCK` document to prevent concurrent rating updates.

### Frontend State Management

- **No Redux** — uses React Context for auth (`AuthContext`) and component-level state for everything else.
- **Data fetching** happens in custom hooks (`useLeaderboard`, `useUpdateStatus`, `useStats`) or directly in page components.
- **API calls** go through `frontend/src/services/api.js` which wraps `fetch` with the base URL from `import.meta.env.VITE_API_URL`.

### Rating Normalization

Each platform's rating maps to a 0-100 scale via piecewise linear interpolation (`NORMALIZATION_TIERS` in `ratingUpdater.js`). The aggregate score is the average of normalized ratings across platforms where the user has a valid rating.

## Common Pitfalls

- **Async rate limiter calls**: `req.authRateLimiter.recordFailed()` and `.clearFailed()` are async — always `await` them.
- **Error messages in responses**: Never leak `error.message` to API clients. Log server-side, return generic messages.
- **Shared constants**: When adding a platform, update `shared/constants.js`, NOT local arrays. The `validate:constants` script enforces this.
- **Bootstrap endpoint**: Requires `BOOTSTRAP_SECRET` env var and only works when no admin credentials exist yet.
