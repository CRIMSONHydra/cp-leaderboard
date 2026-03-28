import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import { bootstrapCredential, createCredential, verifyAuth } from '../adminController.js';
import AdminCredential from '../../models/AdminCredential.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
  delete process.env.BOOTSTRAP_SECRET;
});

function createReq(body = {}, headers = {}) {
  return { body, headers };
}

function createRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    }
  };
  return res;
}

describe('bootstrapCredential', () => {
  it('returns 403 when BOOTSTRAP_SECRET not set', async () => {
    const res = createRes();
    await bootstrapCredential(createReq(), res);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('BOOTSTRAP_SECRET');
  });

  it('returns 401 for wrong secret', async () => {
    process.env.BOOTSTRAP_SECRET = 'correct-secret';
    const req = createReq({}, { 'x-bootstrap-secret': 'wrong-secret' });
    const res = createRes();
    await bootstrapCredential(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when admins already exist', async () => {
    process.env.BOOTSTRAP_SECRET = 'secret';
    await AdminCredential.create({ username: 'existing', password: 'password123' });

    const req = createReq(
      { username: 'newadmin', password: 'password123' },
      { 'x-bootstrap-secret': 'secret' }
    );
    const res = createRes();
    await bootstrapCredential(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('already exist');
  });

  it('returns 400 for short username', async () => {
    process.env.BOOTSTRAP_SECRET = 'secret';
    const req = createReq(
      { username: 'ab', password: 'password123' },
      { 'x-bootstrap-secret': 'secret' }
    );
    const res = createRes();
    await bootstrapCredential(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('at least 3');
  });

  it('returns 400 for short password', async () => {
    process.env.BOOTSTRAP_SECRET = 'secret';
    const req = createReq(
      { username: 'admin', password: 'short' },
      { 'x-bootstrap-secret': 'secret' }
    );
    const res = createRes();
    await bootstrapCredential(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('at least 8');
  });

  it('creates admin and returns 201 on success', async () => {
    process.env.BOOTSTRAP_SECRET = 'secret';
    const req = createReq(
      { username: 'admin', password: 'securepassword' },
      { 'x-bootstrap-secret': 'secret' }
    );
    const res = createRes();
    await bootstrapCredential(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('admin');

    // Verify password is hashed in DB
    const saved = await AdminCredential.findOne({ username: 'admin' });
    expect(saved.password).not.toBe('securepassword');
    expect(saved.password.startsWith('$2b$')).toBe(true);
  });
});

describe('createCredential', () => {
  it('returns 400 for missing username', async () => {
    const req = createReq({ password: 'password123' });
    const res = createRes();
    await createCredential(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for password with colon', async () => {
    const req = createReq({ username: 'admin', password: 'pass:word' });
    const res = createRes();
    await createCredential(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('colon');
  });

  it('returns 409 for duplicate username', async () => {
    await AdminCredential.create({ username: 'admin', password: 'password123' });

    const req = createReq({ username: 'admin', password: 'newpassword1' });
    const res = createRes();
    await createCredential(req, res);
    expect(res.statusCode).toBe(409);
  });

  it('creates credential and returns 201 on success', async () => {
    const req = createReq({ username: 'newadmin', password: 'securepassword' });
    const res = createRes();
    await createCredential(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('newadmin');
  });
});

describe('verifyAuth', () => {
  it('returns success with username', async () => {
    const req = { user: { username: 'admin' } };
    const res = createRes();
    await verifyAuth(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.username).toBe('admin');
  });
});
