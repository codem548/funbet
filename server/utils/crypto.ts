import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * ————— PASSWORD HASHING —————
 */

/**
 * Hash a password using bcrypt.
 * @param password Plain-text password
 * @param rounds Cost factor (default: from env, min 10)
 * @returns Hashed password
 */
export async function hashPassword(password: string, rounds?: number): Promise<string> {
  const saltRounds = rounds || env.BCRYPT_ROUNDS || 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash.
 * @param password Plain-text password
 * @param hash Bcrypt hash
 * @returns True if valid
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    logger.warn({ err }, 'Password verification failed - likely malformed hash');
    return false;
  }
}

/**
 * ————— JWT TOKEN MANAGEMENT —————
 */

export interface JwtPayloadExtended extends JwtPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  type: 'access' | 'refresh';
}

/**
 * Generate a signed JWT access token (15 min).
 */
export function generateAccessToken(userId: string, username: string, isAdmin: boolean): string {
  return jwt.sign(
    { userId, username, isAdmin, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256', jwtid: generateId() }
  );
}

/**
 * Generate a signed JWT refresh token (30 days).
 */
export function generateRefreshToken(userId: string, username: string, isAdmin: boolean): string {
  return jwt.sign(
    { userId, username, isAdmin, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN, algorithm: 'HS256', jwtid: generateId() }
  );
}

/**
 * Verify a JWT token. Returns payload or null.
 */
export function verifyToken(token: string): JwtPayloadExtended | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayloadExtended;
  } catch (err) {
    return null;
  }
}

/**
 * Generate a secure random ID (UUID v4 style).
 */
export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Generate a secure numeric OTP (6 digits).
 */
export function generateOtp(length: number = 6): string {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate a provably-fair server seed.
 */
export function generateServerSeed(length: number = 64): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate a client seed.
 */
export function generateClientSeed(): string {
  return Math.random().toString(36).substring(2, 18);
}
