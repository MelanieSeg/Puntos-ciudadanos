/**
 * RegisterScreen - Pantalla de registro de usuarios con validaciones
 */

import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import * as validators from '../utils/validators';
import { getErrorMessage } from '../utils/errorHandler';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Puntos Ciudadanos</Text>
          <Text style={styles.subtitle}>Energía CO2 Neutral</Text>

          <View style={styles.form}>
          {/* Campo Nombre */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
              style={[
                styles.input,
                touched.name && errors.name && styles.inputError,
              ]}
              placeholder="Juan Pérez"
              placeholderTextColor={COLORS.gray}
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
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={[
                styles.input,
                touched.email && errors.email && styles.inputError,
              ]}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.gray}
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
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[
                styles.input,
                touched.password && errors.password && styles.inputError,
              ]}
              placeholder="Mínimo 8 caracteres (mayúsculas, números, símbolos)"
              placeholderTextColor={COLORS.gray}
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
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={[
                styles.input,
                touched.confirmPassword && errors.confirmPassword && styles.inputError,
              ]}
              placeholder="Repite la contraseña"
              placeholderTextColor={COLORS.gray}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
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
