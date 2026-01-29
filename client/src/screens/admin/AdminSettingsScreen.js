import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import api from '../../services/api';
import * as validators from '../../utils/validators';

export default function AdminSettingsScreen({ navigation }) {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para configuración operativa
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [homeBannerMessage, setHomeBannerMessage] = useState('');
  
  // Estados para "Próximamente" (no funcionales)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newUserBonus, setNewUserBonus] = useState('100');

  // Estados para modal de cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      if (response.data.success && response.data.data.settings) {
        const settings = response.data.data.settings;
        setMaintenanceMode(settings.maintenanceMode || false);
        setHomeBannerMessage(settings.homeBannerMessage || '');
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      if (Platform.OS === 'web') {
        alert('Error al cargar configuración del sistema');
      } else {
        Alert.alert('Error', 'No se pudo cargar la configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const data = {
        maintenanceMode,
        homeBannerMessage: homeBannerMessage.trim() || null,
      };

      await adminAPI.updateSettings(data);
      
      if (Platform.OS === 'web') {
        alert('Configuración guardada exitosamente');
      } else {
        Alert.alert('Éxito', 'Configuración guardada exitosamente');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      if (Platform.OS === 'web') {
        alert('Error al guardar la configuración');
      } else {
        Alert.alert('Error', 'No se pudo guardar la configuración');
      }
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* SECCIÓN: Configuración Operativa */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Configuración Operativa
        </Text>

        {/* Modo Mantenimiento */}
        <View style={[styles.optionItem, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="cog" size={24} color={theme.primary} style={styles.optionIcon} />
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Modo Mantenimiento
            </Text>
            <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
              Desactiva temporalmente el envío de misiones
            </Text>
          </View>
          <Switch
            value={maintenanceMode}
            onValueChange={setMaintenanceMode}
            trackColor={{ false: theme.inputBorder, true: theme.primary }}
            thumbColor={maintenanceMode ? theme.primaryLight : '#f4f3f4'}
          />
        </View>

        {/* Mensaje Global de Bienvenida */}
        <View style={[styles.optionItem, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="message-text" size={24} color={theme.primary} style={styles.optionIcon} />
          <View style={[styles.optionContent, { flexDirection: 'column' }]}>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Mensaje Global de Bienvenida
            </Text>
            <Text style={[styles.optionSubtext, { color: theme.textSecondary, marginBottom: 8 }]}>
              Mensaje que aparece en la pantalla de inicio del ciudadano
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.inputBorder,
                },
              ]}
              placeholder="Ej: ¡Bienvenidos! Nuevas misiones disponibles esta semana"
              placeholderTextColor={theme.textSecondary}
              value={homeBannerMessage}
              onChangeText={setHomeBannerMessage}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>

      {/* SECCIÓN: Seguridad */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Seguridad
        </Text>

        <TouchableOpacity 
          style={[styles.optionItem, { backgroundColor: theme.surface }]}
          onPress={() => setShowPasswordModal(true)}
        >
          <MaterialCommunityIcons name="lock" size={24} color={theme.primary} style={styles.optionIcon} />
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, { color: theme.text }]}>Cambiar Contraseña</Text>
            <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>Actualiza tu contraseña de acceso</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* SECCIÓN: Notificaciones (Próximamente) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Notificaciones
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.primary + '30' }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              PRÓXIMAMENTE
            </Text>
          </View>
        </View>

        <View style={[styles.optionItem, { backgroundColor: theme.surface, opacity: 0.5 }]}>
          <MaterialCommunityIcons name="bell" size={24} color={theme.primary} style={styles.optionIcon} />
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Notificaciones Push
            </Text>
            <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
              Enviar notificaciones push a los usuarios
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            disabled={true}
            trackColor={{ false: theme.inputBorder, true: theme.primary }}
            thumbColor={notificationsEnabled ? theme.primaryLight : '#f4f3f4'}
          />
        </View>
      </View>

      {/* SECCIÓN: Bonos de Usuario Nuevo (Próximamente) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Bonos de Usuario Nuevo
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.primary + '30' }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              PRÓXIMAMENTE
            </Text>
          </View>
        </View>

        <View style={[styles.optionItem, { backgroundColor: theme.surface, opacity: 0.5 }]}>
          <MaterialCommunityIcons name="gift" size={24} color={theme.primary} style={styles.optionIcon} />
          <View style={[styles.optionContent, { flexDirection: 'column' }]}>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Puntos de Bienvenida
            </Text>
            <Text style={[styles.optionSubtext, { color: theme.textSecondary, marginBottom: 8 }]}>
              Puntos que recibe un nuevo usuario al registrarse
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.inputBorder,
                },
              ]}
              placeholder="100"
              placeholderTextColor={theme.textSecondary}
              value={newUserBonus}
              onChangeText={setNewUserBonus}
              keyboardType="numeric"
              editable={false}
            />
          </View>
        </View>
      </View>

      {/* SECCIÓN: Apariencia */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Apariencia
        </Text>

        <View style={[styles.optionItem, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons 
            name={isDarkMode ? 'weather-night' : 'weather-sunny'} 
            size={24} 
            color={theme.primary} 
            style={styles.optionIcon} 
          />
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, { color: theme.text }]}>
              Modo Oscuro
            </Text>
            <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
              {isDarkMode ? 'Tema oscuro activado' : 'Tema claro activado'}
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.inputBorder, true: theme.primary }}
            thumbColor={isDarkMode ? theme.primaryLight : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Botón Guardar */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: theme.primary },
          saving && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar Cambios</Text>
        )}
      </TouchableOpacity>

      {/* Logout (Solo móvil, en web está en sidebar) */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      )}

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
                  style={[
                    styles.modalInput, 
                    { 
                      backgroundColor: theme.inputBg, 
                      color: theme.text, 
                      borderColor: passwordErrors.currentPassword ? '#F44336' : theme.inputBorder 
                    }
                  ]}
                  secureTextEntry
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor={theme.textSecondary}
                />
                {passwordErrors.currentPassword && (
                  <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Nueva Contraseña</Text>
                <TextInput
                  style={[
                    styles.modalInput, 
                    { 
                      backgroundColor: theme.inputBg, 
                      color: theme.text, 
                      borderColor: passwordErrors.newPassword ? '#F44336' : theme.inputBorder 
                    }
                  ]}
                  secureTextEntry
                  value={passwordForm.newPassword}
                  onChangeText={(text) => handlePasswordChange('newPassword', text)}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={theme.textSecondary}
                />
                {passwordErrors.newPassword && (
                  <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Confirmar Nueva Contraseña</Text>
                <TextInput
                  style={[
                    styles.modalInput, 
                    { 
                      backgroundColor: theme.inputBg, 
                      color: theme.text, 
                      borderColor: passwordErrors.confirmPassword ? '#F44336' : theme.inputBorder 
                    }
                  ]}
                  secureTextEntry
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                  placeholder="Repite la nueva contraseña"
                  placeholderTextColor={theme.textSecondary}
                />
                {passwordErrors.confirmPassword && (
                  <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity 
                style={[
                  styles.modalSaveButton, 
                  { backgroundColor: theme.primary },
                  passwordLoading && styles.disabledButton
                ]}
                onPress={submitPasswordChange}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Actualizar Contraseña</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  badge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  optionItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      padding: 18,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }),
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginTop: 8,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
  },
  modalSaveButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
