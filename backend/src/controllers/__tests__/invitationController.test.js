import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Account from '../../models/Account.js';
import Space from '../../models/Space.js';
import SpaceInvitation from '../../models/SpaceInvitation.js';
import {
  sendInvitation, getMyInvitations, acceptInvitation,
  declineInvitation, getSpaceInvitations, cancelInvitation, searchAccounts
} from '../invitationController.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

function mockReqRes(body = {}, accountId, params = {}) {
  return {
    req: { body, params, query: {}, account: { id: accountId }, space: null },
    res: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  };
}

describe('invitationController', () => {
  let admin, invitee, space;

  async function setup() {
    admin = await Account.create({ username: 'admin', email: 'admin@test.com', password: 'password123' });
    invitee = await Account.create({ username: 'invitee', email: 'invitee@test.com', password: 'password123' });
    space = await Space.create({
      name: 'Test Space',
      owner: admin._id,
      members: [{ account: admin._id, role: 'admin' }],
      inviteCode: Space.generateInviteCode()
    });
  }

  describe('sendInvitation', () => {
    it('sends invitation to a valid account', async () => {
      await setup();
      const { req, res } = mockReqRes({ email: 'invitee@test.com', role: 'viewer' }, admin._id.toString());
      req.space = space;

      await sendInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('viewer');
    });

    it('rejects if account not found', async () => {
      await setup();
      const { req, res } = mockReqRes({ email: 'nobody@test.com' }, admin._id.toString());
      req.space = space;

      await sendInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('rejects if already a member', async () => {
      await setup();
      const { req, res } = mockReqRes({ email: 'admin@test.com' }, admin._id.toString());
      req.space = space;

      await sendInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('rejects duplicate pending invitation', async () => {
      await setup();
      const { req: req1, res: res1 } = mockReqRes({ email: 'invitee@test.com' }, admin._id.toString());
      req1.space = space;
      await sendInvitation(req1, res1);

      const { req: req2, res: res2 } = mockReqRes({ email: 'invitee@test.com' }, admin._id.toString());
      req2.space = space;
      await sendInvitation(req2, res2);

      expect(res2.status).toHaveBeenCalledWith(409);
    });
  });

  describe('acceptInvitation', () => {
    it('adds user to space and marks invitation accepted', async () => {
      await setup();
      const invitation = await SpaceInvitation.create({
        space: space._id,
        invitedBy: admin._id,
        invitedAccount: invitee._id,
        role: 'viewer'
      });

      const { req, res } = mockReqRes({}, invitee._id.toString(), { invitationId: invitation._id.toString() });
      await acceptInvitation(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);

      // Verify space membership
      const updatedSpace = await Space.findById(space._id);
      const member = updatedSpace.members.find(m => m.account.toString() === invitee._id.toString());
      expect(member).toBeTruthy();
      expect(member.role).toBe('viewer');

      // Verify invitation status
      const updatedInv = await SpaceInvitation.findById(invitation._id);
      expect(updatedInv.status).toBe('accepted');
    });

    it('rejects if invitation not found', async () => {
      await setup();
      const fakeId = new mongoose.Types.ObjectId().toString();
      const { req, res } = mockReqRes({}, invitee._id.toString(), { invitationId: fakeId });

      await acceptInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 for invalid ObjectId', async () => {
      await setup();
      const { req, res } = mockReqRes({}, invitee._id.toString(), { invitationId: 'not-an-id' });

      await acceptInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('declineInvitation', () => {
    it('updates status to declined', async () => {
      await setup();
      const invitation = await SpaceInvitation.create({
        space: space._id,
        invitedBy: admin._id,
        invitedAccount: invitee._id
      });

      const { req, res } = mockReqRes({}, invitee._id.toString(), { invitationId: invitation._id.toString() });
      await declineInvitation(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);

      const updated = await SpaceInvitation.findById(invitation._id);
      expect(updated.status).toBe('declined');
    });

    it('returns 404 for invalid ObjectId', async () => {
      await setup();
      const { req, res } = mockReqRes({}, invitee._id.toString(), { invitationId: 'garbage' });

      await declineInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getMyInvitations', () => {
    it('returns pending invitations for the user', async () => {
      await setup();
      await SpaceInvitation.create({
        space: space._id,
        invitedBy: admin._id,
        invitedAccount: invitee._id
      });

      const { req, res } = mockReqRes({}, invitee._id.toString());
      await getMyInvitations(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.data).toHaveLength(1);
      expect(body.data[0].status).toBe('pending');
    });
  });

  describe('getSpaceInvitations', () => {
    it('returns all invitations for a space', async () => {
      await setup();
      await SpaceInvitation.create({
        space: space._id,
        invitedBy: admin._id,
        invitedAccount: invitee._id,
        status: 'pending'
      });

      const other = await Account.create({ username: 'other', email: 'other@test.com', password: 'password123' });
      await SpaceInvitation.create({
        space: space._id,
        invitedBy: admin._id,
        invitedAccount: other._id,
        status: 'declined'
      });

      const { req, res } = mockReqRes({}, admin._id.toString(), { spaceId: space._id.toString() });
      req.space = space;
      await getSpaceInvitations(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.data).toHaveLength(2);
      const statuses = body.data.map(i => i.status);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('declined');
    });
  });

  describe('cancelInvitation', () => {
    it('deletes a pending invitation', async () => {
      await setup();
      const invitation = await SpaceInvitation.create({
        space: space._id,
        invitedBy: admin._id,
        invitedAccount: invitee._id
      });

      const { req, res } = mockReqRes({}, admin._id.toString(), {
        spaceId: space._id.toString(),
        invitationId: invitation._id.toString()
      });
      await cancelInvitation(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);

      const deleted = await SpaceInvitation.findById(invitation._id);
      expect(deleted).toBeNull();
    });

    it('returns 404 for non-existent invitation', async () => {
      await setup();
      const fakeId = new mongoose.Types.ObjectId().toString();
      const { req, res } = mockReqRes({}, admin._id.toString(), {
        spaceId: space._id.toString(),
        invitationId: fakeId
      });
      await cancelInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 for invalid ObjectId', async () => {
      await setup();
      const { req, res } = mockReqRes({}, admin._id.toString(), {
        spaceId: space._id.toString(),
        invitationId: 'bad-id'
      });
      await cancelInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('searchAccounts', () => {
    it('returns matching accounts excluding members and pending invitees', async () => {
      await setup();

      const stranger = await Account.create({ username: 'stranger', email: 'stranger@test.com', password: 'password123' });

      // Invitee has a pending invitation — should be excluded
      await SpaceInvitation.create({
        space: space._id,
        invitedBy: admin._id,
        invitedAccount: invitee._id
      });

      const { req, res } = mockReqRes({}, admin._id.toString(), { spaceId: space._id.toString() });
      req.space = space;
      req.query = { email: 'test.com' };
      await searchAccounts(req, res);

      const body = res.json.mock.calls[0][0];
      const emails = body.data.map(a => a.email);

      // admin is a member — excluded; invitee has pending invite — excluded; stranger should appear
      expect(emails).toContain('stranger@test.com');
      expect(emails).not.toContain('admin@test.com');
      expect(emails).not.toContain('invitee@test.com');
    });

    it('returns 400 for short query', async () => {
      await setup();
      const { req, res } = mockReqRes({}, admin._id.toString());
      req.space = space;
      req.query = { email: 'a' };
      await searchAccounts(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('does not return password field', async () => {
      await setup();
      await Account.create({ username: 'other', email: 'other@test.com', password: 'password123' });

      const { req, res } = mockReqRes({}, admin._id.toString());
      req.space = space;
      req.query = { email: 'other' };
      await searchAccounts(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.data[0].password).toBeUndefined();
      expect(body.data[0].username).toBe('other');
      expect(body.data[0].email).toBe('other@test.com');
    });
  });
});
