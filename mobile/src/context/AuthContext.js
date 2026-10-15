import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [savedToken, savedUser] = await Promise.all([
          SecureStore.getItemAsync('roam.token'),
          SecureStore.getItemAsync('roam.user')
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } else if (savedToken) {
          await SecureStore.deleteItemAsync('roam.token');
        }
      } catch (error) {
        console.error('Could not restore the saved session:', error);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(identity, password) {
    const result = await authApi.login({ identity, password });
    await saveSession(result);
  }

  async function register(fullName, identity, password, confirmPassword) {
    const result = await authApi.register({ fullName, identity, password, confirmPassword });
    await saveSession(result);
  }

  async function saveSession(result) {
    await Promise.all([
      SecureStore.setItemAsync('roam.token', result.token),
      SecureStore.setItemAsync('roam.user', JSON.stringify(result.user))
    ]);
    setToken(result.token);
    setUser(result.user);
  }

  async function logout() {
    await Promise.all([
      SecureStore.deleteItemAsync('roam.token'),
      SecureStore.deleteItemAsync('roam.user')
    ]);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, loading, login, register, logout }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
