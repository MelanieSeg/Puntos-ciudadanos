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
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import * as validators from '../utils/validators';
import { getErrorMessage } from '../utils/errorHandler';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { login } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { theme, isDarkMode, toggleTheme } = useTheme();

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
              <MaterialCommunityIcons name="leaf" size={80} color="#fff" style={{ marginBottom: 20 }} />
              <Text style={styles.brandingTitle}>Puntos Ciudadanos</Text>
              <Text style={styles.brandingSubtitle}>
                Energía CO2 Neutral.{'\n'}
                Únete a la comunidad que premia tus contribuciones a la sociedad.
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
                <Text style={[styles.desktopTitle, { color: theme.text }]}>Bienvenido</Text>
                <Text style={[styles.desktopSubtitle, { color: theme.textSecondary }]}>Ingresa a tu cuenta para continuar</Text>
              </View>
            )}

            <View style={styles.form}>
            {/* Campo Email */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
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
                placeholderTextColor={theme.textSecondary}
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
                placeholder="Ingresa tu contraseña"
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched({ ...touched, password: true })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor={theme.textSecondary}
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
              style={styles.forgotPasswordLink}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.textSecondary }]}>
                ¿Olvidaste tu contraseña?
              </Text>
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
    marginBottom: 40,
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
  forgotPasswordLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  registerLink: {
    marginTop: 24,
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
});
