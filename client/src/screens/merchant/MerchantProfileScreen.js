/**
 * MerchantProfileScreen - Configuración del Comercio
 * Permite gestionar la cuenta, tema y cerrar sesión
 */

import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';

export default function MerchantProfileScreen({ navigation }) {
  const { authState, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { user } = authState;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="store" size={48} color={COLORS.white} />
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{user?.name || 'Comercio'}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Comercio Verificado</Text>
          </View>
        </View>

        {/* Configuración */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Configuración</Text>
          
          <View style={[styles.optionItem, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="theme-light-dark" size={24} color={COLORS.merchant} />
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Modo Oscuro</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                {isDarkMode ? 'Activado' : 'Desactivado'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: COLORS.merchant }}
              thumbColor={isDarkMode ? COLORS.white : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={[styles.optionItem, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="lock" size={24} color={COLORS.merchant} />
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Seguridad</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>Cambiar contraseña</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="help-circle" size={24} color={COLORS.merchant} />
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Ayuda</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>Centro de soporte</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Logout (Solo móvil, en web está en sidebar) */}
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.white} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.footer}>
            <Text style={[styles.versionText, { color: theme.textSecondary }]}>Puntos Ciudadanos v1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
    paddingTop: Platform.OS === 'web' ? 90 : SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.merchant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...LAYOUT.shadowMedium,
  },
  name: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: TYPOGRAPHY.body2,
    marginBottom: SPACING.md,
  },
  roleBadge: {
    backgroundColor: COLORS.merchant + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: COLORS.merchant,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.sm,
    ...LAYOUT.shadowSmall,
  },
  optionInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    ...LAYOUT.shadowSmall,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
  },
});
