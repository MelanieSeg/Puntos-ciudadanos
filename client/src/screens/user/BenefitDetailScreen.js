/**
 * BenefitDetailScreen - Detalles de Beneficio
 * Pantalla que muestra información completa de un beneficio antes de canjearlo
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { benefitsAPI, pointsAPI, walletAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getErrorMessage } from '../../utils/errorHandler';

// Helper para alertas multiplataforma
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    // En web, usar window.confirm
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed && buttons) {
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function BenefitDetailScreen({ route, navigation }) {
  const { benefitId, benefit, userBalance: initialBalance } = route.params || {};
  const { authState } = useContext(AuthContext);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [userBalance, setUserBalance] = useState(initialBalance || 0);

  useEffect(() => {
    // Cargar balance actualizado
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      const user = response.data?.data;
      setUserBalance(user?.wallet?.balance || 0);
    } catch (error) {
      console.error('[BenefitDetail] Error al cargar balance:', error);
    }
  };

  const data = benefit || {
    id: benefitId,
    title: 'Beneficio',
    description: 'Descripción no disponible',
    pointsCost: 0,
    stock: 0,
    active: false,
  };

  const canRedeem = userBalance >= data.pointsCost && data.stock > 0 && data.active;
  const insufficientBalance = userBalance < data.pointsCost;
  const noStock = data.stock <= 0;

  const handleRedeem = () => {
    console.log('[BenefitDetail] handleRedeem llamado');
    console.log('[BenefitDetail] canRedeem:', canRedeem);
    console.log('[BenefitDetail] userBalance:', userBalance);
    console.log('[BenefitDetail] pointsCost:', data.pointsCost);
    console.log('[BenefitDetail] stock:', data.stock);
    console.log('[BenefitDetail] active:', data.active);

    if (!canRedeem) {
      console.log('[BenefitDetail] No puede canjear - mostrando alerta');
      if (insufficientBalance) {
        showAlert(
          'Saldo Insuficiente',
          `Necesitas ${data.pointsCost} puntos para canjear este beneficio.\n\nTu saldo actual: ${userBalance} puntos\nFaltan: ${data.pointsCost - userBalance} puntos`,
          [{ text: 'Entendido', style: 'default' }]
        );
      } else if (noStock) {
        showAlert(
          'Sin Stock',
          'Este beneficio ya no está disponible en este momento.',
          [{ text: 'Entendido', style: 'default' }]
        );
      }
      return;
    }

    console.log('[BenefitDetail] Mostrando confirmación de canje');
    showAlert(
      'Confirmar Canje',
      `¿Deseas canjear "${data.title}" por ${data.pointsCost} puntos?\n\nSaldo actual: ${userBalance} pts\nSaldo después: ${userBalance - data.pointsCost} pts`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear',
          style: 'default',
          onPress: processRedeem,
        },
      ]
    );
  };

  const processRedeem = async () => {
    try {
      setIsRedeeming(true);
      
      const response = await pointsAPI.redeemBenefit(data.id);
      console.log('[BenefitDetail] Respuesta del canje:', response.data);
      
      // Actualizar balance local
      const newBalance = userBalance - data.pointsCost;
      setUserBalance(newBalance);
      
      const redemption = response.data?.data?.redemption;
      
      // Navegar directamente después del canje exitoso (sin alert en web)
      if (Platform.OS === 'web') {
        // En web, navegar inmediatamente sin mostrar alert
        console.log('[BenefitDetail] Navegando a QRCode con:', {
          redemptionId: redemption?.id,
          qrCode: redemption?.qrCode,
          benefitName: data.title,
        });
        navigation.navigate('QRCode', {
          redemptionId: redemption?.id,
          qrCode: redemption?.qrCode,
          benefitName: data.title,
          benefitId: data.id,
          expiresAt: redemption?.expiresAt,
        });
      } else {
        // En móvil, mostrar alert con opciones
        showAlert(
          '¡Beneficio Canjeado!',
          `Has canjeado exitosamente "${data.title}".\n\nNuevo saldo: ${newBalance} puntos`,
          [
            {
              text: 'Ver QR',
              onPress: () => {
                navigation.navigate('QRCode', {
                  redemptionId: redemption?.id,
                  qrCode: redemption?.qrCode,
                  benefitName: data.title,
                  benefitId: data.id,
                  expiresAt: redemption?.expiresAt,
                });
              },
            },
            {
              text: 'Volver',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('[BenefitDetail] Error al canjear:', error);
      const errorMessage = getErrorMessage(error);
      
      if (error.response?.status === 400 || error.response?.status === 402) {
        showAlert(
          'No se pudo canjear',
          errorMessage || 'No tienes suficientes puntos para este beneficio.',
          [{ text: 'Entendido', style: 'default' }]
        );
      } else {
        showAlert(
          'Error',
          errorMessage || 'Ocurrió un error al canjear el beneficio. Intenta nuevamente.',
          [{ text: 'Entendido', style: 'default' }]
        );
      }
      
      // Recargar balance por si cambió
      await loadBalance();
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Detalles</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Benefit Card */}
        <View style={styles.heroCard}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="gift" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.benefitName}>{data.title}</Text>
          {data.merchant && (
            <Text style={styles.provider}>
              {data.merchant?.merchantProfile?.storeName || data.merchant?.name || 'Comercio'}
            </Text>
          )}

          <View style={styles.pointsBadge}>
            <MaterialCommunityIcons name="star" size={20} color={COLORS.white} />
            <Text style={styles.pointsText}>{data.pointsCost} puntos</Text>
          </View>
        </View>

        {/* Balance del usuario */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Tu saldo:</Text>
            <Text style={[
              styles.balanceAmount,
              insufficientBalance && styles.balanceInsufficient
            ]}>
              {userBalance} pts
            </Text>
          </View>
          {insufficientBalance && (
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.warning} />
              <Text style={styles.warningText}>
                Te faltan {data.pointsCost - userBalance} puntos
              </Text>
            </View>
          )}
          {noStock && (
            <View style={[styles.warningBox, styles.errorBox]}>
              <MaterialCommunityIcons name="package-variant-closed" size={20} color={COLORS.error} />
              <Text style={[styles.warningText, styles.errorText]}>
                Sin stock disponible
              </Text>
            </View>
          )}
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{data.description}</Text>
        </View>

        {/* Puntos & Disponibilidad */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="star" size={28} color={COLORS.warning} />
            <Text style={styles.infoLabel}>Costo</Text>
            <Text style={styles.infoValue}>{data.pointsCost} pts</Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons 
              name="package" 
              size={28} 
              color={noStock ? COLORS.error : COLORS.info} 
            />
            <Text style={styles.infoLabel}>Stock</Text>
            <Text style={[
              styles.infoValue,
              noStock && styles.infoValueError
            ]}>
              {data.stock}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons 
              name={data.active ? "check-circle" : "close-circle"} 
              size={28} 
              color={data.active ? COLORS.success : COLORS.error} 
            />
            <Text style={styles.infoLabel}>Estado</Text>
            <Text style={styles.infoValue}>{data.active ? 'Activo' : 'Inactivo'}</Text>
          </View>
        </View>

        {/* Espaciado */}
        <View style={{ height: SPACING.lg }} />
      </ScrollView>

      {/* Botón Canjear */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.redeemButton,
            !canRedeem && styles.redeemButtonDisabled,
          ]}
          onPress={handleRedeem}
          disabled={!canRedeem || isRedeeming}
        >
          {isRedeeming ? (
            <>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.redeemButtonText}>Canjeando...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="gift" size={20} color={COLORS.white} />
              <Text style={styles.redeemButtonText}>
                {insufficientBalance ? `Faltan ${data.pointsCost - userBalance} pts` : 
                 noStock ? 'Sin Stock' :
                 'Canjear Ahora'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  benefitName: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  provider: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.white,
  },
  balanceSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadowSmall,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
  },
  balanceAmount: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  balanceInsufficient: {
    color: COLORS.error,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: '#fff3cd',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  warningText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
  },
  errorText: {
    color: COLORS.error,
  },
  discountBadge: {
    backgroundColor: '#fff3cd',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
  },
  discountText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.warning,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.xs,
  },
  infoValueError: {
    color: COLORS.error,
  },
  validitySection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadowSmall,
  },
  validityInfo: {
    flex: 1,
  },
  validityLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  validityDate: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: SPACING.xs,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  termText: {
    flex: 1,
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    lineHeight: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  requirementText: {
    flex: 1,
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    lineHeight: 20,
  },
  ratingSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadowSmall,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginLeft: SPACING.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#ffebee',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
  },
  warningText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.danger,
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
});
