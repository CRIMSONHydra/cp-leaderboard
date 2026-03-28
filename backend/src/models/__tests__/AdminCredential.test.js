import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import AdminCredential from '../AdminCredential.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('AdminCredential model', () => {
  it('creates a credential and hashes the password', async () => {
    const cred = await AdminCredential.create({
      username: 'admin',
      password: 'testpassword'
    });

    expect(cred.username).toBe('admin');
    expect(cred.password).not.toBe('testpassword');
    expect(cred.password.startsWith('$2b$')).toBe(true);
  });

  it('comparePassword returns true for correct password', async () => {
    const cred = await AdminCredential.create({
      username: 'admin',
      password: 'testpassword'
    });

    expect(await cred.comparePassword('testpassword')).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const cred = await AdminCredential.create({
      username: 'admin',
      password: 'testpassword'
    });

    expect(await cred.comparePassword('wrongpassword')).toBe(false);
  });

  it('rejects missing username', async () => {
    await expect(
      AdminCredential.create({ password: 'testpassword' })
    ).rejects.toThrow(/username/i);
  });

  it('rejects missing password', async () => {
    await expect(
      AdminCredential.create({ username: 'admin' })
    ).rejects.toThrow(/password/i);
  });

  it('rejects duplicate username', async () => {
    await AdminCredential.create({ username: 'admin', password: 'password1' });

    await expect(
      AdminCredential.create({ username: 'admin', password: 'password2' })
    ).rejects.toThrow();
  });

  it('trims whitespace from username', async () => {
    const cred = await AdminCredential.create({
      username: '  admin  ',
      password: 'testpassword'
    });

    expect(cred.username).toBe('admin');
  });

  it('sets createdAt and updatedAt timestamps', async () => {
    const cred = await AdminCredential.create({
      username: 'admin',
      password: 'testpassword'
    });

    expect(cred.createdAt).toBeInstanceOf(Date);
    expect(cred.updatedAt).toBeInstanceOf(Date);
  });
});
