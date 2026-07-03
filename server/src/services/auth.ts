import crypto from 'crypto';
import { getDb } from '../db/index.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

// Dashboard authentication: email + password accounts with opaque session
// tokens. Distinct from the unified API key, which authenticates the /v1 proxy
// for apps — this gates the /api/* admin surface for the human operator (#35).

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  userId: number;
  email: string;
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function userCount(): Promise<number> {
  const row = await getDb().prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number | string };
  return Number(row.c);
}

/** Create a user. Throws { code: 'email_taken' } if the email already exists. */
export async function createUser(email: string, password: string): Promise<SessionUser> {
  const db = getDb();
  const normalized = normalizeEmail(email);
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (existing) {
    const err = new Error('An account with that email already exists') as any;
    err.code = 'email_taken';
    throw err;
  }
  const result = await db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id')
      .run(normalized, hashPassword(password));
  return { userId: Number(result.lastInsertRowid), email: normalized };
}

/** Verify credentials. Returns the user on success, null on failure. */
export async function verifyCredentials(email: string, password: string): Promise<SessionUser | null> {
  const db = getDb();
  const row = await db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .get(normalizeEmail(email)) as { id: number; email: string; password_hash: string } | undefined;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return { userId: row.id, email: row.email };
}

/** Mint a session and return the raw token (only the hash is persisted). */
export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await getDb().prepare('INSERT INTO sessions (token_hash, user_id, expires_at_ms) VALUES (?, ?, ?)')
        .run(sha256(token), userId, Date.now() + SESSION_TTL_MS);
  return token;
}

/** Resolve a session token to its user, or null if missing/expired. */
export async function validateSession(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const db = getDb();
  const row = await db.prepare(`
    SELECT s.user_id, s.expires_at_ms, u.email
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(sha256(token)) as { user_id: number; expires_at_ms: number; email: string } | undefined;
  if (!row) return null;
  if (row.expires_at_ms < Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    return null;
  }
  return { userId: row.user_id, email: row.email };
}

export async function deleteSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}
