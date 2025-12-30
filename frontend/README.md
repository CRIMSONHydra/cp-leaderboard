# CP Leaderboard Frontend

React + Vite frontend application for the Competitive Programming Leaderboard.

## ⚠️ Important: Shared Constants

Platform definitions (PLATFORMS array) are defined in `shared/constants.js` at the repository root. **Never duplicate these constants in frontend code.** Always import from:

```javascript
import { PLATFORMS } from '../../../shared/constants.js';
```

Or re-export through `src/constants/platforms.js`:

```javascript
import { PLATFORMS } from '../constants/platforms';
```

A validation script runs automatically before builds to ensure consistency.

## Features

- **Interactive Leaderboard** - View rankings across all platforms with sortable columns
- **User Profiles** - Detailed rating history with interactive charts
- **Admin Panel** - Protected interface for adding users (Basic Auth)
- **Responsive Design** - Works on desktop and mobile devices
- **Real-time Updates** - Displays latest ratings from all platforms

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. Start development server:
   ```bash
   pnpm run dev
   ```

### Build

```bash
pnpm run build
```

The build output will be in the `dist/` directory. The build process automatically validates that platform constants are synchronized with the backend.

### Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production (includes validation)
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint
- `pnpm run validate:constants` - Validate platform constants consistency

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components (Tooltip, Loading, etc.)
│   │   ├── Layout/          # Header and layout components
│   │   ├── Leaderboard/     # Leaderboard table and row components
│   │   ├── UserManagement/  # Admin panel components
│   │   └── UserProfile/     # User profile and charts
│   ├── constants/
│   │   └── platforms.js     # Re-exports shared platform constants
│   ├── contexts/
│   │   └── AuthContext.jsx  # In-memory authentication context
│   ├── hooks/
│   │   └── useLeaderboard.js # Custom hook for leaderboard data
│   ├── pages/
│   │   ├── LeaderboardPage.jsx
│   │   └── UserProfilePage.jsx
│   ├── services/
│   │   └── api.js           # API client with Unicode-safe Basic Auth
│   └── utils/
│       ├── basicAuth.js     # Basic Auth encoding utilities
│       └── ratingUtils.js   # Rating color and formatting
└── public/                  # Static assets
```

## Key Components

### Leaderboard Table
- Sortable columns for each platform and aggregate score
- Color-coded ratings matching official platform colors
- Clickable usernames to view detailed profiles

### User Profile
- Combined rating history chart across all platforms
- Individual platform charts with contest details
- Current and highest ratings/ranks for each platform
- Aggregate score with tooltip explanation

### Admin Panel
- Protected by Basic Authentication
- Add new users with platform handles
- Automatic rating fetch on user creation
- In-memory credential storage (no browser storage)

## Security

- **In-memory Auth** - Credentials stored in React context, not sessionStorage
- **Unicode-safe Base64** - Proper encoding for non-ASCII characters
- **Protected Routes** - Admin panel requires authentication
- **HTTPS-ready** - Secure credential transmission

## Accessibility

- **Keyboard Navigation** - All interactive elements are keyboard accessible
- **Focus Indicators** - Clear `:focus-visible` styles for keyboard users
- **ARIA Attributes** - Tooltips and interactive elements have proper ARIA labels
- **Screen Reader Support** - Semantic HTML and ARIA roles

## Contributing

When adding new features:

1. Always import platform constants from `shared/constants.js`
2. Run `pnpm run validate:constants` before committing
3. Ensure keyboard accessibility with `:focus-visible` styles
4. Add ARIA attributes for screen reader support
5. Test on multiple browsers and screen sizes

## Environment Variables

- `VITE_API_URL` - Backend API base URL (default: `http://localhost:3000/api`)

## License

ISC
