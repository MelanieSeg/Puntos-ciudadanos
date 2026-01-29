import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../theme/theme';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.toLowerCase().trim() });
      
      Alert.alert(
        'Correo Enviado',
        'Si el correo está registrado, recibirás un email con un enlace para restablecer tu contraseña. Abre el enlace en tu navegador (Chrome, Safari, etc.).',
        [{ text: 'Entendido', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      const msg = getErrorMessage(error);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="lock-reset" size={64} color={COLORS.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>Recuperar Contraseña</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Ingresa tu correo electrónico y te enviaremos un enlace que deberás abrir en tu navegador web para crear una nueva contraseña.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              placeholder="tu@email.com"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar Enlace</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 30, alignItems: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  iconContainer: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { backgroundColor: '#A5D6A7' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: { padding: 10, alignItems: 'center' },
  backButtonText: { color: '#666', fontSize: 14, fontWeight: '500' },
});