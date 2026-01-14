/**
 * QRCodeScreen - Código QR de Beneficio Canjeado
 * Pantalla que muestra el QR para redimir un beneficio en comercio
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function QRCodeScreen({ route, navigation }) {
  const { redemptionId, qrCode, benefitName, benefitId, expiresAt } = route.params || {};
  const { theme } = useTheme();

  const displayQRCode = qrCode || 'QR-' + Date.now();
  const expiryDate = expiresAt ? new Date(expiresAt) : null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mi código de beneficio: ${displayQRCode}\n\nBeneficio: ${benefitName}`,
        title: benefitName,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyCode = () => {
    // Por hacer: implementar portapapeles nativa
    // Clipboard.setString(displayQRCode);
    alert('Código copiado: ' + displayQRCode);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={28} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Código QR</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Benefit Info */}
        <View style={styles.benefitCard}>
          <MaterialCommunityIcons name="gift" size={32} color={COLORS.primary} />
          <Text style={styles.benefitName}>{benefitName || 'Beneficio'}</Text>
        </View>

        {/* Código QR - Redención */}
        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <QRCode 
              value={displayQRCode}
              size={240}
              color={COLORS.dark}
              backgroundColor={COLORS.white}
            />
          </View>
        </View>

        {/* Código */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Tu Código de Canje</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code} numberOfLines={1}>{displayQRCode}</Text>
            <TouchableOpacity onPress={handleCopyCode}>
              <MaterialCommunityIcons name="content-copy" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {expiryDate && (
            <Text style={[styles.expiryText, { color: theme.textSecondary }]}>
              Válido hasta: {expiryDate.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </Text>
          )}
        </View>

        {/* Instrucciones */}
        <View style={styles.instructions}>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Muestra este código</Text>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>Al comerciante en el punto de venta para validar tu beneficio</Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Verifica el descuento</Text>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>El comercio aplicará el descuento a tu compra</Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Revisa tu historial</Text>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>Si pierdes este código, podrás recuperarlo en tu historial de transacciones</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botones de Acción */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },
  benefitCard: {
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: '100%',
  },
  benefitName: {
    fontSize: TYPOGRAPHY.h6,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.sm,
  },
  qrContainer: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  qrBox: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  qrPlaceholder: {
    width: width - SPACING.lg * 2,
    height: width - SPACING.lg * 2,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.light,
    ...LAYOUT.shadowSmall,
  },
  qrText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
  qrSubtext: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  codeCard: {
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    width: '100%',
    marginBottom: SPACING.md,
  },
  codeLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  code: {
    flex: 1,
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  expiryText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    width: '100%',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
  },
  stepText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
});
