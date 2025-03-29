/**
 * Cryptographic utilities for anonymous contributions
 */

import { encode as encodeBase64 } from "std/encoding/base64.ts";

/**
 * Generate a secure anonymous ID that cannot be traced back to the user
 * @returns A secure anonymous ID
 */
export function generateAnonymousId(): string {
  // Generate a random 32-byte buffer
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  
  // Convert to base64 and remove non-alphanumeric characters
  return encodeBase64(buffer)
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 24);
}

/**
 * Hash sensitive data to ensure privacy
 * @param data The data to hash
 * @returns A hash of the data
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Use SHA-256 for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert to hex string
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt data with a provided key
 * @param data The data to encrypt
 * @param key The encryption key
 * @returns The encrypted data
 */
export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate a random IV
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  
  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    dataBuffer
  );
  
  // Combine IV and encrypted data
  const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Return as base64
  return encodeBase64(result);
}

/**
 * Generate an encryption key from a password
 * @param password The password to derive the key from
 * @returns A CryptoKey
 */
export async function generateKeyFromPassword(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Generate a salt
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  
  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the actual key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}