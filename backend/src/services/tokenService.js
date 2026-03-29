import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '60d'; // 2 months

const accessSecret = () => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET environment variable is required');
  }
  return process.env.JWT_ACCESS_SECRET;
};

const refreshSecret = () => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  return process.env.JWT_REFRESH_SECRET;
};

export function generateAccessToken(accountId) {
  return jwt.sign({ sub: accountId }, accessSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
}

export function generateRefreshToken(accountId, tokenVersion) {
  return jwt.sign({ sub: accountId, v: tokenVersion }, refreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret());
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret());
}

export function setTokenCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 60 * 24 * 60 * 60 * 1000 // 60 days
  });
}

export function clearTokenCookies(res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth/refresh'
  });
}
