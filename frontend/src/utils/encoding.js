/**
 * Encoding utilities for the frontend
 * Provides Unicode-safe Base64 encoding for modern browsers
 */

/**
 * Safely encode a string to base64, handling Unicode characters
 * 
 * Browser Requirements:
 * - Requires TextEncoder API (available in all modern browsers)
 * - Chrome 38+, Firefox 18+, Safari 10.1+, Edge 12+, Opera 25+
 * - For older browsers, use a polyfill: https://github.com/inexorabletash/text-encoding
 * 
 * Why this is needed:
 * - JavaScript's built-in btoa() only handles Latin1 (ISO-8859-1) characters
 * - Attempting to encode Unicode characters directly with btoa() throws an error
 * - TextEncoder converts strings to UTF-8 bytes, which we then encode to Base64
 * - This is essential for Basic Auth with non-ASCII usernames/passwords
 * 
 * @param {string} str - String to encode (may contain Unicode characters)
 * @returns {string} Base64 encoded string
 * @throws {Error} If TextEncoder is not available or encoding fails
 * 
 * @example
 * safeBase64Encode('hello'); // 'aGVsbG8='
 * safeBase64Encode('user:пароль'); // Works with Cyrillic
 * safeBase64Encode('用户:密码'); // Works with Chinese
 */
export function safeBase64Encode(str) {
  // Check for TextEncoder support
  if (typeof TextEncoder === 'undefined') {
    throw new Error(
      'TextEncoder is not available in this browser. ' +
      'Please upgrade to a modern browser (Chrome 38+, Firefox 18+, Safari 10.1+, Edge 12+) ' +
      'or include a TextEncoder polyfill: https://github.com/inexorabletash/text-encoding'
    );
  }

  try {
    // Use TextEncoder to convert string to UTF-8 bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    
    // Convert Uint8Array to binary string for btoa
    // We must go through binary string because btoa expects Latin1 encoding
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  } catch (error) {
    throw new Error(`Failed to encode string to base64: ${error.message}`);
  }
}

/**
 * Safely decode a base64 string to a Unicode string
 * 
 * Browser Requirements:
 * - Requires TextDecoder API (available in all modern browsers)
 * - Same browser support as TextEncoder
 * 
 * @param {string} base64 - Base64 encoded string
 * @returns {string} Decoded Unicode string
 * @throws {Error} If TextDecoder is not available or decoding fails
 * 
 * @example
 * safeBase64Decode('aGVsbG8='); // 'hello'
 */
export function safeBase64Decode(base64) {
  // Check for TextDecoder support
  if (typeof TextDecoder === 'undefined') {
    throw new Error(
      'TextDecoder is not available in this browser. ' +
      'Please upgrade to a modern browser or include a TextDecoder polyfill.'
    );
  }

  try {
    // Decode base64 to binary string
    const binary = atob(base64);
    
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Use TextDecoder to convert UTF-8 bytes to string
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (error) {
    throw new Error(`Failed to decode base64 string: ${error.message}`);
  }
}

