/**
 * SubmissionsApprovalScreen - Gestión de Solicitudes
 * Pantalla crítica para administrador: revisar y aprobar/rechazar envíos de usuarios
 * Ahora con paginación infinita para manejar miles de envíos
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { adminAPI } from '../../services/api';
import { useInfiniteSubmissions } from '../../hooks/useUserData';

export default function SubmissionsApprovalScreen({ navigation }) {
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  
  // React Query Infinite Query - Paginación de 20 envíos por página
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSubmissions(filter, 20);

  // Modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'approve'|'reject', submissionId, reason? }

  // Aplanar todas las páginas
  const rawSubmissions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Formatear datos
  const submissions = useMemo(() => {
    return rawSubmissions.map(sub => ({
      id: sub.id,
      userId: sub.userId,
      userName: sub.user?.name || 'Usuario desconocido',
      userEmail: sub.user?.email || 'sin email',
      missionId: sub.missionId,
      missionName: sub.mission?.name || 'Misión desconocida',
      evidenceUrl: sub.evidenceUrl,
      observation: sub.observation || '',
      status: sub.status,
      submittedAt: sub.createdAt,
      points: sub.mission?.points || 0,
    }));
  }, [rawSubmissions]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const onRefresh = async () => {
    await refetch();
  };

  const handleApprove = (submissionId) => {
    setPendingAction({ type: 'approve', submissionId });
    setShowConfirmModal(true);
  };

  const handleReject = (submissionId) => {
    setPendingAction({ type: 'reject', submissionId });
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    
    setShowConfirmModal(false);
    
    if (pendingAction.type === 'approve') {
      await approveSubmissionDirectly(pendingAction.submissionId);
    } else if (pendingAction.type === 'reject') {
      await rejectSubmissionDirectly(pendingAction.submissionId, pendingAction.reason || 'Rechazado por el administrador');
    }
    
    setPendingAction(null);
  };

  const cancelAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const approveSubmissionDirectly = async (submissionId) => {
    try {
      await adminAPI.approveSubmission(submissionId, null);
      Alert.alert('Éxito', 'Envío aprobado y puntos otorgados');
      
      // Recargar la lista completa
      await refetch();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.data?.message || error.response?.data?.message || error.message || 'Error al aprobar');
    }
  };

  const rejectSubmissionDirectly = async (submissionId, reason) => {
    try {
      await adminAPI.rejectSubmission(submissionId, reason);
      Alert.alert('Éxito', 'Envío rechazado');
      
      // Recargar la lista completa
      await refetch();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.data?.message || error.response?.data?.message || 'Error al rechazar');
    }
  };

  const renderSubmissionCard = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('SubmissionDetail', {
            submissionId: item.id,
            submission: item,
          })
        }
      >
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.userEmail}>{item.userEmail}</Text>
          </View>
          <View style={[styles.badge, { 
            backgroundColor: item.status === 'PENDING' ? '#fff3cd' : item.status === 'APPROVED' ? '#d4edda' : '#f8d7da' 
          }]}> 
            <Text style={styles.badgeText}>
              {item.status === 'PENDING' ? 'Pendiente' : item.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
            </Text>
          </View>
        </View>
        <View style={styles.missionSection}>
          <View style={styles.missionHeader}>
            <MaterialCommunityIcons name="target" size={20} color={COLORS.primary} />
            <View style={styles.missionDetails}>
              <Text style={styles.missionName}>{item.missionName}</Text>
              <Text style={styles.points}>{`+${item.points} puntos`}</Text>
            </View>
          </View>
        </View>
        {!!item.observation && (
          <View style={styles.descriptionSection}>
            <Text style={styles.description} numberOfLines={2}>
              {item.observation}
            </Text>
          </View>
        )}
        <View style={styles.attachmentsInfo}>
          <MaterialCommunityIcons name="file-image" size={16} color={COLORS.gray} />
          <Text style={styles.attachmentsCount}>Evidencia adjunta</Text>
          <Text style={styles.submittedTime}>
            {(() => {
              const diffMs = Date.now() - new Date(item.submittedAt).getTime();
              const diffMins = Math.round(diffMs / 60000);
              const diffHours = Math.round(diffMs / 3600000);
              const diffDays = Math.round(diffMs / 86400000);
              if (diffMins < 60) return `${diffMins} min atrás`;
              if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} atrás`;
              return `${diffDays} ${diffDays === 1 ? 'día' : 'días'} atrás`;
            })()}
          </Text>
        </View>
      </TouchableOpacity>
      {item.status === 'PENDING' ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.error} />
            <Text style={styles.rejectButtonText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
          >
            <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.white} />
            <Text style={styles.approveButtonText}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.detailButton]}
            onPress={() =>
              navigation.navigate('SubmissionDetail', {
                submissionId: item.id,
                submission: item,
              })
            }
          >
            <MaterialCommunityIcons name="eye" size={18} color={COLORS.primary} />
            <Text style={styles.detailButtonText}>Ver Detalle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Cargando más envíos...</Text>
      </View>
    );
  };

  if (isLoading && !submissions.length) {
    return (
      <ScreenWrapper bgColor={COLORS.light} safeArea={false}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0}>
      <View style={styles.filters}>
        {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filter === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text style={[
                styles.filterButtonText,
                filter === status && styles.filterButtonTextActive,
              ]}>
              {status === 'PENDING' ? 'Pendientes' : status === 'APPROVED' ? 'Aprobados' : 'Rechazados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList 
        data={submissions} 
        renderItem={renderSubmissionCard} 
        keyExtractor={item => item.id} 
        contentContainerStyle={styles.listContent} 
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading && submissions.length > 0} 
            onRefresh={onRefresh} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox-multiple" size={48} color={COLORS.light} />
            <Text style={styles.emptyText}>No hay envíos {filter === 'PENDING' ? 'pendientes' : filter === 'APPROVED' ? 'aprobados' : 'rechazados'}</Text>
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />
      <Modal visible={showConfirmModal} transparent={true} animationType="fade" onRequestClose={cancelAction}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name={pendingAction?.type === 'approve' ? 'check-circle' : 'alert-circle'} size={48} color={pendingAction?.type === 'approve' ? COLORS.primary : COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>{pendingAction?.type === 'approve' ? '¿Aprobar Envío?' : '¿Rechazar Envío?'}</Text>
            <Text style={styles.modalMessage}>{pendingAction?.type === 'approve' ? 'El usuario recibirá los puntos asociados a esta misión.' : 'El usuario será notificado del rechazo.'}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={cancelAction}>
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, pendingAction?.type === 'approve' ? styles.modalConfirmButton : styles.modalRejectButton]} onPress={confirmAction}>
                <Text style={[styles.modalConfirmButtonText, pendingAction?.type === 'reject' && styles.modalRejectButtonText]}>{pendingAction?.type === 'approve' ? 'Aprobar' : 'Rechazar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  badgeNumber: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadowSmall,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...LAYOUT.shadowSmall,
  },
  filterButtonText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  badgeText: {
    color: '#856404',
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  missionSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  missionDetails: {
    flex: 1,
  },
  missionName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  points: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.success,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    lineHeight: 20,
  },
  attachmentsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  attachmentsCount: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    flex: 1,
  },
  submittedTime: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  approveButton: {
    backgroundColor: COLORS.success,
    ...LAYOUT.shadowSmall,
  },
  approveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  detailButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  detailButton: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...LAYOUT.shadowSmall,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    ...LAYOUT.shadowSmall,
  },
  rejectButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    ...LAYOUT.shadowLarge,
  },
  modalHeader: {
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  modalCancelButtonText: {
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.success,
  },
  modalRejectButton: {
    backgroundColor: COLORS.error,
  },
  modalConfirmButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  modalRejectButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
});
