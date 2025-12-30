#!/usr/bin/env node
/**
 * Validation script to ensure platform constants are consistent
 * across frontend and backend.
 * 
 * This script verifies that:
 * 1. Frontend imports from shared constants
 * 2. Backend imports from shared constants  
 * 3. No local duplicates of PLATFORMS array exist
 * 
 * Run: node scripts/validate-constants.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let hasErrors = false;

/**
 * Print a message to stdout wrapped with the specified ANSI color sequence.
 * @param {string} message - The text to print.
 * @param {string} [color='reset'] - The color key to apply; one of `green`, `red`, `yellow`, or `reset`.
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Validate a single file to ensure platform constants are imported from shared/constants.js when required.
 *
 * Reads the file at the given relative path and checks for a local `PLATFORMS` definition and for an import from `shared/constants.js`. When `shouldImportFromShared` is true, logs a success message if the file imports from shared constants; otherwise logs errors and marks the module-level `hasErrors` flag when a local definition is present or the shared import is missing.
 *
 * @param {string} filePath - Path to the target file, relative to the repository root.
 * @param {boolean} shouldImportFromShared - If true, enforce that the file imports `PLATFORMS` from `shared/constants.js` rather than defining it locally.
 */
function checkFile(filePath, shouldImportFromShared) {
  try {
    const content = readFileSync(join(rootDir, filePath), 'utf-8');
    const fileName = filePath.split('/').pop();
    
    // Check for local PLATFORMS definition
    const hasLocalPlatforms = /(?:const|let|var)\s+PLATFORMS\s*=\s*\[/.test(content);
    
    // Check for import from shared
    const importsFromShared = /from\s+['"].*shared\/constants\.js['"]/.test(content);
    
    if (shouldImportFromShared) {
      if (hasLocalPlatforms) {
        log(`✗ ${filePath}: Contains local PLATFORMS definition (should import from shared)`, 'red');
        hasErrors = true;
      } else if (!importsFromShared) {
        log(`✗ ${filePath}: Does not import from shared/constants.js`, 'red');
        hasErrors = true;
      } else {
        log(`✓ ${filePath}: Correctly imports from shared constants`, 'green');
      }
    }
  } catch (error) {
    log(`✗ Error reading ${filePath}: ${error.message}`, 'red');
    hasErrors = true;
  }
}

// Main validation
console.log('\n🔍 Validating platform constants...\n');

// Check that shared constants file exists
try {
  readFileSync(join(rootDir, 'shared/constants.js'), 'utf-8');
  log('✓ shared/constants.js exists', 'green');
} catch (error) {
  log('✗ shared/constants.js not found!', 'red');
  hasErrors = true;
  process.exit(1);
}

// Check frontend
checkFile('frontend/src/constants/platforms.js', true);

// Check backend
checkFile('backend/src/services/ratingUpdater.js', true);

// Check for any other files that might have duplicated the array
const filesToCheck = [
  'backend/src/controllers/userController.js',
  'backend/src/controllers/updateController.js',
  'frontend/src/pages/UserProfilePage.jsx',
  'frontend/src/components/Leaderboard/LeaderboardTable.jsx',
  'frontend/src/components/Leaderboard/LeaderboardRow.jsx'
];

filesToCheck.forEach(file => {
  try {
    const content = readFileSync(join(rootDir, file), 'utf-8');
    const hasLocalPlatforms = /(?:const|let|var)\s+PLATFORMS\s*=\s*\[/.test(content);
    
    if (hasLocalPlatforms) {
      log(`⚠ ${file}: Contains local PLATFORMS definition`, 'yellow');
      log(`  Consider importing from shared/constants.js instead`, 'yellow');
    }
  } catch (error) {
    // File might not exist, skip silently
  }
});

// Final result
console.log();
if (hasErrors) {
  log('❌ Validation failed! Platform constants are not consistent.', 'red');
  process.exit(1);
} else {
  log('✅ All platform constants are consistent!', 'green');
  process.exit(0);
}
