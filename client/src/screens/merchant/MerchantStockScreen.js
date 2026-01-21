/**
 * MerchantStockScreen - Stock Disponible de Beneficios
 * Pantalla para comercios: ver stock disponible y configurar beneficios del mes
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';

export default function MerchantStockScreen({ navigation }) {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBenefits();
    }, [])
  );

  const loadBenefits = async () => {
    try {
      setLoading(true);
      // Por hacer: conectar a GET /api/v1/merchant/benefits
      // const response = await merchantAPI.getBenefits();
      // setBenefits(response.data.data);
      setBenefits([]);
    } catch (error) {
      console.error('Error loading benefits:', error);
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBenefits();
    setRefreshing(false);
  };

  const handleRequestRestock = (benefit) => {
    // Por hacer: conectar a POST /api/v1/merchant/benefits/{id}/request-restock
    alert('Solicitud de reabastecimiento enviada para: ' + benefit.name);
  };

  const getStockStatus = (stock, maxStock) => {
    const percentage = (stock / maxStock) * 100;
    if (percentage === 0) return { color: COLORS.danger, label: 'Agotado' };
    if (percentage <= 25) return { color: COLORS.warning, label: 'Bajo' };
    if (percentage <= 50) return { color: COLORS.info, label: 'Medio' };
    return { color: COLORS.success, label: 'Disponible' };
  };

  const renderBenefitCard = ({ item }) => {
    const status = getStockStatus(item.stock, item.maxStock);
    const daysLeft = Math.ceil(
      (item.validUntil - new Date()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View style={styles.card}>
        {/* Beneficio Info */}
        <View style={styles.benefitInfo}>
          <Text style={styles.benefitName}>{item.name}</Text>
          <Text style={styles.benefitDescription}>{item.description}</Text>
        </View>

        {/* Stock Bar */}
        <View style={styles.stockSection}>
          <View style={styles.stockHeader}>
            <Text style={styles.stockLabel}>Stock</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <View style={styles.stockBar}>
            <View
              style={[
                styles.stockFill,
                {
                  width: `${(item.stock / item.maxStock) * 100}%`,
                  backgroundColor: status.color,
                },
              ]}
            />
          </View>
          <View style={styles.stockInfo}>
            <Text style={styles.stockText}>
              {item.stock} de {item.maxStock} disponibles
            </Text>
            <Text style={styles.redeemedText}>
              {item.redeemed} canjeados
            </Text>
          </View>
        </View>

        {/* Validity */}
        <View style={styles.validitySection}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.gray} />
          <Text style={styles.validityText}>
            Válido por {daysLeft} día{daysLeft !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
      {/* Lista */}
      <FlatList
        data={benefits}
        renderItem={renderBenefitCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.subtitle}>Beneficios disponibles este mes</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="gift" size={24} color={COLORS.primary} />
                <View>
                  <Text style={styles.statNumber}>
                    {benefits.filter(b => b.isActive).length}
                  </Text>
                  <Text style={styles.statLabel}>Activos</Text>
                </View>
              </View>

              <View style={styles.stat}>
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
                <View>
                  <Text style={styles.statNumber}>
                    {benefits.reduce((a, b) => a + b.redeemed, 0)}
                  </Text>
                  <Text style={styles.statLabel}>Canjeados</Text>
                </View>
              </View>

              <View style={styles.stat}>
                <MaterialCommunityIcons name="package" size={24} color={COLORS.info} />
                <View>
                  <Text style={styles.statNumber}>
                    {benefits.reduce((a, b) => a + b.stock, 0)}
                  </Text>
                  <Text style={styles.statLabel}>En Stock</Text>
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={48} color={COLORS.light} />
            <Text style={styles.emptyText}>Sin beneficios configurados</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  title: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.sm,
    ...LAYOUT.shadowSmall,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'web' ? 90 : SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md, // Agregado para que no toque los bordes
    marginBottom: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  benefitInfo: {
    marginBottom: SPACING.md,
  },
  benefitName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  benefitDescription: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  stockSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stockLabel: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statusBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  stockBar: {
    height: 8,
    backgroundColor: COLORS.light,
    borderRadius: 4,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  stockFill: {
    height: '100%',
    borderRadius: 4,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.dark,
    fontWeight: '600',
  },
  redeemedText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  validitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  validityText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
});
