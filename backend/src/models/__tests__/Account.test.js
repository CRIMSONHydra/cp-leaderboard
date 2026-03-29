import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Account from '../Account.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('Account model', () => {
  it('creates an account and hashes the password', async () => {
    const account = await Account.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(account.username).toBe('testuser');
    expect(account.email).toBe('test@example.com');
    expect(account.password).not.toBe('password123');
    expect(account.password.startsWith('$2b$')).toBe(true);
    expect(account.refreshTokenVersion).toBe(0);
  });

  it('comparePassword returns true for correct password', async () => {
    const account = await Account.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(await account.comparePassword('password123')).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const account = await Account.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(await account.comparePassword('wrongpassword')).toBe(false);
  });

  it('lowercases email', async () => {
    const account = await Account.create({
      username: 'testuser',
      email: 'Test@Example.COM',
      password: 'password123'
    });

    expect(account.email).toBe('test@example.com');
  });

  it('trims username', async () => {
    const account = await Account.create({
      username: '  testuser  ',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(account.username).toBe('testuser');
  });

  it('rejects duplicate username', async () => {
    await Account.create({
      username: 'testuser',
      email: 'test1@example.com',
      password: 'password123'
    });

    await expect(
      Account.create({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123'
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('rejects duplicate email', async () => {
    await Account.create({
      username: 'user1',
      email: 'test@example.com',
      password: 'password123'
    });

    await expect(
      Account.create({
        username: 'user2',
        email: 'test@example.com',
        password: 'password123'
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('rejects missing required fields', async () => {
    await expect(Account.create({})).rejects.toThrow();
    await expect(Account.create({ username: 'a' })).rejects.toThrow();
    await expect(Account.create({ username: 'a', email: 'e@e.com' })).rejects.toThrow();
  });

  it('sets timestamps', async () => {
    const account = await Account.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(account.createdAt).toBeInstanceOf(Date);
    expect(account.updatedAt).toBeInstanceOf(Date);
  });
});
