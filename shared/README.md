# Shared Constants

This directory contains constants and utilities shared between the frontend and backend to ensure consistency across the entire application.

## Why Shared Constants?

In a monorepo with both frontend and backend, it's critical to maintain a **single source of truth** for configuration values that must remain synchronized. Duplicating constants leads to:

- **Inconsistencies** - Frontend and backend can get out of sync
- **Maintenance burden** - Changes must be made in multiple places
- **Bugs** - Easy to update one location and forget the other
- **Testing complexity** - Harder to ensure consistency

## Contents

### `constants.js`

The primary shared constants file containing:

#### `PLATFORMS`
Array of supported competitive programming platform identifiers.

```javascript
['codeforces', 'atcoder', 'leetcode', 'codechef']
```

**Usage:**
- Backend: Iterating over platforms to fetch ratings
- Frontend: Rendering platform columns in the leaderboard
- Both: Validation and type checking

#### `PLATFORM_NAMES`
Human-readable display names for each platform.

```javascript
{
  codeforces: 'Codeforces',
  atcoder: 'AtCoder',
  leetcode: 'LeetCode',
  codechef: 'CodeChef'
}
```

#### `PLATFORM_URLS`
Base URLs for user profiles on each platform.

```javascript
{
  codeforces: 'https://codeforces.com/profile/',
  atcoder: 'https://atcoder.jp/users/',
  leetcode: 'https://leetcode.com/u/',
  codechef: 'https://www.codechef.com/users/'
}
```

## Usage

### Backend

```javascript
import { PLATFORMS, PLATFORM_NAMES, PLATFORM_URLS } from '../../shared/constants.js';

// Use in services, controllers, etc.
PLATFORMS.forEach(platform => {
  // Fetch ratings for each platform
});
```

### Frontend

**Option 1: Direct import**
```javascript
import { PLATFORMS, PLATFORM_NAMES, PLATFORM_URLS } from '../../../shared/constants.js';
```

**Option 2: Via re-export (recommended for cleaner imports)**
```javascript
import { PLATFORMS, PLATFORM_NAMES, PLATFORM_URLS } from '../constants/platforms';
```

The `frontend/src/constants/platforms.js` file re-exports from shared constants:
```javascript
export { PLATFORMS, PLATFORM_NAMES, PLATFORM_URLS } from '../../../shared/constants.js';
```

## Validation

A validation script (`scripts/validate-constants.js`) ensures consistency:

```bash
# Run manually
pnpm run validate:constants

# Runs automatically
- Before frontend builds (prebuild hook)
- In CI/CD pipeline
- On pre-commit (if configured)
```

### What the validator checks:

1. ✅ `shared/constants.js` exists
2. ✅ Frontend imports from shared constants (no local duplicates)
3. ✅ Backend imports from shared constants (no local duplicates)
4. ⚠️ Warns about any other files with local `PLATFORMS` definitions

### Validation output:

```
🔍 Validating platform constants...

✓ shared/constants.js exists
✓ frontend/src/constants/platforms.js: Correctly imports from shared constants
✓ backend/src/services/ratingUpdater.js: Correctly imports from shared constants

✅ All platform constants are consistent!
```

## Adding New Platforms

When adding a new competitive programming platform:

1. **Update `shared/constants.js`**:
   ```javascript
   export const PLATFORMS = ['codeforces', 'atcoder', 'leetcode', 'codechef', 'newplatform'];
   
   export const PLATFORM_NAMES = {
     // ... existing platforms
     newplatform: 'New Platform'
   };
   
   export const PLATFORM_URLS = {
     // ... existing platforms
     newplatform: 'https://newplatform.com/users/'
   };
   ```

2. **Add platform fetcher** in `backend/src/services/platformFetchers/newplatform.js`

3. **Update normalization tiers** in `backend/src/services/ratingUpdater.js`

4. **Add platform colors** in `frontend/src/utils/ratingUtils.js`

5. **Run validation**:
   ```bash
   pnpm run validate:constants
   ```

6. **Test both frontend and backend**

## CI/CD Integration

The validation is integrated into the CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
jobs:
  validate-constants:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Validate platform constants
        run: node scripts/validate-constants.js
```

All other jobs depend on `validate-constants`, ensuring builds fail fast if constants are out of sync.

## Best Practices

### ✅ DO:
- Import from `shared/constants.js`
- Run validation before committing
- Update all related code when adding platforms
- Document changes in this README

### ❌ DON'T:
- Duplicate `PLATFORMS` array in other files
- Hardcode platform names or URLs
- Skip validation checks
- Modify constants without updating both frontend and backend

## Troubleshooting

### Validation fails with "Contains local PLATFORMS definition"

**Problem:** A file has a local copy of the `PLATFORMS` array.

**Solution:**
1. Remove the local definition
2. Add import: `import { PLATFORMS } from '../../shared/constants.js';`
3. Run validation again

### Import path errors

**Problem:** Module not found errors when importing from shared.

**Solution:**
- Backend: Use `../../shared/constants.js` (from `src/services/`)
- Frontend: Use `../../../shared/constants.js` (from `src/constants/`)
- Ensure paths are relative to the importing file

### Build fails in CI but passes locally

**Problem:** Constants might be out of sync in the repository.

**Solution:**
1. Pull latest changes
2. Run `pnpm run validate:constants`
3. Fix any issues
4. Commit and push

## Future Enhancements

Potential additions to shared constants:

- **API endpoints** - Shared API route definitions
- **Error codes** - Standardized error codes across frontend/backend
- **Validation rules** - Shared validation schemas
- **Feature flags** - Centralized feature toggles
- **Rate limits** - Shared rate limiting configuration

## License

ISC
