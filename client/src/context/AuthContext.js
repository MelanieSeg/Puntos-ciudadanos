import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { authAPI, setGlobalLogoutHandler } from '../services/api';
import api from '../services/api';
import { getErrorMessage, logError } from '../utils/errorHandler';

export const AuthContext = createContext();

// Wrapper para usar SecureStore en mobile y AsyncStorage en web
const secureStorage = {
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  async getItem(key) {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  
  const [authState, setAuthState] = useState({
    token: null,
    authenticated: false,
    user: null,
    role: null,
    loading: true,
    error: null,
  });

  // Cargar datos de autenticación al iniciar la app
  useEffect(() => {
    loadStoredAuth();
    
    // Registrar el logout handler global para el interceptor de Axios
    setGlobalLogoutHandler(logout);
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await secureStorage.getItem('userToken');
      const userData = await secureStorage.getItem('userData');
      const userRole = await secureStorage.getItem('userRole');

      if (token && userData) {
        const user = JSON.parse(userData);

        // Configurar header de axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setAuthState({
          token,
          authenticated: true,
          user,
          role: userRole || user.role,
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          token: null,
          authenticated: false,
          user: null,
          role: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      logError('loadStoredAuth', error);
      setAuthState({
        token: null,
        authenticated: false,
        user: null,
        role: null,
        loading: false,
        error: getErrorMessage(error),
      });
    }
  };

  const login = async (email, password) => {
    try {
      // Limpiar cache de React Query antes de hacer login para evitar datos del usuario anterior
      queryClient.clear();

      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await authAPI.login(email, password);
      const { token, user } = response.data.data;

      // Guardar en SecureStore (cifrado en mobile)
      await secureStorage.setItem('userToken', token);
      await secureStorage.setItem('userData', JSON.stringify(user));
      
      // Guardar role solo si existe
      if (user.role) {
        await secureStorage.setItem('userRole', user.role);
      }

      // Configurar header de axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Actualizar estado
      setAuthState({
        token,
        authenticated: true,
        user,
        role: user.role,
        loading: false,
        error: null,
      });

      return { success: true, user, role: user.role };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logError('login', error);

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      throw new Error(errorMessage);
    }
  };

  const register = async (email, password, name) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await authAPI.register(name, email, password, password);
      const { user } = response.data.data;

      // NO hacer auto-login - el usuario debe verificar su email primero
      // Solo retornar el usuario creado sin guardar token ni actualizar estado
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));

      return { success: true, user, requiresEmailVerification: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logError('register', error);

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Limpiar cache de React Query (elimina todos los datos cacheados)
      queryClient.clear();

      // Limpiar SecureStore
      await secureStorage.removeItem('userToken');
      await secureStorage.removeItem('userData');
      await secureStorage.removeItem('userRole');

      // Limpiar header de axios
      delete api.defaults.headers.common['Authorization'];

      // Pequeño delay para asegurar que se procesa
      await new Promise(resolve => setTimeout(resolve, 100));

      // Actualizar estado
      setAuthState({
        token: null,
        authenticated: false,
        user: null,
        role: null,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      logError('logout', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data;

      // Actualizar usuario en SecureStore
      await secureStorage.setItem('userData', JSON.stringify(user));

      // Actualizar estado
      setAuthState(prev => ({
        ...prev,
        user,
      }));

      return user;
    } catch (error) {
      logError('refreshUser', error);
      throw error;
    }
  };

  const value = {
    authState,
    login,
    register,
    logout,
    refreshUser,
    user: authState.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
