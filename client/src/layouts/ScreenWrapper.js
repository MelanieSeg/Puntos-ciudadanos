// src/layouts/ScreenWrapper.js
/**
 * ScreenWrapper - Contenedor responsivo
 * Maneja diferencias entre Web y Mobile
 * Aplica SafeAreaView en mobile y max-width en web
 * Detecta contexto admin para ajustar paddings
 */

import React from 'react';
import { View, Platform, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LAYOUT, COLORS, SPACING } from '../theme/theme';

const ScreenWrapper = ({
  children,
  safeArea = true,
  bgColor = COLORS.white,
  padding = SPACING.md,
  maxWidth = true,
  isAdminPanel = false, // Nueva prop para detectar contexto admin
  noPadding = false, // Opción para eliminar padding completamente
}) => {
  const isWeb = Platform.OS === 'web';

  // Para web, aplicar max-width y centrado
  // En admin panel, usar ancho completo sin restricciones
  const webStyles = isWeb && maxWidth && !isAdminPanel
    ? {
        maxWidth: LAYOUT.webMaxWidth,
        width: '100%',
        alignSelf: 'center',
        marginHorizontal: 'auto',
      }
    : {};

  // En admin panel web, usar paddings más amplios para dashboards
  const getPadding = () => {
    if (noPadding || padding === 0) return { paddingHorizontal: 0, paddingVertical: 0 };
    
    if (isWeb) {
      if (isAdminPanel) {
        // Admin panel: paddings más generosos
        return {
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING.lg,
        };
      }
      // Web normal
      return {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
      };
    }
    
    // Mobile
    return {
      paddingHorizontal: padding,
      paddingVertical: padding,
    };
  };

  const Container = safeArea && !isWeb ? SafeAreaView : View;

  return (
    <Container
      style={[
        styles.container,
        { backgroundColor: bgColor },
      ]}
    >
      <View
        style={[
          styles.content,
          webStyles,
          getPadding(),
        ]}
      >
        {children}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
  },
});

export default ScreenWrapper;
