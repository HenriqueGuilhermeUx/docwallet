/**
 * Browser-compatible crypto utilities
 * Uses crypto-browserify for Node.js compatibility
 */

import { createHash as nodeCreateHash } from 'crypto-browserify';

export function createHash(algorithm: string) {
  return nodeCreateHash(algorithm);
}
