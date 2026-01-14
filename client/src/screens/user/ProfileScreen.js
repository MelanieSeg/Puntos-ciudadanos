/**
 * ProfileScreen - Pantalla de Perfil de Usuario
 * Muestra información del perfil y opciones
 */

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { walletAPI, pointsAPI } from '../../services/api';

export default function ProfileScreen({ navigation }) {
  const { authState, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { user } = authState;
  
  const [stats, setStats] = useState({
    totalPoints: 0,
    monthlyPoints: 0,
    benefitsRedeemed: 0,
    missionsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Obtener balance actual
      const balanceRes = await walletAPI.getBalance();
      const balance = balanceRes.data?.data?.wallet?.balance || 0;
      
      // Obtener transacciones
      const transactionsRes = await pointsAPI.getTransactions(100, 0);
      const transactions = transactionsRes.data?.data || [];
      
      // Calcular estadísticas
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthlyEarned = transactions
        .filter(t => t.type === 'EARNED' && new Date(t.createdAt) >= monthStart)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const benefitsCount = transactions.filter(t => t.type === 'SPENT').length;
      
      const missionsCount = transactions.filter(t => 
        t.type === 'EARNED' && t.description?.includes('Misión aprobada')
      ).length;
      
      setStats({
        totalPoints: balance,
        monthlyPoints: monthlyEarned,
        benefitsRedeemed: benefitsCount,
        missionsCompleted: missionsCount,
      });
    } catch (error) {
      console.error('[ProfileScreen] Error cargando stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Salir',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: Platform.OS === 'web' ? 90 : SPACING.md }]}>
        {/* Header del Perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color={COLORS.white} />
          </View>
          <Text style={[styles.nameText, { color: theme.text }]}>{user?.name || 'Usuario'}</Text>
          <Text style={[styles.emailText, { color: theme.textSecondary }]}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'USER' ? '👤 Ciudadano' : 
               user?.role === 'MERCHANT' ? '🏪 Comerciante' :
               user?.role === 'ADMIN' ? '⚙️ Administrador' : 'Usuario'}
            </Text>
          </View>
        </View>

        {/* Estadísticas */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons name="wallet" size={32} color={COLORS.success} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalPoints.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Puntos Actuales</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons name="chart-line" size={32} color={COLORS.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.monthlyPoints.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Este Mes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons name="trophy" size={32} color={COLORS.warning} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.missionsCompleted}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Misiones</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons name="gift" size={32} color={COLORS.error} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.benefitsRedeemed}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Canjeados</Text>
            </View>
          </View>
        )}

        {/* Opciones */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Configuración</Text>
          
          <TouchableOpacity style={[styles.optionItem, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="bell" size={24} color={COLORS.primary} style={styles.optionIcon} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: theme.text }]}>Notificaciones</Text>
              <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>Configura tus preferencias</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="lock" size={24} color={COLORS.primary} style={styles.optionIcon} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: theme.text }]}>Seguridad</Text>
              <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>Cambiar contraseña</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="help-circle" size={24} color={COLORS.primary} style={styles.optionIcon} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: theme.text }]}>Ayuda y Soporte</Text>
              <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>Contacta con nosotros</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Configuración de Apariencia */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Apariencia</Text>
          
          <View style={[styles.optionItem, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons 
              name={isDarkMode ? 'weather-night' : 'weather-sunny'} 
              size={24} 
              color={COLORS.primary} 
              style={styles.optionIcon} 
            />
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: theme.text }]}>Modo Nocturno</Text>
              <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                {isDarkMode ? 'Tema oscuro activado' : 'Tema claro activado'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: COLORS.primary }}
              thumbColor={isDarkMode ? COLORS.success : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        {/* Botón de Logout - Solo Móvil */}
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.white} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Puntos Ciudadanos v1.0.0</Text>
          <Text style={[styles.footerSubtext, { color: theme.textSecondary }]}>Hecho con ❤️ para nuestra comunidad</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.user,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  nameText: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  emailText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginTop: SPACING.sm,
  },
  roleText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  optionItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
    ...(Platform.OS === 'web' && {
      padding: SPACING.lg,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }),
  },
  optionIcon: {
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  optionSubtext: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...LAYOUT.shadowSmall,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
});
