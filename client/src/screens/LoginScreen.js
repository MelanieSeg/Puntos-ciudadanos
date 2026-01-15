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
import { AuthContext } from '../context/AuthContext';
import * as validators from '../utils/validators';
import { getErrorMessage } from '../utils/errorHandler';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { login } = useContext(AuthContext);

  // Validar campos en tiempo real
  useEffect(() => {
    const newErrors = {};

    if (touched.email) {
      const emailValidation = validators.validateEmail(email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error;
      }
    }

    if (touched.password && !password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
  }, [email, password, touched]);

  const handleLogin = async () => {
    // Marcar todos como tocados
    setTouched({ email: true, password: true });

    // Validar campos
    const emailValidation = validators.validateEmail(email);
    
    if (!emailValidation.valid) {
      if (Platform.OS === 'web') {
        window.alert('Por favor ingresa un email válido');
      } else {
        Alert.alert('Error de Validación', 'Por favor ingresa un email válido');
      }
      return;
    }
    
    if (!password) {
      if (Platform.OS === 'web') {
        window.alert('Por favor ingresa tu contraseña');
      } else {
        Alert.alert('Error de Validación', 'Por favor ingresa tu contraseña');
      }
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.toLowerCase().trim(), password);
      // Si el login es exitoso, el AuthContext actualiza el estado
      // y la navegación se maneja automáticamente en App.js
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error de Autenticación', errorMessage);
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
          <Text style={styles.title}>Puntos Ciudadanos</Text>
          <Text style={styles.subtitle}>Energía CO2 Neutral</Text>

          <View style={styles.form}>
            {/* Campo Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  touched.email && errors.email && styles.inputError,
                ]}
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched({ ...touched, email: true })}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#999"
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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched({ ...touched, password: true })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#999"
              />
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.registerText}>
                ¿No tienes cuenta? <Text style={styles.registerBold}>Regístrate aquí</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Usuarios de prueba:</Text>
            <View style={styles.demoBox}>
              <Text style={styles.demoLabel}>Usuario Regular:</Text>
              <Text style={styles.demoValue}>maria@example.com</Text>
              <Text style={styles.demoValue}>user123</Text>
            </View>
            <View style={styles.demoBox}>
              <Text style={styles.demoLabel}>Comerciante:</Text>
              <Text style={styles.demoValue}>mati@mechada.com</Text>
              <Text style={styles.demoValue}>merchant123</Text>
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
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  registerBold: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  demoBox: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    maxWidth: 400,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  demoValue: {
    fontSize: 13,
    color: '#1B5E20',
    fontFamily: 'monospace',
  },
});
