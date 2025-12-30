/**
 * Encoding utilities for the frontend
 * Provides Unicode-safe Base64 encoding for modern browsers
 */

/**
 * Encode a Unicode string to a Base64 string.
 *
 * Encodes the given string as UTF-8 and returns its Base64 representation,
 * handling characters outside the Latin1 range.
 *
 * @param {string} str - Input string, may contain Unicode characters.
 * @returns {string} The Base64-encoded representation of the input string.
 * @throws {Error} If TextEncoder is unavailable or encoding fails.
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
 * Decode a Base64-encoded string into a Unicode (UTF-8) string.
 *
 * Requires a browser environment with TextDecoder and atob available.
 *
 * @param {string} base64 - The Base64-encoded input.
 * @returns {string} The decoded Unicode string.
 * @throws {Error} If TextDecoder is not available or if decoding fails.
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
