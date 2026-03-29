import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Space from '../Space.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('Space model', () => {
  const ownerId = new mongoose.Types.ObjectId();

  it('creates a space with members', async () => {
    const space = await Space.create({
      name: 'Test Space',
      owner: ownerId,
      members: [{ account: ownerId, role: 'admin' }],
      inviteCode: Space.generateInviteCode()
    });

    expect(space.name).toBe('Test Space');
    expect(space.members).toHaveLength(1);
    expect(space.members[0].role).toBe('admin');
    expect(space.isActive).toBe(true);
  });

  it('generates unique invite codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(Space.generateInviteCode());
    }
    // Very unlikely to have duplicates in 100 random 8-char hex strings
    expect(codes.size).toBeGreaterThan(90);
  });

  it('trims name and description', async () => {
    const space = await Space.create({
      name: '  Test Space  ',
      description: '  Some desc  ',
      owner: ownerId,
      members: [{ account: ownerId, role: 'admin' }],
      inviteCode: Space.generateInviteCode()
    });

    expect(space.name).toBe('Test Space');
    expect(space.description).toBe('Some desc');
  });

  it('defaults description to empty string', async () => {
    const space = await Space.create({
      name: 'Test',
      owner: ownerId,
      members: [{ account: ownerId, role: 'admin' }],
      inviteCode: Space.generateInviteCode()
    });

    expect(space.description).toBe('');
  });

  it('rejects missing name', async () => {
    await expect(
      Space.create({
        owner: ownerId,
        members: [{ account: ownerId, role: 'admin' }]
      })
    ).rejects.toThrow();
  });

  it('rejects invalid member roles', async () => {
    await expect(
      Space.create({
        name: 'Test',
        owner: ownerId,
        members: [{ account: ownerId, role: 'superadmin' }],
        inviteCode: Space.generateInviteCode()
      })
    ).rejects.toThrow();
  });
});
