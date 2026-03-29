import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Account from '../../models/Account.js';
import Space from '../../models/Space.js';
import SpaceInvitation from '../../models/SpaceInvitation.js';
import { sendInvitation, getMyInvitations, acceptInvitation, declineInvitation } from '../invitationController.js';

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
    req: { body, params, account: { id: accountId }, space: null },
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
      // First invite
      const { req: req1, res: res1 } = mockReqRes({ email: 'invitee@test.com' }, admin._id.toString());
      req1.space = space;
      await sendInvitation(req1, res1);

      // Second invite
      const { req: req2, res: res2 } = mockReqRes({ email: 'invitee@test.com' }, admin._id.toString());
      req2.space = space;
      await sendInvitation(req2, res2);

      expect(res2.status).toHaveBeenCalledWith(409);
    });
  });

  describe('acceptInvitation', () => {
    it('adds user to space on accept', async () => {
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

      const updated = await Space.findById(space._id);
      const member = updated.members.find(m => m.account.toString() === invitee._id.toString());
      expect(member).toBeTruthy();
      expect(member.role).toBe('viewer');
    });

    it('rejects if invitation not found', async () => {
      await setup();
      const fakeId = new mongoose.Types.ObjectId().toString();
      const { req, res } = mockReqRes({}, invitee._id.toString(), { invitationId: fakeId });

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
});
