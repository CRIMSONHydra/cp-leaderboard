/**
 * Safely encode a string to base64, handling Unicode characters
 * Uses TextEncoder for modern browsers, falls back to polyfill for older environments
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 * @throws {Error} If encoding fails
 */
function safeBase64Encode(str) {
  try {
    // Modern browsers: Use TextEncoder to convert string to UTF-8 bytes
    if (typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      // Convert Uint8Array to binary string for btoa
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    
    // Fallback for older environments: use encodeURIComponent polyfill
    // This converts Unicode characters to UTF-8 byte sequences
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    throw new Error(`Failed to encode string to base64: ${error.message}`);
  }
}

/**
 * Encode username and password to base64 for Basic Authentication
 * Safely handles Unicode characters in username/password
 * @param {string} username - Username (must be non-empty string)
 * @param {string} password - Password (must be non-empty string)
 * @returns {string} Base64 encoded credentials
 * @throws {Error} If validation fails or encoding fails
 */
export function encodeBasicAuth(username, password) {
  // Input validation
  if (typeof username !== 'string' || username.trim().length === 0) {
    throw new Error('Username must be a non-empty string');
  }
  
  if (typeof password !== 'string' || password.trim().length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  
  try {
    const credentials = `${username}:${password}`;
    return safeBase64Encode(credentials);
  } catch (error) {
    // Re-throw with more context if it's already our error, otherwise wrap it
    if (error.message.startsWith('Failed to encode') || error.message.includes('must be')) {
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

