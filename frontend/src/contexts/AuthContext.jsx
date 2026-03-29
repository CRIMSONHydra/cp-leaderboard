import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../services/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a valid session via cookies
  useEffect(() => {
    authApi.getMe()
      .then(res => setAccount(res.data))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (loginId, password) => {
    const res = await authApi.login(loginId, password);
    setAccount(res.data);
    return res.data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await authApi.register(username, email, password);
    setAccount(res.data);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setAccount(null);
  }, []);

  const isAuthenticated = useCallback(() => {
    return account !== null;
  }, [account]);

  // Legacy compatibility — returns null for new JWT auth
  const getCredentials = useCallback(() => {
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{
      account,
      loading,
      login,
      register,
      logout,
      isAuthenticated,
      getCredentials
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
