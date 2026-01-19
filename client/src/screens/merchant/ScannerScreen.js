/**
 * ScannerScreen - Pantalla de validación de cupones
 * Permite escanear QR/códigos de validación
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { merchantAPI } from '../../services/api';

export default function ScannerScreen({ navigation }) {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const [lastValidation, setLastValidation] = useState(null);
  const isWeb = Platform.OS === 'web';

  const handleValidate = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Error', 'Ingresa o escanea un código QR');
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener vista previa
      const previewResponse = await merchantAPI.getRedemptionPreview(qrCode);
      const { user, benefit } = previewResponse.data.data;

      // 2. Mostrar alerta de confirmación
      Alert.alert(
        'Confirmar Canje',
        `Cliente: ${user.name}\n\nBeneficio: ${benefit.title}\nDetalle: ${benefit.description}\n\nCosto: ${benefit.pointsCost} puntos`,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setLoading(false) },
          { 
            text: 'Confirmar Canje', 
            onPress: () => confirmRedemption(qrCode),
            style: 'destructive' // En iOS, esto hace el texto rojo
          },
        ]
      );
    } catch (error) {
      handleApiError(error);
      setLoading(false);
    }
  };

  const confirmRedemption = async (code) => {
    try {
      // 3. Si se confirma, realizar el canje final
      const finalResponse = await merchantAPI.validateQR(code);
      
      if (finalResponse.data.success) {
        const { user, benefit } = finalResponse.data.data;
        setLastValidation({
          userName: user.name,
          benefitTitle: benefit.title,
          pointsCost: benefit.pointsCost,
        });
        
        Alert.alert(
          '¡Éxito!',
          `Cupón canjeado correctamente para ${user.name}.`,
          [{ text: 'OK', onPress: () => setQrCode('') }]
        );
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error) => {
    console.error('[ScannerScreen] Error en API:', error.response?.data || error.message);
    
    let errorMsg = 'Ocurrió un error inesperado.';
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    }

    if (error.response?.status === 403) {
      errorMsg = '¡Acceso Denegado! Este cupón pertenece a otro establecimiento.';
    } else if (errorMsg.toLowerCase().includes('ya fue procesado')) {
      errorMsg = 'Este cupón ya fue validado o procesado.';
    } else if (errorMsg.toLowerCase().includes('expirado')) {
      errorMsg = 'Este cupón ha expirado.';
    } else if (errorMsg.toLowerCase().includes('no encontrado')) {
      errorMsg = 'Cupón no encontrado o inválido.';
    }
    
    Alert.alert('Error de Validación', errorMsg);
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.subtitle, { color: theme.textSecondary, marginBottom: SPACING.lg, marginHorizontal: SPACING.md }]}>
          {isWeb ? 'Ingresa el código QR del cliente' : 'Escanea el código QR del cliente'}
        </Text>

      {/* En Web: Input manual del código */}
      {isWeb && (
        <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color={COLORS.merchant} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={qrCode}
            onChangeText={setQrCode}
            placeholder="Código QR o ID de transacción"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {qrCode.length > 0 && (
            <TouchableOpacity onPress={() => setQrCode('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* En Móvil: Botón para abrir cámara */}
      {!isWeb && (
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => navigation.navigate('QRScanner')}
          activeOpacity={0.7}
        >
          <View style={styles.cameraButtonContent}>
            <MaterialCommunityIcons name="camera" size={48} color={COLORS.white} />
            <Text style={styles.cameraButtonText}>Abrir Cámara</Text>
            <Text style={styles.cameraButtonSubtext}>Escanear código QR</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* En Móvil: Input manual alternativo */}
      {!isWeb && (
        <View style={styles.orDivider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>o ingresa manualmente</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>
      )}

      {/* Input manual también para móvil (como alternativa) */}
      {!isWeb && (
        <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="qrcode" size={24} color={COLORS.merchant} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={qrCode}
            onChangeText={setQrCode}
            placeholder="Código QR o ID"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {qrCode.length > 0 && (
            <TouchableOpacity onPress={() => setQrCode('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Última validación exitosa */}
      {lastValidation && (
        <View style={[styles.successBox, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="check-circle" size={32} color={COLORS.success} />
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>¡Validado!</Text>
            <Text style={[styles.successText, { color: theme.text }]}>
              Cliente: {lastValidation.userName}
            </Text>
            <Text style={[styles.successText, { color: theme.text }]}>
              Beneficio: {lastValidation.benefitTitle}
            </Text>
            <Text style={styles.successPoints}>
              {lastValidation.pointsCost} puntos
            </Text>
          </View>
        </View>
      )}

      {/* Botón para procesar escaneo */}
      <TouchableOpacity 
        style={[styles.scanButton, loading && styles.scanButtonDisabled]} 
        onPress={handleValidate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <>
            <MaterialCommunityIcons 
              name={isWeb ? "check-circle" : "camera-plus"} 
              size={24} 
              color={COLORS.white} 
            />
            <Text style={styles.scanButtonText}>
              {isWeb ? 'Validar Cupón' : 'Procesar Escaneo'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Información */}
      <View style={[styles.infoBox, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name="information" size={24} color={COLORS.primary} style={styles.infoIcon} />
        <View>
          <Text style={[styles.infoTitle, { color: theme.text }]}>Información</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {isWeb 
              ? '• Ingresa el código QR del cliente\n• Validación en tiempo real\n• Historial automático'
              : '• Escanea códigos QR válidos\n• Validación en tiempo real\n• Historial automático'
            }
          </Text>
        </View>
      </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'web' ? 90 : SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  // Estilos para input manual (Web)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md, // Margen lateral
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.merchant,
    ...LAYOUT.shadowMedium,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.dark,
    paddingVertical: SPACING.sm,
    outlineStyle: 'none', // Para web
  },
  clearButton: {
    padding: SPACING.xs,
  },
  // Bot\u00f3n grande de c\u00e1mara para m\u00f3vil
  cameraButton: {
    backgroundColor: COLORS.merchant,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.xl * 1.5,
    marginHorizontal: SPACING.md, // Margen lateral
    marginVertical: SPACING.xl,
    alignItems: 'center',
    ...LAYOUT.shadowMedium,
  },
  cameraButtonContent: {
    alignItems: 'center',
  },
  cameraButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  cameraButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: TYPOGRAPHY.body2,
    marginTop: SPACING.xs,
  },
  // Divider "o"
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.light,
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.caption,
  },
  // Estilos para scanner de c\u00e1mara (Móvil - deprecado, ahora se usa QRScannerScreen)
  scannerContainer: {
    marginVertical: SPACING.xl,
    alignItems: 'center',
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.merchant,
    borderRadius: LAYOUT.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lighter,
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.merchant,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scannerIcon: {
    marginBottom: SPACING.sm,
  },
  scannerText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  scannerInstruction: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  // Success box
  successBox: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md, // Margen lateral
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    ...LAYOUT.shadowMedium,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  successText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  successPoints: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.merchant,
    marginTop: SPACING.xs,
  },
  // Botón de validación
  scanButton: {
    backgroundColor: COLORS.merchant,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.md, // Margen lateral
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    ...LAYOUT.shadowMedium,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md, // Margen lateral
    flexDirection: 'row',
    gap: SPACING.md,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    lineHeight: 22,
  },
});
