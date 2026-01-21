/**
 * ChangePasswordScreen - Pantalla obligatoria de cambio de contraseña
 * Para usuarios con mustChangePassword = true
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import * as validators from '../utils/validators';
import { getErrorMessage } from '../utils/errorHandler';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { user, refreshUser, setNeedPasswordChange } = useContext(AuthContext);

  // Validar campos en tiempo real
  useEffect(() => {
    const newErrors = {};

    if (touched.currentPassword && !currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (touched.newPassword) {
      const passwordValidation = validators.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        newErrors.newPassword = passwordValidation.error;
      }
    }

    if (touched.confirmPassword) {
      const matchValidation = validators.validatePasswordMatch(newPassword, confirmPassword);
      if (!matchValidation.valid) {
        newErrors.confirmPassword = matchValidation.error;
      }
    }

    setErrors(newErrors);
  }, [currentPassword, newPassword, confirmPassword, touched]);

  const handleChangePassword = async () => {
    // Marcar todos como tocados
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });

    // Validar todos los campos
    if (!currentPassword) {
      if (Platform.OS === 'web') {
        window.alert('Por favor ingresa tu contraseña actual');
      } else {
        Alert.alert('Error', 'Por favor ingresa tu contraseña actual');
      }
      return;
    }

    const passwordValidation = validators.validatePassword(newPassword);
    const matchValidation = validators.validatePasswordMatch(newPassword, confirmPassword);

    if (!passwordValidation.valid || !matchValidation.valid) {
      if (Platform.OS === 'web') {
        window.alert('Por favor completa correctamente todos los campos');
      } else {
        Alert.alert('Error de Validación', 'Por favor completa correctamente todos los campos');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      // La respuesta contiene el usuario actualizado con mustChangePassword: false
      // Y un nuevo token completo sin restricciones
      const { user: updatedUser, token: newToken } = response.data.data;

      // Actualizar el token en el almacenamiento y en axios
      if (newToken) {
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem('userToken', newToken);
        } else {
          await SecureStore.setItemAsync('userToken', newToken);
        }
        // Actualizar header de axios con el nuevo token
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }

      // Desbloquear la bandera de cambio obligatorio
      if (setNeedPasswordChange) {
        setNeedPasswordChange(false);
      }

      // Actualizar estado del usuario con los datos de la respuesta
      if (refreshUser) {
        await refreshUser();
      }

      if (Platform.OS === 'web') {
        window.alert('Contraseña actualizada correctamente. Ahora puedes acceder al sistema.');
      } else {
        Alert.alert(
          'Éxito',
          'Contraseña actualizada correctamente. Ahora puedes acceder al sistema.',
          [{ text: 'OK' }]
        );
      }

      // La navegación se manejará automáticamente cuando mustChangePassword sea false
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>Cambio de Contraseña Obligatorio</Text>
            <Text style={styles.warningText}>
              Por seguridad, debes cambiar tu contraseña temporal antes de acceder al sistema.
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'MERCHANT' ? 'Comerciante' : 
               user?.role === 'SUPPORT_ADMIN' ? 'Administrador de Soporte' : 'Usuario'}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Contraseña Actual */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Contraseña Actual</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.currentPassword && errors.currentPassword && styles.inputError,
                ]}
                placeholder="Tu contraseña temporal"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                onBlur={() => setTouched({ ...touched, currentPassword: true })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#999"
              />
              {touched.currentPassword && errors.currentPassword && (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              )}
            </View>

            {/* Nueva Contraseña */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nueva Contraseña</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.newPassword && errors.newPassword && styles.inputError,
                ]}
                placeholder="Mínimo 8 caracteres (mayúsculas, números, símbolos)"
                value={newPassword}
                onChangeText={setNewPassword}
                onBlur={() => setTouched({ ...touched, newPassword: true })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#999"
              />
              {touched.newPassword && errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
            </View>

            {/* Confirmar Nueva Contraseña */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.confirmPassword && errors.confirmPassword && styles.inputError,
                ]}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#999"
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Cambiar Contraseña</Text>
              )}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ✓ Mínimo 8 caracteres{'\n'}
                ✓ Al menos una mayúscula, minúscula, número y símbolo{'\n'}
                ✓ No podrás usar tu contraseña temporal nuevamente{'\n'}
                ✓ Recuerda guardar tu nueva contraseña en un lugar seguro
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#F57C00',
    padding: 20,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  warningIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 20,
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#F57C00',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#FFB74D',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
});
