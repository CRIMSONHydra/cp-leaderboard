import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import SpaceInvitation from '../SpaceInvitation.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('SpaceInvitation model', () => {
  const spaceId = new mongoose.Types.ObjectId();
  const inviterId = new mongoose.Types.ObjectId();
  const inviteeId = new mongoose.Types.ObjectId();

  it('creates an invitation with defaults', async () => {
    const inv = await SpaceInvitation.create({
      space: spaceId,
      invitedBy: inviterId,
      invitedAccount: inviteeId
    });

    expect(inv.role).toBe('viewer');
    expect(inv.status).toBe('pending');
    expect(inv.createdAt).toBeInstanceOf(Date);
  });

  it('accepts admin role', async () => {
    const inv = await SpaceInvitation.create({
      space: spaceId,
      invitedBy: inviterId,
      invitedAccount: inviteeId,
      role: 'admin'
    });

    expect(inv.role).toBe('admin');
  });

  it('rejects invalid role', async () => {
    await expect(
      SpaceInvitation.create({
        space: spaceId,
        invitedBy: inviterId,
        invitedAccount: inviteeId,
        role: 'superadmin'
      })
    ).rejects.toThrow();
  });

  it('rejects invalid status', async () => {
    await expect(
      SpaceInvitation.create({
        space: spaceId,
        invitedBy: inviterId,
        invitedAccount: inviteeId,
        status: 'cancelled'
      })
    ).rejects.toThrow();
  });
});
