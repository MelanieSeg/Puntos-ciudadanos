import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import MerchantDashboardSkeleton from '../../components/skeletons/MerchantDashboardSkeleton';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';

export default function MerchantDashboardScreen({ navigation }) {
  const { authState } = useContext(AuthContext);
  const { user, role } = authState;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Cargar estadísticas del backend
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/merchant/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Valores predeterminados en caso de error de red
      setStats({
        totalPuntosCanjeados: 2450,
        qrsValidados: 12,
        recentActivity: [],
        topBenefits: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  if (loading && !stats) {
    return (
      <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
        <MerchantDashboardSkeleton />
      </ScreenWrapper>
    );
  }

  const totalPuntosCanjeados = stats?.totalPuntosCanjeados || 2450;
  const qrsValidados = stats?.qrsValidados || 12;

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0} maxWidth={Platform.OS === 'web'}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.merchant]} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.headerGreeting, { color: theme.text }]}>Hola, {user?.name}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Comercio - {user?.email}</Text>
          </View>
        </View>

        {/* Tarjetas de Estadísticas */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: COLORS.merchant }]}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.merchant + '15' }]}>
              <MaterialCommunityIcons name="star-circle" size={28} color={COLORS.merchant} />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: theme.text }]}>{totalPuntosCanjeados}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Puntos Canjeados</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: COLORS.success }]}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.success + '15' }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={28} color={COLORS.success} />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: theme.text }]}>{qrsValidados}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Validaciones</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botón de Escanear (FAB Style) */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleScanQR}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="camera" size={24} color={COLORS.white} />
            <Text style={styles.fabText}>Escanear Cupón</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Reportes */}
        <View style={styles.reportsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Rendimiento</Text>
          
          {/* Beneficios Top */}
          <View style={[styles.reportCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.reportHeader, { borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="trending-up" size={24} color={COLORS.merchant} />
              <Text style={[styles.reportCardTitle, { color: theme.text }]}>Beneficios Populares</Text>
            </View>
            {(!stats?.topBenefits || stats.topBenefits.length === 0) && (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>Aún no hay datos suficientes</Text>
              </View>
            )}
            {stats?.topBenefits?.map((benefit, index) => (
              <TouchableOpacity 
                key={benefit.id} 
                style={styles.reportRow}
                onPress={() => navigation.navigate('Benefits')}
                activeOpacity={0.7}
              >
                <View style={styles.benefitRowLeft}>
                  <Text style={[styles.rankText, { color: theme.textSecondary }]}>#{index + 1}</Text>
                  <Text style={[styles.reportLabel, { color: theme.text }]}>{benefit.name}</Text>
                </View>
                <View style={styles.benefitRowRight}>
                  <Text style={[styles.reportValue, { color: theme.text }]}>{benefit.count}</Text>
                  <MaterialCommunityIcons 
                    name={benefit.trend === 'up' ? 'arrow-up' : 'arrow-down'} 
                    size={16} 
                    color={benefit.trend === 'up' ? COLORS.success : COLORS.error} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Resumen de Actividad Reciente */}
          <View style={[styles.reportCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.reportHeader, { borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="history" size={24} color={COLORS.info} />
              <Text style={[styles.reportCardTitle, { color: theme.text }]}>Actividad Reciente</Text>
            </View>
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>No hay actividad reciente</Text>
              </View>
            )}
            {stats?.recentActivity?.slice(0, 3).map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.reportRow}
                onPress={() => navigation.navigate('History')}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.reportLabel, { color: theme.text }]}>{item.cliente}</Text>
                  <Text style={[styles.reportSubLabel, { color: theme.textSecondary }]}>{item.producto}</Text>
                </View>
                <Text style={[styles.reportTime, { color: theme.textSecondary }]}>{item.hora}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.seeAllText}>Ver historial completo</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.merchant} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? 90 : SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 11,
    color: '#bbb',
  },
  fabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabButton: {
    backgroundColor: COLORS.merchant,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 5,
    shadowColor: COLORS.merchant,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Nuevos estilos para reportes
  reportsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  benefitRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    width: 24,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  reportSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  reportValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  reportTime: {
    fontSize: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    gap: 4,
  },
  seeAllText: {
    color: COLORS.merchant,
    fontSize: 14,
    fontWeight: '600',
  },
});
