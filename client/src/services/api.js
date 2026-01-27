import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuración de IP según plataforma
// - Web: localhost
// - Android: IP de tu PC en red local (funciona para emulador y dispositivo físico)
// - iOS: localhost (para simulador)
const HOST_IP = Platform.OS === 'web' 
  ? 'localhost' 
  : Platform.OS === 'android'
    ? '192.168.1.82' // IP de tu PC - funciona con Docker
    : 'localhost';

const PORT = '3000';
const API_VERSION = 'v1';

let API_URL = `http://${HOST_IP}:${PORT}/api/${API_VERSION}`;

console.log(`[API Config] Platform: ${Platform.OS}, URL: ${API_URL}`);

// Variable para almacenar la función de logout global
let globalLogoutHandler = null;

// Función para registrar el logout handler desde el AuthContext
export const setGlobalLogoutHandler = (logoutFn) => {
  globalLogoutHandler = logoutFn;
};

// Helper para obtener el token (compatible con navegador y React Native)
const getToken = async () => {
  try {
    // Intentar AsyncStorage primero (React Native)
    if (AsyncStorage?.getItem) {
      return await AsyncStorage.getItem('userToken');
    }
    // Fallback a localStorage (Navegador web)
    return typeof window !== 'undefined' ? window.localStorage.getItem('userToken') : null;
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';
    
    // No ejecutar logout en rutas de autenticación (login, register)
    const isAuthRoute = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthRoute) {
      // Token inválido o expirado
      console.warn('Sesión expirada o token inválido (401). Ejecutando logout...');
      
      try {
        // Limpiar storage local
        if (AsyncStorage?.multiRemove) {
          await AsyncStorage.multiRemove(['userToken', 'userData', 'userRole']);
        } else if (typeof window !== 'undefined') {
          window.localStorage.removeItem('userToken');
          window.localStorage.removeItem('userData');
          window.localStorage.removeItem('userRole');
        }

        // Ejecutar el logout global si está registrado
        if (globalLogoutHandler) {
          await globalLogoutHandler();
        }
      } catch (err) {
        console.error('Error en logout automático:', err);
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password, confirmPassword) => 
    api.post('/auth/register', { name, email, password, confirmPassword }),
  getProfile: () => api.get('/auth/profile'),
};

// Servicios de wallet - Obtener datos del usuario autenticado
export const walletAPI = {
  // Obtener balance desde /auth/me que devuelve user.wallet.balance
  getBalance: () => api.get('/auth/me'),
  // NOTA: No hay endpoint de transacciones en el backend actual
  // Se puede agregar si se requiere historial
};

// Servicios de usuario autenticado
export const userAPI = {
  getMe: () => api.get('/auth/me'),
};

// Servicios de puntos
export const pointsAPI = {
  redeemBenefit: (benefitId) => api.post('/points/redeem', { benefitId }),
  getTransactions: (limit = 10, offset = 0) => 
    api.get(`/points/transactions?limit=${limit}&offset=${offset}&t=${Date.now()}`),
};

// Servicios de beneficios
export const benefitsAPI = {
  getAll: (category = null, active = true) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (active !== null) params.append('active', active);
    return api.get(`/benefits?${params.toString()}`);
  },
  getById: (id) => api.get(`/benefits/${id}`),
};

// Servicios de merchant
export const merchantAPI = {
  getRedemptionPreview: (qrCode) => api.post('/merchant/redeem/preview', { qrCode }),
  validateQR: (qrCode) => api.post('/merchant/redeem', { qrCode }),
  getStats: () => api.get('/merchant/stats'),
  getHistory: (limit = 20, offset = 0) => 
    api.get(`/merchant/history?limit=${limit}&offset=${offset}`),
  getAssociates: () => api.get('/merchant/associates'),
};

// Servicios de misiones
export const missionsAPI = {
  getAvailable: () => api.get('/missions'),
  getMissionById: (id) => api.get(`/missions/${id}`),
  submitEvidence: (missionId, formData) => 
    api.post(`/missions/${missionId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// Servicios de admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAuditLogs: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.action) queryParams.append('action', params.action);
    if (params.adminId) queryParams.append('adminId', params.adminId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    return api.get(`/admin/audit-logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },
  suspendUser: (userId, reason) => api.patch(`/admin/users/${userId}/status`, { status: 'SUSPENDED', reason }),
  getSubmissions: (status = 'PENDING', limit = 20, offset = 0) => 
    api.get(`/admin/submissions?status=${status}&limit=${limit}&offset=${offset}`),
  approveSubmission: (submissionId, notes) => {
    console.log('[API] Calling approveSubmission with submissionId:', submissionId, 'notes:', notes);
    return api.post(`/admin/submissions/${submissionId}/approve`, { notes });
  },
  rejectSubmission: (submissionId, reason) => {
    console.log('[API] Calling rejectSubmission with submissionId:', submissionId, 'reason:', reason);
    return api.post(`/admin/submissions/${submissionId}/reject`, { reason });
  },
  getUsers: (role, status, limit = 20, offset = 0) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('offset', offset);
    return api.get(`/admin/users${params.toString() ? '?' + params.toString() : ''}`);
  },
  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }),
  createSupportAdmin: (data) => api.post('/admin/support-admins', data),
  createMerchant: (data) => api.post('/admin/merchants', data),
  
  // Misiones
  getAllMissions: (status) => {
    const url = status ? `/admin/missions?status=${status}` : '/admin/missions';
    return api.get(url);
  },
  createMission: (data) => api.post('/admin/missions', data),
  updateMission: (id, data) => api.put(`/admin/missions/${id}`, data),
  updateMissionStatus: (id, active) => api.patch(`/admin/missions/${id}/status`, { active }),
  deleteMission: (id) => api.delete(`/admin/missions/${id}`),
  
  // Configuración del sistema
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.patch('/admin/settings', data),
};

// Configuración pública (sin autenticación)
export const configAPI = {
  getPublicConfig: () => api.get('/config'),
};

export default api;
