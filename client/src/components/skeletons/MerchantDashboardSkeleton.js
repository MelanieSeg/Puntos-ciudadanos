/**
 * MerchantDashboardSkeleton - Skeleton loader para dashboard de comercio
 * Simula las tarjetas de estadísticas y el historial
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Skeleton from '../Skeleton';
import { COLORS, SPACING } from '../../theme/theme';

export default function MerchantDashboardSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={150} height={24} style={styles.mb8} />
          <Skeleton width={200} height={14} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Card 1 - Puntos Canjeados */}
        <View style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} style={styles.mb12} />
          <Skeleton width={120} height={16} style={styles.mb8} />
          <Skeleton width={100} height={32} style={styles.mb8} />
          <Skeleton width={80} height={14} />
        </View>

        {/* Card 2 - QRs Validados */}
        <View style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} style={styles.mb12} />
          <Skeleton width={120} height={16} style={styles.mb8} />
          <Skeleton width={80} height={32} style={styles.mb8} />
          <Skeleton width={90} height={14} />
        </View>
      </View>

      {/* Botón de Escanear */}
      <View style={styles.scanButtonContainer}>
        <Skeleton width="100%" height={56} borderRadius={12} />
      </View>

      {/* Sección Historial */}
      <View style={styles.historialSection}>
        <View style={styles.historialHeader}>
          <Skeleton width={160} height={20} />
        </View>

        {/* Items del historial */}
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.historialItem}>
            <View style={styles.historialContent}>
              <Skeleton width="60%" height={16} style={styles.mb8} />
              <Skeleton width="80%" height={14} style={styles.mb4} />
              <Skeleton width={40} height={12} />
            </View>
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerLeft: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  scanButtonContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  historialSection: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    minHeight: 400,
  },
  historialHeader: {
    marginBottom: SPACING.lg,
  },
  historialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  historialContent: {
    flex: 1,
  },
  mb4: {
    marginBottom: 4,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
});
