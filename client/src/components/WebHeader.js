/**
 * WebHeader - Header fijo para web
 * Componente reutilizable que muestra:
 * - Título de la pantalla
 * - Balance de puntos
 * - Avatar y nombre del usuario
 */

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { walletAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function WebHeader({ title = 'Puntos Ciudadanos', hideBalance = false }) {
  const { authState } = useContext(AuthContext);
  const { theme } = useTheme();
  const [userData, setUserData] = useState({ name: 'Usuario', email: '' });
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Siempre cargar datos del usuario (nombre, email, y balance si no está oculto)
    if (authState.authenticated && authState.token && !dataLoaded) {
      loadUserData();
    }
  }, [authState.authenticated, authState.token, dataLoaded]);

  const loadUserData = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await walletAPI.getBalance();
      const user = response.data?.data;
      
      if (user) {
        setUserData({
          name: user.name || 'Usuario',
          email: user.email || '',
        });
        // Solo actualizar balance si no está oculto
        if (!hideBalance) {
          setBalance(user.wallet?.balance || 0);
        }
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('[WebHeader] Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Solo renderizar en web
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={[styles.fixedHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.headerContent}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {!hideBalance && (
            <View style={styles.pointsBadge}>
              <MaterialCommunityIcons name="star" size={16} color="#FFB84D" />
              <Text style={styles.pointsText}>{balance.toLocaleString()}</Text>
              <Text style={styles.pointsLabel}>PUNTOS</Text>
            </View>
          )}
          <View style={styles.userProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userData.name)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>{userData.name}</Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{userData.email}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: SPACING.md,
    flexDirection: 'row',
  },
  pointsBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#FFB84D',
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFB84D',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontWeight: '600',
    fontSize: 12,
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: 10,
    color: COLORS.gray,
  },
});
