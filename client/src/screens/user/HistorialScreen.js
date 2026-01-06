import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { useInfiniteTransactions } from '../../hooks/useUserData';

export default function HistorialScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // React Query Infinite Query - Paginación de 20 items por página
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions(20);

  // Aplanar todas las páginas de transacciones
  const transactions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Procesar y formatear transacciones con useMemo
  const allHistorial = useMemo(() => {
    return transactions.map(t => {
      const isMissionApproved = t.type === 'EARNED' && t.description?.includes('Misión aprobada');
      
      const iconMap = {
        EARNED: isMissionApproved ? 'trophy' : 'plus-circle',
        SPENT: 'gift',
        TRANSFER: 'swap-horizontal',
      };
      
      const colorMap = {
        EARNED: '#4CAF50',
        SPENT: '#f44336',
        TRANSFER: '#2196F3',
      };

      return {
        id: t.id,
        title: t.description || 'Transacción',
        description: t.type === 'EARNED' 
          ? (isMissionApproved ? 'Misión completada' : 'Puntos ganados')
          : t.type === 'SPENT' 
            ? 'Beneficio canjeado' 
            : 'Transferencia',
        points: `${t.type === 'EARNED' ? '+' : '-'}${t.amount}`,
        color: colorMap[t.type] || '#9C27B0',
        icon: iconMap[t.type] || 'history',
        date: t.createdAt,
        type: t.type,
        metadata: t.metadata,
        benefitId: t.benefitId,
      };
    });
  }, [transactions]);
  
  // Filtrar transacciones con useMemo
  const historial = useMemo(() => {
    if (activeFilter === 'Todos') {
      return allHistorial;
    }
    return allHistorial.filter(item => item.type === activeFilter);
  }, [activeFilter, allHistorial]);

  const applyFilter = (filter) => {
    setActiveFilter(filter);
  };

  const onRefresh = async () => {
    await refetch();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Hace un momento';
    }
    if (diffMins < 60) {
      return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return `${day} ${month} ${year}, ${time}`;
  };

  const handleViewRedemption = (item) => {
    navigation.navigate('QRCode', {
      qrCode: item.metadata?.qrCode,
      benefitName: item.title,
      benefitId: item.benefitId,
    });
  };

  const handleViewEarnedDetail = (item) => {
    setSelectedDetail(item);
    setShowDetailModal(true);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Cargando más transacciones...</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.historialItem}>
      <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.pointsContainer}>
        <Text style={[styles.itemPoints, { color: item.color }]}>{item.points}</Text>
        {item.type === 'EARNED' && (
          <View style={[styles.typeBadge, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.typeBadgeText, { color: '#4CAF50' }]}>Ganado</Text>
          </View>
        )}
        {item.type === 'SPENT' && (
          <View style={[styles.typeBadge, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.typeBadgeText, { color: '#f44336' }]}>Gastado</Text>
          </View>
        )}
      </View>
      {item.type === 'EARNED' && (
        <TouchableOpacity 
          style={[styles.detailButton, { backgroundColor: item.color }]}
          onPress={() => handleViewEarnedDetail(item)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="eye" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
      {item.type === 'SPENT' && item.metadata?.qrCode && (
        <TouchableOpacity 
          style={styles.qrButton}
          onPress={() => handleViewRedemption(item)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="qrcode" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderListHeader = () => (
    <>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitleRow}>
            <MaterialCommunityIcons name="filter-variant" size={20} color={COLORS.primary} />
            <Text style={styles.filterLabel}>Filtrar Transacciones</Text>
          </View>
          <View style={styles.filterButtons}>
            {['Todos', 'EARNED', 'SPENT'].map((filter) => {
              const isActive = activeFilter === filter;
              const displayName = filter === 'Todos' ? 'Todos' : filter === 'EARNED' ? 'Ganado' : 'Gastado';
              const count = filter === 'Todos' ? allHistorial.length : 
                           allHistorial.filter(item => item.type === filter).length;
              
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => applyFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                    {displayName}
                  </Text>
                  {filter === 'Todos' && (
                    <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                      <Text style={styles.countText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.error} />
          <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="history" size={64} color={COLORS.gray} />
      <Text style={styles.emptyText}>No hay transacciones aún</Text>
      <Text style={styles.emptySubtext}>Comienza a ganar puntos completando misiones</Text>
    </View>
  );

  if (isLoading && !transactions.length) {
    return (
      <ScreenWrapper bgColor={COLORS.light} safeArea={false}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0}>
      <FlatList
        data={historial}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={!error ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading && transactions.length > 0} 
            onRefresh={onRefresh} 
          />
        }
        contentContainerStyle={styles.flatListContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />

      {/* Modal de Detalle de Transacción */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons 
                name={selectedDetail?.icon || 'information'} 
                size={28} 
                color={selectedDetail?.color || COLORS.primary} 
              />
              <Text style={styles.modalTitle}>Detalle de Transacción</Text>
              <TouchableOpacity 
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {selectedDetail && (
              <View style={styles.detailContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Título</Text>
                  <Text style={styles.detailValue}>{selectedDetail.title}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Descripción</Text>
                  <Text style={styles.detailValue}>{selectedDetail.description}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Puntos</Text>
                  <Text style={[styles.detailValue, { color: selectedDetail.color, fontWeight: '700' }]}>
                    {selectedDetail.points}
                  </Text>
                </View>

                {selectedDetail.metadata?.submittedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha de Solicitud</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedDetail.metadata.submittedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}

                {selectedDetail.metadata?.approvedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha de Aprobación</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedDetail.metadata.approvedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha de Transacción</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedDetail.date)}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flatListContent: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexGrow: 1,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
    ...(Platform.OS === 'web' && {
      paddingVertical: SPACING.md,
    }),
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.light,
    gap: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  countBadge: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.body2,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.body2,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.h6,
    fontWeight: '600',
    color: COLORS.dark,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    textAlign: 'center',
  },
  listContainer: {
    gap: SPACING.md,
  },
  historialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.md,
    paddingRight: 0,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.light,
    minHeight: 76,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  itemDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
  },
  pointsContainer: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  itemPoints: {
    fontWeight: '700',
    fontSize: 16,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  qrButton: {
    width: 50,
    alignSelf: 'stretch',
    marginVertical: -SPACING.md,
    marginRight: -1,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButton: {
    width: 50,
    alignSelf: 'stretch',
    marginVertical: -SPACING.md,
    marginRight: -1,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footerText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  modalTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.h6,
    fontWeight: '700',
    color: COLORS.dark,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  detailContent: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    gap: SPACING.xs,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.dark,
    lineHeight: 22,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
});
