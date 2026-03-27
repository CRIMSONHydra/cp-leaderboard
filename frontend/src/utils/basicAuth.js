import { safeBase64Encode } from './encoding.js';

/**
 * Encode username and password to base64 for Basic Authentication
 * Safely handles Unicode characters in username/password
 * 
 * Security Note:
 * - Usernames and passwords must NOT contain colon ':' characters
 * - Colons are used as separators in Basic Auth format (username:password)
 * - This validation provides defense-in-depth alongside backend validation
 * 
 * @param {string} username - Username (must be non-empty, no colons)
 * @param {string} password - Password (must be non-empty, no colons)
 * @returns {string} Base64 encoded credentials
 * @throws {Error} If validation fails (empty strings, contains colons) or encoding fails
 */
export function encodeBasicAuth(username, password) {
  // Input validation
  if (typeof username !== 'string' || username.trim().length === 0) {
    throw new Error('Username must be a non-empty string');
  }
  
  if (typeof password !== 'string' || password.trim().length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  
  // Defense-in-depth: Reject colons in credentials
  // Colons are used as separators in Basic Auth (username:password)
  if (username.includes(':')) {
    throw new Error("Username must not contain ':'");
  }
  
  if (password.includes(':')) {
    throw new Error("Password must not contain ':'");
  }
  
  try {
    const credentials = `${username}:${password}`;
    return safeBase64Encode(credentials);
  } catch (error) {
    // Re-throw with more context if it's already our error, otherwise wrap it
    if (error.message.startsWith('Failed to encode') || error.message.includes('must')) {
      throw error;
    }
    throw new Error(`Failed to encode Basic Auth credentials: ${error.message}`);
  }
}

/**
 * Create Authorization header value for Basic Auth
 * @param {string} username
 * @param {string} password
 * @returns {string} Authorization header value
 */
export function createAuthHeader(username, password) {
  return `Basic ${encodeBasicAuth(username, password)}`;
}

