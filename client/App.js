/**
 * App.js - Root de la aplicación
 * Orquesta la navegación basada en estado de autenticación y rol del usuario
 */

import React, { useContext } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import SplashScreen from './src/screens/SplashScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import UserNavigator from './src/navigation/UserNavigator';
import MerchantNavigator from './src/navigation/MerchantNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import { COLORS } from './src/theme/theme';

// Configuración del QueryClient para caché inteligente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos por defecto
      cacheTime: 1000 * 60 * 30, // 30 minutos en caché
      refetchOnWindowFocus: true, // Actualizar al volver a la app
      refetchOnReconnect: true, // Actualizar al reconectar internet
      retry: 2, // Reintentar 2 veces en caso de error
    },
  },
});

const RootStack = createNativeStackNavigator();

/**
 * RootNavigator
 * Decide qué Navigator mostrar según:
 * 1. Si está cargando: SplashScreen
 * 2. Si no hay usuario: AuthNavigator
 * 3. Si hay usuario: Navigator según su rol
 */
function RootNavigator({ authState }) {
  // Mientras está cargando
  if (authState.loading) {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
        }}
      >
        <RootStack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animationEnabled: false }}
        />
      </RootStack.Navigator>
    );
  }

  // Si no está autenticado
  if (!authState.authenticated) {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animationEnabled: false }}
        />
      </RootStack.Navigator>
    );
  }

  // Si está autenticado pero debe cambiar contraseña
  if (authState.user && authState.user.mustChangePassword) {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
        }}
      >
        <RootStack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ 
            animationEnabled: false,
            gestureEnabled: false, // No permitir regresar con gestos
          }}
        />
      </RootStack.Navigator>
    );
  }

  // Si está autenticado, mostrar navigator según rol
  if (authState.role === 'MERCHANT') {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        <RootStack.Screen
          name="MerchantApp"
          component={MerchantNavigator}
          options={{ animationEnabled: false }}
        />
      </RootStack.Navigator>
    );
  }

  if (authState.role === 'MASTER_ADMIN' || authState.role === 'SUPPORT_ADMIN') {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        <RootStack.Screen
          name="AdminApp"
          component={AdminNavigator}
          options={{ animationEnabled: false }}
        />
      </RootStack.Navigator>
    );
  }

  // Por defecto USER (o sin rol definido)
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <RootStack.Screen
        name="UserApp"
        component={UserNavigator}
        options={{ animationEnabled: false }}
      />
    </RootStack.Navigator>
  );
}

/**
 * AppContent
 * Lee el AuthContext y renderiza el Navigator apropiado
 */
function AppContent() {
  const { authState } = useContext(AuthContext);

  // Mientras carga la autenticación, mostrar spinner
  if (authState.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator authState={authState} />
    </NavigationContainer>
  );
}

/**
 * App Principal
 */
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
