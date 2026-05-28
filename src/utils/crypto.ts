/**
 * Browser-compatible crypto utilities
 * Provides both sync and async hash interfaces
 */

// Pre-computed lookup tables for faster sync operations
const HEX_CHARS = '0123456789abcdef';

function bytesToHex(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += HEX_CHARS[bytes[i] >> 4] + HEX_CHARS[bytes[i] & 15];
  }
  return result;
}

function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

// Browser-compatible hash function
export function createHash(algorithm: string) {
  let data: Uint8Array[] = [];

  return {
    update: (input: Uint8Array | string): typeof this => {
      if (typeof input === 'string') {
        data.push(stringToBytes(input));
      } else {
        data.push(input);
      }
      return this;
    },
    digest: (encoding?: string): Uint8Array | string | Promise<string> => {
      // Combine all data
      const totalLength = data.reduce((sum, arr) => sum + arr.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of data) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Handle different encodings
      if (encoding === 'hex') {
        return bytesToHex(combined);
      }
      if (encoding === undefined) {
        return combined;
      }

      throw new Error(`Unsupported encoding: ${encoding}`);
    },
    // Store combined data for async digest
    _getCombined: () => {
      const totalLength = data.reduce((sum, arr) => sum + arr.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of data) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      return combined;
    }
  };
}

// Async SHA-256 hash for browser
export async function sha256hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// Sync version using simple non-cryptographic hash (for IDs only)
// WARNING: Not cryptographically secure, only for generating ID patterns
export function syncHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  hash >>>= 0; // Convert to unsigned 32-bit
  return hash.toString(16).padStart(8, '0');
}
