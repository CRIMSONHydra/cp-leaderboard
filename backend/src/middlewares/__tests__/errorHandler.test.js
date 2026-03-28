import { describe, it, expect, vi } from 'vitest';
import errorHandler from '../errorHandler.js';

function createMockRes() {
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

describe('errorHandler', () => {
  const req = {};
  const next = vi.fn();

  it('handles Mongoose ValidationError with 400', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        field1: { message: 'Field1 is required' },
        field2: { message: 'Field2 is invalid' }
      }
    };

    const res = createMockRes();
    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Field1 is required');
    expect(res.body.error).toContain('Field2 is invalid');
  });

  it('handles Mongoose CastError with 400', () => {
    const err = { name: 'CastError' };
    const res = createMockRes();
    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid ID format');
  });

  it('uses err.statusCode when provided', () => {
    const err = { statusCode: 404, message: 'Not found' };
    const res = createMockRes();
    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('defaults to 500 when no statusCode', () => {
    const err = { message: 'Something broke' };
    const res = createMockRes();
    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Something broke');
  });

  it('uses "Server Error" when no message', () => {
    const err = {};
    const res = createMockRes();
    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Server Error');
  });
});
