/**
 * RegisterScreen - Pantalla de registro de usuarios con validaciones
 */

import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import * as validators from '../utils/validators';
import { getErrorMessage } from '../utils/errorHandler';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { theme, isDarkMode, toggleTheme } = useTheme();

  // Validar campos en tiempo real
  useEffect(() => {
    const newErrors = {};

    if (touched.name) {
      const nameValidation = validators.validateName(name);
      if (!nameValidation.valid) {
        newErrors.name = nameValidation.error;
      }
    }

    if (touched.email) {
      const emailValidation = validators.validateEmail(email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error;
      }
    }

    if (touched.password) {
      const passwordValidation = validators.validatePassword(password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.error;
      }
    }

    if (touched.confirmPassword) {
      const matchValidation = validators.validatePasswordMatch(password, confirmPassword);
      if (!matchValidation.valid) {
        newErrors.confirmPassword = matchValidation.error;
      }
    }

    setErrors(newErrors);
  }, [name, email, password, confirmPassword, touched]);

  const handleRegister = async () => {
    // Marcar todos como tocados
    const allTouched = { name: true, email: true, password: true, confirmPassword: true };
    setTouched(allTouched);

    // Validar todos los campos
    const nameValidation = validators.validateName(name);
    const emailValidation = validators.validateEmail(email);
    const passwordValidation = validators.validatePassword(password);
    const matchValidation = validators.validatePasswordMatch(password, confirmPassword);

    if (
      !nameValidation.valid ||
      !emailValidation.valid ||
      !passwordValidation.valid ||
      !matchValidation.valid
    ) {
      Alert.alert('Error de Validación', 'Por favor completa correctamente todos los campos');
      return;
    }

    setLoading(true);
    try {
      const result = await register(email.toLowerCase().trim(), password, name.trim());
      // Mostrar mensaje de éxito sobre verificación de email
      if (Platform.OS === 'web') {
        window.alert('¡Registro exitoso! Por favor verifica tu correo electrónico para activar tu cuenta. Revisa tu bandeja de entrada.');
      } else {
        Alert.alert(
          'Registro Exitoso',
          'Por favor verifica tu correo electrónico para activar tu cuenta. Revisa tu bandeja de entrada.',
          [{ text: 'OK' }]
        );
      }
      // Navegar al login para que el usuario inicie sesión después de verificar
      navigation.navigate('Login');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error de Registro', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <TouchableOpacity
        style={[styles.themeButton, { backgroundColor: theme.surface }]}
        onPress={toggleTheme}
      >
        <MaterialCommunityIcons name={isDarkMode ? "weather-sunny" : "weather-night"} size={24} color={theme.text} />
      </TouchableOpacity>

      <View style={[styles.mainContainer, isDesktop && styles.mainContainerDesktop]}>
        {/* Panel Izquierdo (Solo Desktop) */}
        {isDesktop && (
          <View style={styles.leftPanel}>
            <View style={styles.leftPanelContent}>
              <MaterialCommunityIcons name="account-group" size={80} color="#fff" style={{ marginBottom: 20 }} />
              <Text style={styles.brandingTitle}>Únete a la Comunidad</Text>
              <Text style={styles.brandingSubtitle}>
                Regístrate y comienza a sumar puntos por tus contribuciones a la sociedad.
              </Text>
            </View>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
          </View>
        )}

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop, { backgroundColor: isDesktop ? theme.background : 'transparent' }]} 
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, isDesktop && styles.contentDesktop]}>
            {!isDesktop ? (
              <>
                <Text style={[styles.title, { color: theme.text }]}>Puntos Ciudadanos</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Energía CO2 Neutral</Text>
              </>
            ) : (
              <View style={styles.desktopHeader}>
                <Text style={[styles.desktopTitle, { color: theme.text }]}>Crear Cuenta</Text>
                <Text style={[styles.desktopSubtitle, { color: theme.textSecondary }]}>Completa tus datos para registrarte</Text>
              </View>
            )}

            <View style={styles.form}>
          {/* Campo Nombre */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Nombre Completo</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                touched.name && errors.name && styles.inputError,
              ]}
              placeholder="Juan Pérez"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              onBlur={() => setTouched({ ...touched, name: true })}
              editable={!loading}
            />
            {touched.name && errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Campo Email */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Correo Electrónico</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                touched.email && errors.email && styles.inputError,
              ]}
              placeholder="tu@email.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched({ ...touched, email: true })}
              editable={!loading}
            />
            {touched.email && errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Campo Contraseña */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Contraseña</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                touched.password && errors.password && styles.inputError,
              ]}
              placeholder="Mínimo 8 caracteres (mayúsculas, números, símbolos)"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched({ ...touched, password: true })}
              editable={!loading}
            />
            {touched.password && errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Campo Confirmar Contraseña */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Confirmar Contraseña</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                touched.confirmPassword && errors.confirmPassword && styles.inputError,
              ]}
              placeholder="Repite la contraseña"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              editable={!loading}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (loading || Object.keys(errors).length > 0) && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading || Object.keys(errors).length > 0}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta? <Text style={styles.loginBold}>Inicia sesión aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainContainer: {
    flex: 1,
  },
  mainContainerDesktop: {
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  leftPanelContent: {
    zIndex: 2,
    alignItems: 'center',
    padding: 40,
  },
  brandingTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  brandingSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  circle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -100,
    left: -100,
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
    bottom: -50,
    right: -50,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollContentDesktop: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  contentDesktop: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    padding: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
  },
  desktopHeader: {
    marginBottom: 30,
    alignItems: 'flex-start',
    width: '100%',
  },
  desktopTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  desktopSubtitle: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
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
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loginBold: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});
