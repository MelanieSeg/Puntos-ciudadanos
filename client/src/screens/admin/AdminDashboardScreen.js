/**
 * AdminDashboardScreen - Panel de control administrativo
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import { formatLargeNumber, formatPercentage } from '../../utils/formatNumber';

export default function AdminDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

  // Fetch de estadísticas
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await adminAPI.getStats();
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (coincide con caché del backend)
    refetchOnWindowFocus: true, // Refrescar al volver a la ventana
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Stats para las tarjetas principales
  const stats = data ? [
    { 
      icon: 'account-multiple', 
      label: 'Usuarios Activos', 
      value: formatLargeNumber(data.resumenGeneral.usuariosActivos), 
      color: COLORS.user 
    },
    { 
      icon: 'store', 
      label: 'Comercios', 
      value: data.resumenGeneral.comerciosTotales.toString(), 
      color: COLORS.merchant 
    },
    { 
      icon: 'star', 
      label: 'Puntos en Circulación', 
      value: formatLargeNumber(data.resumenGeneral.puntosCirculacion), 
      color: COLORS.warning 
    },
    { 
      icon: 'cash-multiple', 
      label: 'Transacciones', 
      value: formatLargeNumber(data.resumenGeneral.transaccionesTotales), 
      color: COLORS.success 
    },
  ] : [];

  if (isLoading) {
    return (
      <ScreenWrapper bgColor={theme.background} safeArea={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando estadísticas...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper bgColor={theme.background} safeArea={false}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>Error al cargar estadísticas</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <MaterialCommunityIcons
                name={stat.icon}
                size={32}
                color={stat.color}
                style={styles.statIcon}
              />
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {data.misiones.pendientesAprobacion > 0 && (
          <TouchableOpacity style={[styles.alertSection, { backgroundColor: theme.surface, borderLeftColor: COLORS.warning }]}>
            <MaterialCommunityIcons name="bell-alert" size={24} color={COLORS.warning} />
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: theme.text }]}>Misiones Pendientes</Text>
              <Text style={[styles.alertText, { color: theme.textSecondary }]}>
                {data.misiones.pendientesAprobacion} misiones esperando aprobación
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Sección de Reportes */}
        <View style={styles.reportsSection}>
          <Text style={[styles.reportsTitle, { color: theme.text }]}>Reportes y Estadísticas</Text>
          
          <View style={[styles.reportCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.reportHeader, { borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="chart-line" size={24} color={COLORS.primary} />
              <Text style={[styles.reportCardTitle, { color: theme.text }]}>Actividad de Usuarios</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Nuevos esta semana:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{data.actividadUsuarios.nuevosEstaSemana}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Activos hoy:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{data.actividadUsuarios.activosHoy}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Tasa de retención:</Text>
              <Text style={[styles.reportValue, { color: COLORS.success }]}>
                {formatPercentage(data.actividadUsuarios.tasaRetencion)}
              </Text>
            </View>
          </View>

          <View style={[styles.reportCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.reportHeader, { borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="target" size={24} color={COLORS.warning} />
              <Text style={[styles.reportCardTitle, { color: theme.text }]}>Misiones Completadas</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Esta semana:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{data.misiones.completadasEstaSemana}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Pendientes aprobación:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{data.misiones.pendientesAprobacion}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Tasa de aprobación:</Text>
              <Text style={[styles.reportValue, { color: COLORS.success }]}>
                {formatPercentage(data.misiones.tasaAprobacion)}
              </Text>
            </View>
          </View>

          <View style={[styles.reportCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.reportHeader, { borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="gift" size={24} color={COLORS.merchant} />
              <Text style={[styles.reportCardTitle, { color: theme.text }]}>Beneficios Canjeados</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Total esta semana:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{data.beneficios.canjeadosEstaSemana || 0}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Puntos gastados:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{formatLargeNumber(data.beneficios.puntosGastados || 0)} pts</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Beneficio más popular:</Text>
              <Text style={[styles.reportValue, { color: theme.text, fontSize: TYPOGRAPHY.caption }]}>
                {data.beneficios.beneficioMasPopular || 'Sin actividad'}
              </Text>
            </View>
          </View>

          <View style={[styles.reportCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.reportHeader, { borderBottomColor: theme.border }]}>
              <MaterialCommunityIcons name="store" size={24} color={COLORS.success} />
              <Text style={[styles.reportCardTitle, { color: theme.text }]}>Comercios Activos</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Comercios registrados:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{data.comercios.comerciosRegistrados || 0}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Con canjes esta semana:</Text>
              <Text style={[styles.reportValue, { color: theme.text }]}>{data.comercios.conCanjesEstaSemana ?? 0}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Top comercio:</Text>
              <Text style={[styles.reportValue, { color: theme.text, fontSize: TYPOGRAPHY.caption }]}>
                {data.comercios.comercioTop || 'Sin actividad'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: TYPOGRAPHY.h3, fontWeight: '700', color: COLORS.dark, marginBottom: SPACING.xl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
  },
  statIcon: { marginBottom: SPACING.sm },
  statValue: { fontSize: TYPOGRAPHY.h5, fontWeight: '700', color: COLORS.dark, marginBottom: SPACING.xs },
  statLabel: { fontSize: TYPOGRAPHY.caption, color: COLORS.gray, textAlign: 'center' },
  alertSection: {
    backgroundColor: '#FFF9C4',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...LAYOUT.shadowSmall,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  alertText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  reportsSection: {
    marginBottom: SPACING.xl,
  },
  reportsTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.lg,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reportCardTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  reportLabel: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  reportValue: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginTop: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
  },
});
