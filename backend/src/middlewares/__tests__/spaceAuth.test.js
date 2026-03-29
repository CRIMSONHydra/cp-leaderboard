import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Space from '../../models/Space.js';
import { requireSpaceRole } from '../spaceAuth.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

function createMockReqRes(accountId, spaceId) {
  return {
    req: { account: { id: accountId }, params: { spaceId } },
    res: { status: vi.fn().mockReturnThis(), json: vi.fn() },
    next: vi.fn()
  };
}

describe('spaceAuth middleware', () => {
  const adminId = new mongoose.Types.ObjectId().toString();
  const viewerId = new mongoose.Types.ObjectId().toString();
  const outsiderId = new mongoose.Types.ObjectId().toString();

  let space;

  beforeAll(async () => {
    // Note: connectTestDB already called, but we need space for each test
  });

  async function createTestSpace() {
    return Space.create({
      name: 'Test',
      owner: adminId,
      members: [
        { account: adminId, role: 'admin' },
        { account: viewerId, role: 'viewer' }
      ],
      inviteCode: Space.generateInviteCode()
    });
  }

  it('allows admin through admin-required route', async () => {
    const space = await createTestSpace();
    const { req, res, next } = createMockReqRes(adminId, space._id.toString());
    const middleware = requireSpaceRole('admin');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.space).toBeDefined();
  });

  it('blocks viewer from admin-required route', async () => {
    const space = await createTestSpace();
    const { req, res, next } = createMockReqRes(viewerId, space._id.toString());
    const middleware = requireSpaceRole('admin');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows viewer through viewer-allowed route', async () => {
    const space = await createTestSpace();
    const { req, res, next } = createMockReqRes(viewerId, space._id.toString());
    const middleware = requireSpaceRole('admin', 'viewer');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 for non-member', async () => {
    const space = await createTestSpace();
    const { req, res, next } = createMockReqRes(outsiderId, space._id.toString());
    const middleware = requireSpaceRole('admin', 'viewer');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 for non-existent space', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { req, res, next } = createMockReqRes(adminId, fakeId);
    const middleware = requireSpaceRole('admin');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
