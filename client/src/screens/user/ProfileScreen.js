/**
 * ProfileScreen - Pantalla de Perfil de Usuario
 * Muestra información del perfil y opciones
 */

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, Switch, Modal, TextInput, KeyboardAvoidingView, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import api, { pointsAPI } from '../../services/api';
import * as validators from '../../utils/validators';

export default function ProfileScreen({ navigation }) {
  const { authState, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { user } = authState;
  
  const [stats, setStats] = useState({
    benefitsRedeemed: 0,
    missionsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Obtener transacciones
      const transactionsRes = await pointsAPI.getTransactions(100, 0);
      const transactions = transactionsRes.data?.data || [];
      
      const benefitsCount = transactions.filter(t => t.type === 'SPENT').length;
      
      const missionsCount = transactions.filter(t => 
        t.type === 'EARNED' && t.description?.includes('Misión aprobada')
      ).length;
      
      setStats({
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

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const submitPasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    const errors = {};

    if (!currentPassword) errors.currentPassword = 'La contraseña actual es requerida';
    
    const passwordValidation = validators.validatePassword(newPassword);
    if (!passwordValidation.valid) errors.newPassword = passwordValidation.error;

    const matchValidation = validators.validatePasswordMatch(newPassword, confirmPassword);
    if (!matchValidation.valid) errors.confirmPassword = matchValidation.error;

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      setPasswordLoading(true);
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      
      if (Platform.OS === 'web') {
        alert('Contraseña actualizada correctamente');
      } else {
        Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      }
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      const msg = error.response?.data?.message || error.message || 'Error al actualizar contraseña';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSupport = async () => {
    const email = 'soporte@puntosciudadanos.com';
    const subject = 'Ayuda - Puntos Ciudadanos';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      // Intentar abrir la app de correo predeterminada
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening email:', error);
      const msg = `Por favor contáctanos directamente a: ${email}`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Contacto de Soporte', msg);
    }
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: Platform.OS === 'web' ? 90 : SPACING.md }]}>
        {/* Header del Perfil */}
        <View style={[styles.profileHeader, { backgroundColor: theme.surface }]}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color={COLORS.white} />
          </View>
          <Text style={[styles.nameText, { color: theme.text }]}>{user?.name || 'Usuario'}</Text>
          <Text style={[styles.emailText, { color: theme.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.roleText, { color: theme.textSecondary }]}>
              {user?.role === 'USER' ? 'Ciudadano' : 
               user?.role === 'MERCHANT' ? 'Comerciante' :
               user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
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
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="trophy" size={24} color="#FF9800" />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.missionsCompleted}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Misiones Completadas</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                <MaterialCommunityIcons name="gift" size={24} color="#F44336" />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.benefitsRedeemed}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Beneficios Canjeados</Text>
              </View>
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

          <TouchableOpacity 
            style={[styles.optionItem, { backgroundColor: theme.surface }]}
            onPress={() => setShowPasswordModal(true)}
          >
            <MaterialCommunityIcons name="lock" size={24} color={COLORS.primary} style={styles.optionIcon} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: theme.text }]}>Seguridad</Text>
              <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>Cambiar contraseña</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionItem, { backgroundColor: theme.surface }]}
            onPress={handleSupport}
          >
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

      {/* Modal de Cambio de Contraseña */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Contraseña Actual</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: passwordErrors.currentPassword ? COLORS.error : theme.border }]}
                  secureTextEntry
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor={theme.textSecondary}
                />
                {passwordErrors.currentPassword && <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Nueva Contraseña</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: passwordErrors.newPassword ? COLORS.error : theme.border }]}
                  secureTextEntry
                  value={passwordForm.newPassword}
                  onChangeText={(text) => handlePasswordChange('newPassword', text)}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={theme.textSecondary}
                />
                {passwordErrors.newPassword && <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Confirmar Nueva Contraseña</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: passwordErrors.confirmPassword ? COLORS.error : theme.border }]}
                  secureTextEntry
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                  placeholder="Repite la nueva contraseña"
                  placeholderTextColor={theme.textSecondary}
                />
                {passwordErrors.confirmPassword && <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>}
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, passwordLoading && styles.disabledButton]}
                onPress={submitPasswordChange}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadowSmall,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: SPACING.xs,
  },
  roleText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h6,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.xl,
    ...LAYOUT.shadowLarge,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
  },
  formContainer: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.body1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.caption,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.body1,
  },
});
