/**
 * EarnScreen - Pantalla para Ganar Puntos
 * Muestra formas de ganar puntos
 * Optimizado con React Query para caché inteligente
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import MissionSkeleton from '../../components/skeletons/MissionSkeleton';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useAvailableMissions } from '../../hooks/useUserData';

function EarnScreenComponent({ navigation: navigationProp }) {
  const { theme } = useTheme();
  // En web usar el prop, en móvil usar el hook
  let navigation;
  if (Platform.OS === 'web') {
    navigation = navigationProp;
  } else {
    navigation = useNavigation();
  }

  // React Query hook - caché de 10 minutos para misiones
  const {
    data: missions = [],
    isLoading: loading,
    error,
    refetch,
  } = useAvailableMissions();

  const handleMissionPress = (mission) => {
    console.log('[EarnScreen] Navegando a MissionSubmission', mission.id);
    if (!navigation) {
      console.error('[EarnScreen] No navigation object available');
      return;
    }
    
    // Para navegación anidada: Tab.Screen name="Earn" > EarnStack > MissionSubmission
    const params = {
      missionId: mission.id,
      missionName: mission.name || mission.title,
      missionPoints: mission.points,
    };
    
    if (Platform.OS === 'web') {
      // En web, usar el prop navigation que pasa WebLayout
      navigation.navigate('MissionSubmission', params);
    } else {
      // En móvil, navegar a través del Stack dentro del Tab
      navigation.push('MissionSubmission', params);
    }
  };

  const renderMission = ({ item, index }) => {
    // Mapear categorías a colores e íconos
    const icons = ['recycle', 'water', 'account-heart', 'leaf', 'blood-bag', 'food', 'fire-truck', 'volume-high'];
    const colors = ['#4CAF50', '#2196F3', '#E91E63', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#FFC107'];
    
    const icon = item.icon || icons[index % icons.length];
    const color = colors[index % colors.length];

    // Calcular fecha de expiración
    const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
    const expiresInText = !isExpired && item.expiresAt ? getTimeUntilExpiration(item.expiresAt) : null;

    // Verificar si está en cooldown (si viene del backend)
    const isOnCooldown = item.cooldownUntil ? new Date(item.cooldownUntil) > new Date() : false;
    const cooldownText = isOnCooldown ? getCooldownText(item.cooldownUntil) : null;

    // Determinar si está bloqueada (expirada o en cooldown)
    const isLocked = isExpired || isOnCooldown;

    return (
      <TouchableOpacity
        style={[styles.missionCard, { backgroundColor: theme.card, borderColor: theme.border }, isLocked && styles.missionCardExpired]}
        onPress={() => !isLocked && handleMissionPress(item)}
        activeOpacity={isLocked ? 1 : 0.8}
        disabled={isLocked}
      >
        {/* Candado sobre el ícono si está bloqueada */}
        {isLocked && (
          <View style={styles.lockOverlay}>
            <MaterialCommunityIcons name="lock" size={48} color="#BDBDBD" />
          </View>
        )}

        {/* Badge de puntos en la esquina */}
        <View style={[styles.pointsBadge, { backgroundColor: isLocked ? COLORS.gray : COLORS.success }]}>
          <Text style={styles.pointsText}>+{item.points} pts</Text>
        </View>

        {/* Ícono circular */}
        <View style={[styles.iconCircle, { backgroundColor: color + '20', opacity: isLocked ? 0.4 : 1 }]}>
          <MaterialCommunityIcons name={icon} size={32} color={color} />
        </View>

        {/* Título */}
        <Text style={[styles.missionTitle, { color: theme.text }, isLocked && styles.textExpired]}>
          {item.name || item.title}
        </Text>

        {/* Descripción */}
        <Text style={[styles.missionDescription, { color: theme.textSecondary }, isLocked && styles.textExpired]} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Fecha de expiración */}
        {expiresInText && !isOnCooldown && (
          <View style={styles.expirationRow}>
            <MaterialCommunityIcons name="clock-alert-outline" size={14} color={COLORS.warning} />
            <Text style={styles.expirationText}>{expiresInText}</Text>
          </View>
        )}

        {/* Estado expirado */}
        {isExpired && !isOnCooldown && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Expirada</Text>
          </View>
        )}

        {/* Estado en cooldown */}
        {isOnCooldown && (
          <View style={styles.cooldownBadge}>
            <MaterialCommunityIcons name="lock-clock" size={14} color={COLORS.white} />
            <Text style={styles.cooldownText}>{cooldownText}</Text>
          </View>
        )}

        {/* Frecuencia si existe */}
        {item.frequencyType && !isLocked && (
          <View style={styles.frequencyRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.gray} />
            <Text style={styles.frequencyText}>{item.frequencyType}</Text>
          </View>
        )}

        {/* Botón de acción */}
        {!isLocked && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMissionPress(item)}
          >
            <Text style={styles.actionButtonText}>Participar</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Función para calcular tiempo restante
  const getTimeUntilExpiration = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    
    if (diffMs <= 0) return null;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 7) {
      return `Expira en ${diffDays} días`;
    } else if (diffDays > 0) {
      return `Expira en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Expira en ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Expira en ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  // Función para calcular tiempo de cooldown
  const getCooldownText = (cooldownUntil) => {
    const now = new Date();
    const cooldown = new Date(cooldownUntil);
    const diffMs = cooldown - now;
    
    if (diffMs <= 0) return null;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Debes esperar ${diffDays} día${diffDays > 1 ? 's' : ''} para completar esta misión de nuevo`;
    } else if (diffHours > 0) {
      return `Debes esperar ${diffHours} hora${diffHours > 1 ? 's' : ''} para completar esta misión de nuevo`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Debes esperar ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} para completar esta misión de nuevo`;
    }
  };

  const renderSkeleton = () => {
    return <MissionSkeleton />;
  };

  // Mostrar skeleton mientras carga datos iniciales
  if (loading && missions.length === 0) {
    return (
      <ScreenWrapper bgColor={theme.background} safeArea={false} maxWidth={false} padding={0}>
        <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 90 : SPACING.md }]}>
          <FlatList
            data={[1, 2, 3, 4, 5]}
            renderItem={renderSkeleton}
            keyExtractor={(item) => `skeleton-${item}`}
            contentContainerStyle={styles.listContent}
            numColumns={Platform.OS === 'web' ? 3 : 1}
            key={Platform.OS === 'web' ? 'grid' : 'list'}
          />
        </View>
      </ScreenWrapper>
    );
  }

  // Mostrar pantalla de error con retry
  if (error && missions.length === 0) {
    return (
      <ScreenWrapper bgColor={theme.background}>
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="wifi-off" size={64} color={COLORS.gray} />
          <Text style={styles.errorTitle}>Sin conexión</Text>
          <Text style={styles.errorText}>No pudimos cargar las misiones</Text>
          <TouchableOpacity style={styles.retryButtonLarge} onPress={refetch}>
            <MaterialCommunityIcons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} maxWidth={false} padding={0}>
      <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 90 : SPACING.md }]}>
        {loading && missions.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando misiones...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>No pudimos cargar las misiones</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={missions}
            renderItem={renderMission}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
            style={styles.list}
            numColumns={Platform.OS === 'web' ? 3 : 1}
            key={Platform.OS === 'web' ? 'grid' : 'list'}
            refreshControl={
              <RefreshControl refreshing={loading && missions.length > 0} onRefresh={refetch} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="lightning-bolt-outline" size={64} color={COLORS.gray} />
                <Text style={styles.emptyText}>No hay misiones disponibles</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
    ...(Platform.OS === 'web' && {
      maxWidth: 1400,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: Platform.OS === 'web' ? 0 : SPACING.md,
    paddingBottom: SPACING.xl,
  },
  
  // Tarjeta de misión minimalista
  missionCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    position: 'relative',
    ...LAYOUT.shadowMedium,
    ...(Platform.OS === 'web' ? {
      flex: 1,
      maxWidth: '32%',
      marginHorizontal: '0.5%',
      minHeight: 280,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    } : {
      width: '100%',
    }),
  },
  
  // Badge de puntos en esquina
  pointsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1,
  },
  pointsText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Ícono circular
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  // Título
  missionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  
  // Descripción
  missionDescription: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  
  // Fila de frecuencia
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 4,
  },
  frequencyText: {
    fontSize: 11,
    color: COLORS.gray,
  },
  
  // Botón de acción
  actionButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  
  // Estilos de expiración
  missionCardExpired: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  textExpired: {
    color: COLORS.gray,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: LAYOUT.borderRadius.lg,
  },
  expirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  expirationText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  expiredBadge: {
    backgroundColor: COLORS.gray + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  expiredText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cooldownBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cooldownText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  
  // Estados de carga y error
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
  },
  retryButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.body1,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
});

export default EarnScreenComponent;
