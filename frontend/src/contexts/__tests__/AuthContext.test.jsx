import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

function TestComponent() {
  const { login, logout, isAuthenticated, getCredentials } = useAuth();

  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated() ? 'authenticated' : 'not-authenticated'}</span>
      <span data-testid="credentials">{JSON.stringify(getCredentials())}</span>
      <button onClick={() => login('admin', 'secret')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('is not authenticated initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('credentials')).toHaveTextContent('null');
  });

  it('becomes authenticated after login', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
  });

  it('returns credentials after login', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('credentials')).toHaveTextContent(
      JSON.stringify({ username: 'admin', password: 'secret' })
    );
  });

  it('is not authenticated after logout', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText('Login').click();
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

    act(() => {
      screen.getByText('Logout').click();
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    spy.mockRestore();
  });
});
