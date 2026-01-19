import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import HomeSkeleton from '../../components/skeletons/HomeSkeleton';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme/theme';
import { getErrorMessage } from '../../utils/errorHandler';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  useUserBalance,
  useAllTransactions,
  useAvailableMissions,
  useAvailableBenefits,
} from '../../hooks/useUserData';

const { width } = Dimensions.get('window');

export default function UserHomeScreen({ navigation: navigationProp }) {
  // En web se pasa como prop, en móvil usar el hook
  const hookNavigation = useNavigation();
  const navigation = Platform.OS === 'web' && navigationProp ? navigationProp : hookNavigation;
  const { authState } = useContext(AuthContext);
  const { theme } = useTheme();

  const monthlyGoal = 500;

  // React Query hooks - Reemplazan todos los useState y useEffect
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useUserBalance();

  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useAllTransactions(100);

  const {
    data: missions = [],
    isLoading: isLoadingMissions,
    error: missionsError,
    refetch: refetchMissions,
  } = useAvailableMissions(4);

  const {
    data: benefitsData = [],
    isLoading: isLoadingBenefits,
    error: benefitsError,
    refetch: refetchBenefits,
  } = useAvailableBenefits(4);

  // Procesar datos del usuario
  const userData = {
    name: user?.name || 'Usuario',
    email: user?.email || '',
  };
  const balance = user?.wallet?.balance || 0;
  // Procesar actividades recientes con useMemo (solo se recalcula si transactions cambia)
  const activities = useMemo(() => {
    return transactions.slice(0, 3).map(t => {
      const isMissionApproved = t.type === 'EARNED' && t.description?.includes('Misión aprobada');
      
      const iconMap = {
        EARNED: isMissionApproved ? 'trophy' : 'plus-circle',
        SPENT: 'gift',
        TRANSFER: 'swap-horizontal',
      };
      const colorMap = {
        EARNED: isMissionApproved ? '#FF9800' : '#4CAF50',
        SPENT: '#FF9800',
        TRANSFER: '#2196F3',
      };
      
      const pointsColor = t.type === 'EARNED' ? '#4CAF50' : '#F44336';

      const date = new Date(t.createdAt);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      let timeString;
      if (isToday) {
        timeString = `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (isYesterday) {
        timeString = `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        timeString = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }

      let subtitle;
      if (t.type === 'EARNED') {
        subtitle = isMissionApproved ? 'Misión completada' : 'Puntos ganados';
      } else if (t.type === 'SPENT') {
        subtitle = 'Beneficio canjeado';
      } else {
        subtitle = 'Transferencia';
      }

      return {
        id: t.id,
        title: t.description || 'Transacción',
        description: subtitle,
        points: `${t.type === 'EARNED' ? '+' : '-'}${t.amount}`,
        pointsColor: pointsColor,
        color: colorMap[t.type] || '#9C27B0',
        icon: iconMap[t.type] || 'history',
        time: timeString,
      };
    });
  }, [transactions]);
  
  // Calcular puntos mensuales con useMemo (solo EARNED, no SPENT)
  const { monthlyPoints, lastMonthPoints } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // Puntos del mes actual (solo EARNED, excluye SPENT)
    const currentMonthEarned = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate >= currentMonthStart && t.type === 'EARNED';
    });
    const currentPoints = currentMonthEarned.reduce((sum, t) => sum + t.amount, 0);
    
    // Puntos del mes pasado (solo EARNED)
    const lastMonthEarned = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate >= lastMonthStart && tDate <= lastMonthEnd && t.type === 'EARNED';
    });
    const lastPoints = lastMonthEarned.reduce((sum, t) => sum + t.amount, 0);
    
    return { monthlyPoints: currentPoints, lastMonthPoints: lastPoints };
  }, [transactions]);

  // Mensaje motivacional basado en progreso
  const getMotivationalMessage = (current, goal) => {
    const percentage = (current / goal) * 100;
    
    if (percentage >= 100) {
      return {
        text: '¡Meta superada! Sigue así 🎉',
        color: COLORS.success,
        icon: 'trophy',
      };
    }
    if (percentage >= 75) {
      return {
        text: `Solo ${goal - current} puntos para tu meta 💪`,
        color: '#FF9800',
        icon: 'lightning-bolt',
      };
    }
    if (percentage >= 50) {
      return {
        text: '¡Vas por buen camino! 🚀',
        color: COLORS.primary,
        icon: 'rocket',
      };
    }
    if (percentage >= 25) {
      return {
        text: 'Cada punto cuenta 🌟',
        color: COLORS.info,
        icon: 'star',
      };
    }
    return {
      text: '¡Comienza a ganar puntos hoy! 🎯',
      color: COLORS.gray,
      icon: 'target',
    };
  };

  const motivation = getMotivationalMessage(monthlyPoints, monthlyGoal);

  // Procesar beneficios
  const benefits = useMemo(() => {
    return benefitsData.map(b => ({
      id: b.id,
      name: b.title,
      description: b.description,
      pointsCost: b.pointsCost,
      stock: b.stock,
      redeemable: b.stock > 0,
    }));
  }, [benefitsData]);

  // Procesar misiones
  const earnOptions = useMemo(() => {
    return missions.map(m => ({
      id: m.id,
      title: m.title || m.name,
      description: m.description?.substring(0, 40) + '...' || 'Completa esta misión',
      points: `+${m.points}`,
      icon: m.icon || 'star',
    }));
  }, [missions]);

  // Estado de carga y errores
  const loading = isLoadingUser || isLoadingTransactions || isLoadingMissions || isLoadingBenefits;
  const error = userError || transactionsError || missionsError || benefitsError;
  const refreshing = false; // React Query maneja el refreshing automáticamente

  // Función de refresh manual
  const onRefresh = async () => {
    await Promise.all([
      refetchUser(),
      refetchTransactions(),
      refetchMissions(),
      refetchBenefits(),
    ]);
  };

  // Mostrar skeleton mientras carga datos iniciales
  if (loading && !user) {
    return (
      <ScreenWrapper bgColor={COLORS.light} padding={0} maxWidth={Platform.OS === 'web'} safeArea={Platform.OS !== 'web'}>
        <HomeSkeleton />
      </ScreenWrapper>
    );
  }

  // Mostrar pantalla de error con retry
  if (error && !user) {
    return (
      <ScreenWrapper bgColor={COLORS.white}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="wifi-off" size={64} color={COLORS.gray} />
          <Text style={styles.errorTitle}>Sin conexión</Text>
          <Text style={styles.errorMessage}>
            {getErrorMessage(error)}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.background} padding={0} maxWidth={Platform.OS === 'web'} safeArea={Platform.OS !== 'web'}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* EN MÓVIL, SIN HEADER (React Navigation lo maneja) */}

        {/* SALUDO */}
        <View style={styles.greeting}>
          <Text style={[styles.greetingText, { color: theme.text }]}>Hola, {userData.name} 👋</Text>
        </View>

        {/* CONTENEDOR PRINCIPAL (BALANCE + STATS) */}
        <View style={styles.mainContent}>
          {/* COLUMNA IZQUIERDA: BALANCE + GANA PUNTOS */}
          <View style={styles.leftColumn}>
            {/* TARJETA DE BALANCE */}
            <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
              <View style={styles.balanceGradientOverlay} />
              <View style={styles.balanceTop}>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>BALANCE DISPONIBLE</Text>
                  <View style={styles.balanceRow}>
                    <Text style={[styles.balanceAmount, { color: theme.text }]}>{balance.toLocaleString()}</Text>
                    <Text style={[styles.balanceUnit, { color: theme.textSecondary }]}>Puntos</Text>
                  </View>
                </View>
                <View style={styles.walletIconContainer}>
                  <MaterialCommunityIcons name="wallet" size={64} color="#4CAF50" />
                </View>
              </View>
              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={() => navigation.navigate('Benefits')}
                >
                  <MaterialCommunityIcons name="gift" size={18} color={COLORS.white} />
                  <Text style={styles.primaryBtnText}>Canjear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* SECCIÓN GANA MÁS PUNTOS HOY */}
            {earnOptions.length > 0 && (
              <View style={styles.earnSectionInline}>
                <View style={styles.earnHeader}>
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.primary} />
                  <Text style={[styles.earnTitle, { color: theme.text }]}>Gana Más Puntos Hoy</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.earnScroll}
                >
                  {earnOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.earnCard, { backgroundColor: theme.card }]}
                      onPress={() => navigation.navigate('Earn')}
                    >
                      <View style={styles.earnIconContainer}>
                        <MaterialCommunityIcons
                          name={option.icon}
                          size={32}
                          color={COLORS.primary}
                        />
                      </View>
                      <Text style={[styles.earnCardTitle, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{option.title}</Text>
                      <Text style={[styles.earnCardDesc, { color: theme.textSecondary }]}>{option.description}</Text>
                      <View style={styles.earnCardFooter}>
                        <Text style={styles.earnCardPoints}>{option.points}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* PANEL DERECHO (STATS + ACTIVIDAD) */}
          <View style={styles.sidePanel}>
            {/* PUNTOS ESTE MES */}
            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: theme.text }]}>PUNTOS ESTE MES</Text>
                <MaterialCommunityIcons name="trending-up" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.statNumber}>+{monthlyPoints}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((monthlyPoints / monthlyGoal) * 100, 100)}%` },
                  ]}
                />
              </View>
              
              {/* Meta y comparación en la misma línea */}
              <View style={styles.progressInfoRow}>
                <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                  Meta: {monthlyGoal} puntos
                </Text>
                <View style={styles.comparisonContainer}>
                  <Text style={[styles.comparisonLabel, { color: theme.textSecondary }]}>Mes pasado: </Text>
                  <Text style={[styles.comparisonValue, { color: theme.text }]}>+{lastMonthPoints}</Text>
                  {monthlyPoints > lastMonthPoints ? (
                    <MaterialCommunityIcons name="trending-up" size={12} color={COLORS.success} />
                  ) : monthlyPoints < lastMonthPoints ? (
                    <MaterialCommunityIcons name="trending-down" size={12} color={COLORS.error} />
                  ) : (
                    <MaterialCommunityIcons name="minus" size={12} color={COLORS.gray} />
                  )}
                </View>
              </View>
              
              {/* Mensaje motivacional */}
              <View style={[styles.motivationContainer, { backgroundColor: motivation.color + '15' }]}>
                <MaterialCommunityIcons name={motivation.icon} size={16} color={motivation.color} />
                <Text style={[styles.motivationText, { color: motivation.color }]}>
                  {motivation.text}
                </Text>
              </View>
            </View>

            {/* ACTIVIDAD RECIENTE */}
            <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.activityHeader}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>Actividad Reciente</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
                  <Text style={styles.seeAllLink}>VER TODO</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activitiesList}>
                {activities.length === 0 ? (
                  <Text style={styles.emptyText}>No hay actividad reciente</Text>
                ) : (
                  activities.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: activity.pointsColor + '20' }]}>
                        <MaterialCommunityIcons
                          name={activity.icon}
                          size={18}
                          color={activity.pointsColor}
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityItemTitle, { color: theme.text }]}>{activity.title}</Text>
                        <Text style={[styles.activityDesc, { color: theme.textSecondary }]}>{activity.description}</Text>
                        <Text style={[styles.activityTime, { color: theme.textSecondary }]}>{activity.time}</Text>
                      </View>
                      <Text style={[styles.activityPoints, { color: activity.pointsColor }]}>
                        {activity.points}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        </View>



        {/* BENEFICIOS DISPONIBLES */}
        {benefits.length > 0 && (
          <View style={styles.benefitsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Beneficios Disponibles</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Benefits')}>
                <Text style={styles.seeAllText}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.benefitsScroll}
            >
              {benefits.map((benefit) => (
                <TouchableOpacity
                  key={benefit.id}
                  style={[styles.benefitCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => navigation.navigate('Benefits')}
                  activeOpacity={0.7}
                >
                  <View style={styles.benefitIcon}>
                    <MaterialCommunityIcons name="gift" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.benefitName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{benefit.name}</Text>
                  <Text style={[styles.benefitDesc, { color: theme.textSecondary }]} numberOfLines={2}>{benefit.description}</Text>
                  <View style={styles.benefitFooter}>
                    <Text style={styles.benefitCost}>{benefit.pointsCost} pts</Text>
                    <View style={styles.viewDetailsBtn}>
                      <Text style={styles.viewDetailsBtnText}>Ver detalles</Text>
                      <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* TARJETA DE COMERCIOS ASOCIADOS */}
        <TouchableOpacity
          style={[styles.associatesCard, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('Associates')}
        >
          <View style={styles.associatesIconContainer}>
            <MaterialCommunityIcons name="store" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.associatesInfo}>
            <Text style={[styles.associatesTitle, { color: theme.text }]}>Comercios Asociados</Text>
            <Text style={[styles.associatesSubtitle, { color: theme.textSecondary }]}>Descubre dónde usar tus puntos</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Platform.OS === 'web' ? SPACING.xl : SPACING.md,
    paddingTop: Platform.OS === 'web' ? 90 : SPACING.md,
    paddingBottom: SPACING.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.gray,
    fontSize: TYPOGRAPHY.body2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  greeting: {
    marginBottom: SPACING.lg,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  mainContent: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'stretch',
  },
  leftColumn: {
    flex: Platform.OS === 'web' ? 1.5 : 1,
    gap: SPACING.md,
  },
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4CAF50', // Borde verde brillante
    padding: SPACING.lg,
    marginBottom: Platform.OS === 'web' ? 0 : SPACING.md,
    // Sombra pronunciada y efecto fluorescente
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 32px rgba(76, 175, 80, 0.25), 0 0 20px rgba(76, 175, 80, 0.15)',
    } : {
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    }),
    // Gradiente sutil de fondo (simulado con overlay)
    position: 'relative',
    overflow: 'hidden',
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    zIndex: 1,
  },
  balanceInfo: {
    zIndex: 1,
  },
  walletIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.dark,
    lineHeight: 52,
  },
  balanceUnit: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.success,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
    } : {
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    }),
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  associatesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  associatesIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  associatesInfo: {
    flex: 1,
  },
  associatesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  associatesSubtitle: {
    fontSize: 12,
  },
  sidePanel: {
    gap: SPACING.md,
    flex: Platform.OS === 'web' ? 1 : 1,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
    padding: SPACING.lg,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 1,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  progressHighlight: {
    fontWeight: '700',
    color: COLORS.dark,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  motivationText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comparisonLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  comparisonValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
    padding: SPACING.lg,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  activitiesList: {
    gap: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
  },
  activityDesc: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  activityPoints: {
    fontWeight: '700',
    fontSize: 12,
  },
  earnSection: {
    marginBottom: SPACING.xl,
  },
  earnSectionInline: {
    marginTop: 0,
    width: '100%',
  },
  earnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  earnScroll: {
    paddingRight: SPACING.md,
    gap: SPACING.md,
  },
  earnCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-between', // Distribuir espacio uniformemente
  },
  earnIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  earnCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  earnCardDesc: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 14,
    minHeight: 28, // 2 líneas mínimo para alineación
    flex: 1, // Ocupa el espacio disponible
  },
  earnCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earnCardPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  benefitsSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  benefitsScroll: {
    paddingRight: SPACING.md,
    gap: SPACING.md,
  },
  benefitCard: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
    padding: SPACING.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  benefitDesc: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: SPACING.md,
    lineHeight: 13,
    minHeight: 40, // Altura fija para alineación consistente
  },
  benefitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benefitCost: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsBtnText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  logoutSection: {
    marginVertical: SPACING.xl,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: SPACING.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.body1,
  },
});
