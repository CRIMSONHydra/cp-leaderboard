import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import User from '../../models/User.js';
import { updateUser } from '../userController.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

function mockReqRes(params = {}, body = {}) {
  return {
    req: { params, body },
    res: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  };
}

describe('userController.updateUser', () => {
  it('updates handles on an existing user', async () => {
    const user = await User.create({
      name: 'Test User',
      handles: { codeforces: 'old_handle', atcoder: null, leetcode: null, codechef: null }
    });

    const { req, res } = mockReqRes(
      { userId: user._id.toString() },
      { handles: { codeforces: 'new_handle' } }
    );

    await updateUser(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.handles.codeforces).toBe('new_handle');
  });

  it('clears a handle when set to null', async () => {
    const user = await User.create({
      name: 'Test User',
      handles: { codeforces: 'my_handle', atcoder: null, leetcode: null, codechef: null }
    });

    const { req, res } = mockReqRes(
      { userId: user._id.toString() },
      { handles: { codeforces: null } }
    );

    await updateUser(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.handles.codeforces).toBeNull();
  });

  it('leaves unchanged handles untouched', async () => {
    const user = await User.create({
      name: 'Test User',
      handles: { codeforces: 'keep_this', atcoder: 'also_keep', leetcode: null, codechef: null }
    });

    const { req, res } = mockReqRes(
      { userId: user._id.toString() },
      { handles: { codeforces: 'changed' } }
    );

    await updateUser(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.data.handles.codeforces).toBe('changed');
    expect(body.data.handles.atcoder).toBe('also_keep');
  });

  it('returns 404 for non-existent user', async () => {
    const { req, res } = mockReqRes(
      { userId: '507f1f77bcf86cd799439011' },
      { handles: { codeforces: 'test' } }
    );

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for missing handles', async () => {
    const user = await User.create({
      name: 'Test User',
      handles: { codeforces: null, atcoder: null, leetcode: null, codechef: null }
    });

    const { req, res } = mockReqRes({ userId: user._id.toString() }, {});

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid user ID format', async () => {
    const { req, res } = mockReqRes(
      { userId: 'not-an-id' },
      { handles: { codeforces: 'test' } }
    );

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
