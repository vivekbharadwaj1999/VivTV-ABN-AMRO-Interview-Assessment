import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createDemoAccount, signInDemoAccount } from '../../src/utils/demoAccounts'

beforeEach(() => { localStorage.clear(); vi.stubGlobal('crypto', webcrypto) })
afterEach(() => { localStorage.clear(); vi.unstubAllGlobals() })

it('explains unavailable secure-context crypto without storing an account', async () => {
  vi.stubGlobal('crypto', {})
  await expect(createDemoAccount('alice', 'demo-password')).rejects.toThrow('require a secure connection')
  await expect(signInDemoAccount('alice', 'demo-password')).rejects.toThrow('require a secure connection')
  expect(localStorage.getItem('tv-explorer-demo-accounts-v1')).toBeNull()
})

it('stores salted hashes, normalizes names and verifies sign-in', async () => {
  await createDemoAccount(' Alice ', 'demo-password')
  await createDemoAccount('bob', 'demo-password')
  const raw = localStorage.getItem('tv-explorer-demo-accounts-v1')!
  expect(raw).not.toContain('demo-password')
  const accounts = JSON.parse(raw)
  expect(accounts[0].hash).not.toBe(accounts[1].hash)
  expect(await signInDemoAccount('ALICE', 'demo-password')).toBe('alice')
  await expect(signInDemoAccount('alice', 'wrong-password')).rejects.toThrow('incorrect')
  await expect(createDemoAccount('Alice', 'demo-password')).rejects.toThrow('already exists')
})

it('rejects invalid input and reports corrupt storage without overwriting it', async () => {
  await expect(createDemoAccount('a', 'demo-password')).rejects.toThrow('3–24')
  await expect(createDemoAccount('alice', 'short')).rejects.toThrow('8 and 128')
  localStorage.setItem('tv-explorer-demo-accounts-v1', '{}')
  await expect(signInDemoAccount('alice', 'demo-password')).rejects.toThrow('could not be read')
  expect(localStorage.getItem('tv-explorer-demo-accounts-v1')).toBe('{}')
})
