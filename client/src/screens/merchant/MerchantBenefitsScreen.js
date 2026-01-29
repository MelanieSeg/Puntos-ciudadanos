import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BenefitCardSkeleton from '../../components/skeletons/BenefitCardSkeleton';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { COLORS, SPACING } from '../../theme/theme';

export default function MerchantBenefitsScreen() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/merchant/benefits');
      setBenefits(response.data.data || []);
    } catch (error) {
      console.error('Error al obtener beneficios:', error);
      setError('No se pudieron cargar los beneficios');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBenefits();
    setRefreshing(false);
  }, []);

  const renderSkeleton = () => <BenefitCardSkeleton />;

  const renderBenefit = ({ item }) => {
    const isLowStock = item.stock < 10 && item.stock > 0;
    const isOutOfStock = item.stock === 0;

    return (
      <View style={[styles.benefitCard, { backgroundColor: theme.surface }]}>
        {/* Badge de stock mejorado */}
        <View style={[
          styles.stockBadge,
          isOutOfStock ? styles.stockBadgeOut : isLowStock ? styles.stockBadgeLow : styles.stockBadgeOk
        ]}>
          <MaterialCommunityIcons 
            name={isOutOfStock ? "alert-circle" : isLowStock ? "alert" : "check-circle"} 
            size={14} 
            color={COLORS.white} 
          />
          <Text style={styles.stockBadgeText}>
            {isOutOfStock ? 'AGOTADO' : isLowStock ? `BAJO STOCK: ${item.stock}` : `${item.stock} disponibles`}
          </Text>
        </View>

        {/* Imagen del beneficio */}
        <View style={styles.benefitImage}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.benefitImageActual}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons 
              name={getBenefitIcon(item.category)} 
              size={48} 
              color={COLORS.merchant} 
            />
          )}
        </View>

        {/* Información */}
        <View style={styles.benefitInfo}>
          <Text style={[styles.benefitName, { color: theme.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.benefitDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Stats Row */}
          <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star" size={16} color={COLORS.merchant} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.pointsCost} pts</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.redeemedCount || 0} canjes</Text>
            </View>
          </View>

          {/* Estado */}
          <View style={styles.statusRow}>
            <View style={[
              styles.statusBadge,
              item.isActive ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {item.isActive ? '✓ Activo' : '⊗ Inactivo'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getBenefitIcon = (category) => {
    const icons = {
      'FOOD': 'food',
      'BEVERAGE': 'cup',
      'DISCOUNT': 'percent',
      'SERVICE': 'wrench',
      'ENTERTAINMENT': 'ticket',
      'PRODUCT': 'package-variant',
    };
    return icons[category] || 'gift';
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="gift-off" size={64} color={COLORS.gray} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin beneficios</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        No tienes beneficios registrados en este momento
      </Text>
    </View>
  );

  // Loading state
  if (loading && benefits.length === 0) {
    return (
      <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={renderSkeleton}
          keyExtractor={(item) => `skeleton-${item}`}
          numColumns={Platform.OS === 'web' ? 3 : 2}
          columnWrapperStyle={Platform.OS === 'web' ? styles.row : styles.rowMobile}
          contentContainerStyle={styles.listContent}
        />
      </ScreenWrapper>
    );
  }

  // Error state
  if (error && benefits.length === 0) {
    return (
      <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="wifi-off" size={64} color={COLORS.gray} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Error de conexión</Text>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBenefits}>
            <MaterialCommunityIcons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
      <FlatList
        data={benefits}
        renderItem={renderBenefit}
        keyExtractor={(item) => item.id.toString()}
        numColumns={Platform.OS === 'web' ? 3 : 2}
        columnWrapperStyle={Platform.OS === 'web' ? styles.row : styles.rowMobile}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.merchant}
            colors={[COLORS.merchant]}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingHorizontal: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
    paddingTop: Platform.OS === 'web' ? 90 : SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  row: {
    justifyContent: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  rowMobile: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  benefitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: Platform.OS === 'web' ? 0 : SPACING.xs,
    marginBottom: SPACING.md,
    width: Platform.OS === 'web' ? '32%' : '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  stockBadgeOk: {
    backgroundColor: '#4CAF50',
  },
  stockBadgeLow: {
    backgroundColor: '#FF9800',
  },
  stockBadgeOut: {
    backgroundColor: '#f44336',
  },
  stockBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  benefitImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  benefitImageActual: {
    width: '100%',
    height: '100%',
  },
  benefitInfo: {
    gap: SPACING.xs,
  },
  benefitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: SPACING.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusRow: {
    marginTop: SPACING.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.merchant,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
