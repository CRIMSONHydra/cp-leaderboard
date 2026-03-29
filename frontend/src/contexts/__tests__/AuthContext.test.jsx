import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the auth API module
vi.mock('../../services/api/auth', () => ({
  authApi: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }
}));

import { authApi } from '../../services/api/auth';

function TestComponent() {
  const { account, loading, login, logout, isAuthenticated, getCredentials } = useAuth();

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="auth-status">{isAuthenticated() ? 'authenticated' : 'not-authenticated'}</span>
      <span data-testid="account">{JSON.stringify(account)}</span>
      <span data-testid="credentials">{JSON.stringify(getCredentials())}</span>
      <button onClick={() => login('admin', 'secret')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: getMe fails (not logged in)
    authApi.getMe.mockRejectedValue(new Error('Not authenticated'));
  });

  it('starts loading and resolves to not authenticated', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('credentials')).toHaveTextContent('null');
  });

  it('restores session if getMe succeeds', async () => {
    authApi.getMe.mockResolvedValue({
      data: { id: '123', username: 'admin', email: 'a@b.com' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('account')).toHaveTextContent('"username":"admin"');
  });

  it('becomes authenticated after login', async () => {
    authApi.login.mockResolvedValue({
      data: { id: '123', username: 'admin', email: 'a@b.com' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
  });

  it('is not authenticated after logout', async () => {
    authApi.getMe.mockResolvedValue({
      data: { id: '123', username: 'admin', email: 'a@b.com' }
    });
    authApi.logout.mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    spy.mockRestore();
  });
});
