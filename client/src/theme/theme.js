// src/theme/theme.js
/**
 * Sistema de Temas Centralizado
 * Colores, tipografía y constantes para toda la app
 * DRY Principle: Una única fuente de verdad
 * 
 * NOTA: Este archivo exporta colores estáticos.
 * Para colores dinámicos según tema (Light/Dark), usar useTheme() hook.
 */

import { Platform } from 'react-native';

// Colores estáticos que NO cambian con el tema
export const COLORS = {
  // Primarios (identidad de marca)
  primary: '#4CAF50', // Verde
  secondary: '#FF9800', // Naranja (Merchant)
  accent: '#2196F3', // Azul

  // Estados (mantienen identidad)
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // Grises base (para referencias)
  white: '#FFFFFF',
  light: '#F5F5F5',
  lighter: '#F9F9F9',
  lightGray: '#EEEEEE',
  gray: '#9E9E9E',
  darkGray: '#616161',
  dark: '#212121',
  black: '#000000',

  // Específicos por rol
  user: '#2196F3', // Azul
  merchant: '#FF9800', // Naranja
  admin: '#9C27B0', // Púrpura
  
  // Legacy (mantener para compatibilidad)
  background: '#F5F5F5',
  textLight: '#9E9E9E',
};

export const TYPOGRAPHY = {
  // Tamaños
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  body1: 16,
  body2: 14,
  caption: 12,
  overline: 10,

  // Pesos (solo nombres, implementar con fontWeight)
  light: '300',
  normal: '400',
  medium: '600',
  bold: '700',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TAB_CONFIG = {
  // Configuración de Bottom Tabs
  // Los iconos ahora se manejan en los navigators con MaterialCommunityIcons
  userTabs: [
    {
      name: 'UserHome',
      label: 'Estadísticas',
      color: COLORS.user,
    },
    {
      name: 'Earn',
      label: 'Gana Puntos',
      color: COLORS.user,
    },
    {
      name: 'Benefits',
      label: 'Beneficios',
      color: COLORS.user,
    },
    {
      name: 'Profile',
      label: 'Configuración',
      color: COLORS.user,
    },
  ],

  merchantTabs: [
    {
      name: 'MerchantDashboard',
      label: 'Panel',
      color: COLORS.merchant,
    },
    {
      name: 'Stock',
      label: 'Mi Stock',
      color: COLORS.merchant,
    },
    {
      name: 'Scanner',
      label: 'Validar',
      color: COLORS.merchant,
    },
    {
      name: 'History',
      label: 'Historial',
      color: COLORS.merchant,
    },
  ],

  adminTabs: [
    {
      name: 'AdminDashboard',
      label: 'Panel',
      color: COLORS.admin,
    },
    {
      name: 'Missions',
      label: 'Misiones',
      color: COLORS.admin,
    },
    {
      name: 'Benefits',
      label: 'Beneficios',
      color: COLORS.admin,
    },
    {
      name: 'Approvals',
      label: 'Aprobaciones',
      color: COLORS.admin,
    },
    {
      name: 'Users',
      label: 'Usuarios',
      color: COLORS.admin,
    },
    {
      name: 'Settings',
      label: 'Configuración',
      color: COLORS.admin,
    },
  ],
};

export const LAYOUT = {
  // Tamaños de pantalla
  webMaxWidth: 1200, // Dashboard principal (más ancho)
  contentMaxWidth: 800, // Contenido de lectura (artículos, formularios)
  tabletMaxWidth: 600,

  // SafeArea
  safeAreaPadding: SPACING.md,

  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },

  // Sombras
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  shadowMedium: Platform.select({
    web: {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  }),

  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  TAB_CONFIG,
  LAYOUT,
  ANIMATION,
};
