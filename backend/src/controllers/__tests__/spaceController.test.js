import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Space from '../../models/Space.js';
import Account from '../../models/Account.js';
import { createSpace, getMySpaces, joinSpace, leaveSpace, updateMemberRole, removeMember } from '../spaceController.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

function createMockReqRes(body = {}, accountId = new mongoose.Types.ObjectId().toString()) {
  return {
    req: { body, params: {}, account: { id: accountId } },
    res: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  };
}

describe('spaceController', () => {
  describe('createSpace', () => {
    it('creates a space and adds creator as admin', async () => {
      const accountId = new mongoose.Types.ObjectId().toString();
      const { req, res } = createMockReqRes({ name: 'My Space' }, accountId);

      await createSpace(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.data.name).toBe('My Space');
      expect(body.data.members).toHaveLength(1);
      expect(body.data.members[0].role).toBe('admin');
      expect(body.data.inviteCode).toBeTruthy();
    });

    it('rejects missing name', async () => {
      const { req, res } = createMockReqRes({});

      await createSpace(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getMySpaces', () => {
    it('returns only spaces where user is a member', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherId = new mongoose.Types.ObjectId();

      // Create account for population
      const account = await Account.create({
        _id: userId,
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });

      await Space.create({
        name: 'My Space',
        owner: userId,
        members: [{ account: userId, role: 'admin' }],
        inviteCode: Space.generateInviteCode()
      });

      await Space.create({
        name: 'Other Space',
        owner: otherId,
        members: [{ account: otherId, role: 'admin' }],
        inviteCode: Space.generateInviteCode()
      });

      const { req, res } = createMockReqRes({}, userId.toString());
      await getMySpaces(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('My Space');
      expect(body.data[0].myRole).toBe('admin');
    });
  });

  describe('joinSpace', () => {
    it('joins a space with valid invite code', async () => {
      const ownerId = new mongoose.Types.ObjectId().toString();
      const joinerId = new mongoose.Types.ObjectId().toString();

      const space = await Space.create({
        name: 'Test',
        owner: ownerId,
        members: [{ account: ownerId, role: 'admin' }],
        inviteCode: 'abc12345'
      });

      const { req, res } = createMockReqRes({ inviteCode: 'abc12345' }, joinerId);
      await joinSpace(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('viewer');

      const updated = await Space.findById(space._id);
      expect(updated.members).toHaveLength(2);
    });

    it('rejects invalid invite code', async () => {
      const { req, res } = createMockReqRes({ inviteCode: 'nonexistent' });
      await joinSpace(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('rejects if already a member', async () => {
      const ownerId = new mongoose.Types.ObjectId().toString();

      await Space.create({
        name: 'Test',
        owner: ownerId,
        members: [{ account: ownerId, role: 'admin' }],
        inviteCode: 'abc12345'
      });

      const { req, res } = createMockReqRes({ inviteCode: 'abc12345' }, ownerId);
      await joinSpace(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('leaveSpace', () => {
    it('allows non-owner to leave', async () => {
      const ownerId = new mongoose.Types.ObjectId().toString();
      const viewerId = new mongoose.Types.ObjectId().toString();

      const space = await Space.create({
        name: 'Test',
        owner: ownerId,
        members: [
          { account: ownerId, role: 'admin' },
          { account: viewerId, role: 'viewer' }
        ],
        inviteCode: Space.generateInviteCode()
      });

      const { req, res } = createMockReqRes({}, viewerId);
      req.space = space;
      req.spaceMembership = { role: 'viewer' };
      await leaveSpace(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    it('prevents owner from leaving', async () => {
      const ownerId = new mongoose.Types.ObjectId().toString();

      const space = await Space.create({
        name: 'Test',
        owner: ownerId,
        members: [{ account: ownerId, role: 'admin' }],
        inviteCode: Space.generateInviteCode()
      });

      const { req, res } = createMockReqRes({}, ownerId);
      req.space = space;
      await leaveSpace(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
