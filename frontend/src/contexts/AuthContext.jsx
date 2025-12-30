import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Provides an authentication context that stores credentials in memory.
 *
 * Exposes `login(username, password)`, `logout()`, `isAuthenticated()`, and
 * `getCredentials()` to descendant components via context.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children - Elements rendered inside the provider.
 */
export function AuthProvider({ children }) {
  const [credentials, setCredentials] = useState(null);

  const login = useCallback((username, password) => {
    // Store credentials in memory only
    setCredentials({ username, password });
  }, []);

  const logout = useCallback(() => {
    // Clear in-memory credentials
    setCredentials(null);
  }, []);

  const isAuthenticated = useCallback(() => {
    return credentials !== null;
  }, [credentials]);

  const getCredentials = useCallback(() => {
    return credentials;
  }, [credentials]);

  return (
    <AuthContext.Provider value={{ login, logout, isAuthenticated, getCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * @returns {object} Authentication context with login, logout, isAuthenticated, getCredentials
 */
/**
 * Accesses the authentication context provided by AuthProvider.
 *
 * @returns {{ login: (username: string, password: string) => void, logout: () => void, isAuthenticated: () => boolean, getCredentials: () => { username: string, password: string } | null }} The authentication context exposing methods to manage and read in-memory credentials.
 * @throws {Error} If called outside of an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
