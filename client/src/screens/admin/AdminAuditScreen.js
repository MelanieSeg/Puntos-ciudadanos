/**
 * AdminAuditScreen - Pantalla de Auditoría y Control Maestro
 * Solo accesible para MASTER_ADMIN
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { adminAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

// Mapeo de íconos según la acción
const ACTION_ICONS = {
  USER_STATUS_CHANGED: 'account-lock',
  SUBMISSION_APPROVED: 'check-circle',
  SUBMISSION_REJECTED: 'close-circle',
  BENEFIT_CREATED: 'gift',
  BENEFIT_UPDATED: 'pencil',
  BENEFIT_DELETED: 'delete',
  USER_CREATED: 'account-plus',
  PASSWORD_RESET: 'lock-reset',
  CHANGE_PASSWORD: 'key-change',
  DEFAULT: 'clipboard-text',
};

// Traducciones amigables de acciones
const ACTION_LABELS = {
  USER_STATUS_CHANGED: 'Cambio de estado de usuario',
  SUBMISSION_APPROVED: 'Misión aprobada',
  SUBMISSION_REJECTED: 'Misión rechazada',
  BENEFIT_CREATED: 'Beneficio creado',
  BENEFIT_UPDATED: 'Beneficio actualizado',
  BENEFIT_DELETED: 'Beneficio eliminado',
  USER_CREATED: 'Usuario creado',
  PASSWORD_RESET: 'Contraseña restablecida',
  CHANGE_PASSWORD: 'Cambio de contraseña inicial',
};

// Obtener ícono según la acción
const getActionIcon = (action) => {
  return ACTION_ICONS[action] || ACTION_ICONS.DEFAULT;
};

// Obtener etiqueta amigable de la acción
const getActionLabel = (action) => {
  return ACTION_LABELS[action] || action;
};

// Formatear fecha relativa
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'hace un momento';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

export default function AdminAuditScreen() {
  const { authState } = React.useContext(AuthContext);
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState(null); // Filtro por tipo de acción
  const [searchQuery, setSearchQuery] = useState(''); // Búsqueda

  // Fetch de logs de auditoría
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auditLogs', page, filterAction],
    queryFn: async () => {
      const params = { page, limit: 50 };
      if (filterAction) params.action = filterAction;
      const response = await adminAPI.getAuditLogs(params);
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true,
  });

  // Mutation para banear usuario
  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }) => adminAPI.suspendUser(userId, reason),
    onSuccess: () => {
      Alert.alert(
        '✅ Usuario Baneado',
        'El administrador ha sido baneado exitosamente y perderá acceso inmediato al sistema.',
        [{ text: 'Entendido', style: 'default' }]
      );
      queryClient.invalidateQueries(['auditLogs']);
    },
    onError: (error) => {
      Alert.alert(
        '❌ Error',
        error.response?.data?.message || 'No se pudo banear al usuario',
        [{ text: 'Cerrar', style: 'cancel' }]
      );
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleShowDetails = (log) => {
    setSelectedLog(log);
    setModalVisible(true);
  };

  const handleSuspendAdmin = (log) => {
    const targetAdmin = log.admin;

    // Validaciones
    if (!targetAdmin) {
      Alert.alert('⚠️ Error', 'No se pudo identificar al administrador', [
        { text: 'Cerrar', style: 'cancel' },
      ]);
      return;
    }

    // No permitir auto-suspensión
    if (targetAdmin.id === authState.user.id) {
      Alert.alert('⚠️ Acción No Permitida', 'No puedes suspenderte a ti mismo', [
        { text: 'Cerrar', style: 'cancel' },
      ]);
      return;
    }

    // Solo permitir suspender a SUPPORT_ADMIN
    if (targetAdmin.role !== 'SUPPORT_ADMIN') {
      Alert.alert(
        '⚠️ Acción No Permitida',
        'Solo puedes suspender a administradores de soporte (SUPPORT_ADMIN)',
        [{ text: 'Cerrar', style: 'cancel' }]
      );
      return;
    }

    // Ya está suspendido
    if (targetAdmin.status === 'SUSPENDED') {
      Alert.alert('ℹ️ Usuario Ya Suspendido', 'Este administrador ya está suspendido', [
        { text: 'Cerrar', style: 'cancel' },
      ]);
      return;
    }

    // Confirmación crítica
    Alert.alert(
      '🚨 Confirmar Baneo Inmediato',
      `¿Confirmar baneo del administrador?\n\n👤 ${targetAdmin.name}\n📧 ${targetAdmin.email}\n\nEl administrador perderá acceso al sistema de forma instantánea por actividad sospechosa.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Banear',
          style: 'destructive',
          onPress: () => {
            suspendMutation.mutate({
              userId: targetAdmin.id,
              reason: 'Actividad sospechosa detectada por MASTER_ADMIN',
            });
          },
        },
      ]
    );
  };

  const renderLogCard = ({ item }) => {
    const admin = item.admin;
    const canSuspend = admin && admin.role === 'SUPPORT_ADMIN' && admin.status !== 'SUSPENDED';

    return (
      <View style={styles.logCard}>
        {/* Header con ícono y admin */}
        <View style={styles.logHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getActionIcon(item.action)}
              size={24}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>{admin?.name || 'Desconocido'}</Text>
            <Text style={styles.adminEmail}>{admin?.email || ''}</Text>
          </View>
          {admin?.status === 'SUSPENDED' && (
            <View style={styles.suspendedBadge}>
              <Text style={styles.suspendedText}>BANEADO</Text>
            </View>
          )}
        </View>

        {/* Descripción de la acción */}
        <View style={styles.logBody}>
          <Text style={styles.actionDescription}>{item.description || item.action}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.logActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => handleShowDetails(item)}
          >
            <MaterialCommunityIcons name="information" size={18} color={COLORS.info} />
            <Text style={styles.detailsButtonText}>Detalles</Text>
          </TouchableOpacity>

          {canSuspend && (
            <TouchableOpacity
              style={styles.suspendButton}
              onPress={() => handleSuspendAdmin(item)}
              disabled={suspendMutation.isLoading}
            >
              <MaterialCommunityIcons name="gavel" size={18} color="#FFF" />
              <Text style={styles.suspendButtonText}>Banear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMetadata = (metadata) => {
    if (!metadata) return <Text style={styles.noMetadata}>Sin metadatos</Text>;

    try {
      // Renderizar campos específicos de forma estructurada
      const renderField = (label, value) => {
        if (!value) return null;
        return (
          <View key={label} style={styles.metadataField}>
            <Text style={styles.metadataFieldLabel}>{label}:</Text>
            <Text style={styles.metadataFieldValue}>{value}</Text>
          </View>
        );
      };

      return (
        <View style={styles.metadataFields}>
          {metadata.previousStatus && renderField('Estado anterior', metadata.previousStatus)}
          {metadata.newStatus && renderField('Nuevo estado', metadata.newStatus)}
          {metadata.reason && renderField('Motivo', metadata.reason)}
          {metadata.targetUser && (
            <View style={styles.metadataField}>
              <Text style={styles.metadataFieldLabel}>Usuario afectado:</Text>
              <Text style={styles.metadataFieldValue}>
                {metadata.targetUser.name} ({metadata.targetUser.email})
              </Text>
              <Text style={styles.metadataFieldValue}>
                Rol: {metadata.targetUser.role}
              </Text>
            </View>
          )}
          {metadata.timestamp && renderField(
            'Timestamp',
            new Date(metadata.timestamp).toLocaleString('es-ES', {
              dateStyle: 'medium',
              timeStyle: 'medium'
            })
          )}
        </View>
      );
    } catch (error) {
      return <Text style={styles.noMetadata}>Metadatos inválidos</Text>;
    }
  };

  // Filtrar logs localmente por búsqueda (DEBE estar antes de los returns condicionales)
  const filteredLogs = React.useMemo(() => {
    if (!data?.logs) return [];
    
    if (!searchQuery.trim()) return data.logs;
    
    const query = searchQuery.toLowerCase().trim();
    return data.logs.filter(log => 
      log.admin?.name?.toLowerCase().includes(query) ||
      log.admin?.email?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query)
    );
  }, [data?.logs, searchQuery]);

  if (isLoading && !data) {
    return (
      <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando logs de auditoría...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Error al cargar logs</Text>
          <Text style={styles.errorMessage}>
            {error.response?.data?.message || error.message}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0}>
      {/* Barra de Búsqueda */}
      <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por admin, email o descripción..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros por tipo de acción */}
        <View style={styles.controlsRow}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterButtons}
          >
            <TouchableOpacity
              style={[styles.miniFilterButton, !filterAction && styles.miniFilterButtonActive]}
              onPress={() => setFilterAction(null)}
            >
              <Text style={[styles.miniFilterText, !filterAction && styles.miniFilterTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
          
            <TouchableOpacity
              style={[styles.miniFilterButton, filterAction === 'SUBMISSION_APPROVED' && styles.miniFilterButtonActive]}
              onPress={() => setFilterAction('SUBMISSION_APPROVED')}
            >
              <Text style={[styles.miniFilterText, filterAction === 'SUBMISSION_APPROVED' && styles.miniFilterTextActive]}>
                Aprobadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniFilterButton, filterAction === 'SUBMISSION_REJECTED' && styles.miniFilterButtonActive]}
              onPress={() => setFilterAction('SUBMISSION_REJECTED')}
            >
              <Text style={[styles.miniFilterText, filterAction === 'SUBMISSION_REJECTED' && styles.miniFilterTextActive]}>
                Rechazadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniFilterButton, filterAction === 'USER_STATUS_CHANGED' && styles.miniFilterButtonActive]}
              onPress={() => setFilterAction('USER_STATUS_CHANGED')}
            >
              <Text style={[styles.miniFilterText, filterAction === 'USER_STATUS_CHANGED' && styles.miniFilterTextActive]}>
                Cambios estado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniFilterButton, filterAction === 'USER_CREATED' && styles.miniFilterButtonActive]}
              onPress={() => setFilterAction('USER_CREATED')}
            >
              <Text style={[styles.miniFilterText, filterAction === 'USER_CREATED' && styles.miniFilterTextActive]}>
                Usuarios
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniFilterButton, filterAction === 'BENEFIT_CREATED' && styles.miniFilterButtonActive]}
              onPress={() => setFilterAction('BENEFIT_CREATED')}
            >
              <Text style={[styles.miniFilterText, filterAction === 'BENEFIT_CREATED' && styles.miniFilterTextActive]}>
                Benef. creados
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.miniFilterButton, filterAction === 'BENEFIT_DELETED' && styles.miniFilterButtonActive]}
              onPress={() => setFilterAction('BENEFIT_DELETED')}
            >
              <Text style={[styles.miniFilterText, filterAction === 'BENEFIT_DELETED' && styles.miniFilterTextActive]}>
                Benef. eliminados
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Lista de logs */}
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.emptyText}>Cargando auditoría...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={64} color={COLORS.gray} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No se encontraron registros con ese criterio' : 'No hay logs de auditoría'}
                </Text>
                {searchQuery && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                    <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />

        {/* Modal de detalles */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles del Registro</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedLog && formatRelativeTime(selectedLog.createdAt)}
                </Text>
              </View>

              {/* Contenido del modal */}
              {selectedLog && (
                <ScrollView style={styles.modalBody}>
                  {/* Sección Administrador */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="account" size={22} color="#00FF00" />
                      <Text style={styles.modalSectionTitle}>Administrador</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nombre:</Text>
                      <Text style={styles.detailValue}>
                        {selectedLog.admin?.name || 'Desconocido'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>
                        {selectedLog.admin?.email || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rol:</Text>
                      <Text style={styles.detailValue}>
                        {selectedLog.admin?.role === 'MASTER_ADMIN' ? 'Admin Maestro' : 'Admin Soporte'}
                      </Text>
                    </View>
                  </View>

                  {/* Sección Acción */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="lightning-bolt" size={22} color="#00FF00" />
                      <Text style={styles.modalSectionTitle}>Acción Realizada</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tipo:</Text>
                      <Text style={styles.detailValue}>{getActionLabel(selectedLog.action)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Descripción:</Text>
                      <Text style={styles.detailValue}>
                        {selectedLog.description || 'Sin descripción'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fecha:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedLog.createdAt).toLocaleString('es-ES', {
                          dateStyle: 'long',
                          timeStyle: 'medium'
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Sección Detalles */}
                  {selectedLog.metadata && (
                    <View style={styles.modalSection}>
                      <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="clipboard-text" size={20} color="#00FF00" />
                        <Text style={styles.modalSectionTitle}>Detalles</Text>
                      </View>
                      {renderMetadata(selectedLog.metadata)}
                    </View>
                  )}

                  {/* ID Técnico (colapsado al final) */}
                  <View style={styles.technicalInfo}>
                    <Text style={styles.technicalInfoLabel}>ID Objetivo:</Text>
                    <Text style={styles.technicalInfoValue}>{selectedLog.targetId}</Text>
                  </View>
                </ScrollView>
              )}

              {/* Botón de cerrar */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.md,
  },
  errorMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFF',
  },
  // Header (EXACTAMENTE como Users)
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  // Búsqueda (igual que Users)
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadowSmall,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.dark,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  // Filtros inline (igual que Users)
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  controlLabel: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
    marginRight: SPACING.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  miniFilterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: COLORS.light,
    marginRight: SPACING.xs,
  },
  miniFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  miniFilterText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
  },
  miniFilterTextActive: {
    color: COLORS.white,
  },
  // Lista
  listContent: {
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  // Cards de logs (EXACTAMENTE como Users - sin border)
  logCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  adminEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  suspendedBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  suspendedText: {
    ...TYPOGRAPHY.caption,
    color: '#FFF',
    fontWeight: '600',
    fontSize: 10,
  },
  logBody: {
    paddingVertical: SPACING.sm,
  },
  actionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: 4,
    fontSize: 14,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  logActions: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: `${COLORS.info}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.info,
    gap: SPACING.xs,
  },
  detailsButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.info,
    fontWeight: '600',
  },
  suspendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    gap: SPACING.xs,
    ...LAYOUT.shadowSmall,
  },
  suspendButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  modalHeader: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  modalBody: {
    padding: SPACING.lg,
    maxHeight: 500,
    backgroundColor: '#1E1E1E',
  },
  modalSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#00FF00',
    gap: SPACING.sm,
  },
  modalSectionTitle: {
    ...TYPOGRAPHY.body1,
    color: '#00FF00',
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  detailLabel: {
    ...TYPOGRAPHY.body2,
    color: '#00FF00',
    fontWeight: '600',
    minWidth: 120,
  },
  detailValue: {
    ...TYPOGRAPHY.body2,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '500',
  },
  metadataContainer: {
    marginTop: SPACING.sm,
  },
  metadataFields: {
    marginTop: SPACING.xs,
  },
  metadataField: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00FF00',
  },
  metadataFieldLabel: {
    ...TYPOGRAPHY.caption,
    color: '#00FF00',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metadataFieldValue: {
    ...TYPOGRAPHY.body2,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  noMetadata: {
    ...TYPOGRAPHY.caption,
    color: '#00FF00',
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  technicalInfo: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  technicalInfoLabel: {
    ...TYPOGRAPHY.caption,
    color: '#00FF00',
    fontSize: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  technicalInfoValue: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
  },
  closeButton: {
    margin: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: '700',
  },
});
