// This is a local UI demo, not an authentication or authorization boundary.
type Account = { username: string; salt: string; hash: string }
const storageKey = 'tv-explorer-demo-accounts-v1'

// HTTP on a phone's LAN address does not expose the Web Crypto API.
function requirePasswordCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Log in and sign up require a secure connection. Open VivTV using HTTPS, or use localhost on your computer. You can still browse shows here.')
  }
}

// Reject malformed records instead of overwriting accounts that cannot be read.
function readAccounts(): Account[] {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return []
  const data: unknown = JSON.parse(raw)
  if (!Array.isArray(data) || !data.every(a => typeof a?.username === 'string'
    && /^[0-9a-f]{32}$/.test(a.salt) && /^[0-9a-f]{64}$/.test(a.hash))) {
    throw new Error('Local account data could not be read.')
  }
  return data
}

// Store binary salts and hashes as ordinary JSON strings.
function toHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Derive a salted hash with the browser API; the password itself is never persisted.
async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bytes = Uint8Array.from(salt.match(/../g)!, part => parseInt(part, 16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes, iterations: 210000 }, key, 256)
  return toHex(new Uint8Array(bits))
}

// Normalize usernames and save only the salt and derived hash.
export async function createDemoAccount(username: string, password: string) {
  requirePasswordCrypto()
  const name = username.trim().toLowerCase()
  if (!/^[a-z0-9_-]{3,24}$/.test(name)) throw new Error('Use 3–24 letters, numbers, underscores or hyphens for your username.')
  if (password.length < 8 || password.length > 128) throw new Error('Use a password between 8 and 128 characters.')
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const hash = await hashPassword(password, salt)
  const accounts = readAccounts()
  if (accounts.some(account => account.username === name)) throw new Error('That username already exists in this browser.')
  localStorage.setItem(storageKey, JSON.stringify([...accounts, { username: name, salt, hash }]))
  return name
}

// Compare a newly derived hash with the stored record for this username.
export async function signInDemoAccount(username: string, password: string) {
  requirePasswordCrypto()
  const account = readAccounts().find(a => a.username === username.trim().toLowerCase())
  if (!account || await hashPassword(password, account.salt) !== account.hash) throw new Error('Username or password is incorrect.')
  return account.username
}
