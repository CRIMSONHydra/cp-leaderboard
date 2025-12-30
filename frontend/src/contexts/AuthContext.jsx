import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Authentication Context Provider
 * Stores credentials in memory only - never persists to browser storage
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
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

