/**
 * Encode username and password to base64 for Basic Authentication
 * @param {string} username
 * @param {string} password
 * @returns {string} Base64 encoded credentials
 */
export function encodeBasicAuth(username, password) {
  const credentials = `${username}:${password}`;
  return btoa(credentials);
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

