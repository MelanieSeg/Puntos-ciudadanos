/**
 * HomeSkeleton - Skeleton loader para UserHomeScreen
 * Simula la estructura de la pantalla de inicio: balance, opciones y actividad
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Skeleton from '../Skeleton';
import { COLORS, SPACING } from '../../theme/theme';

export default function HomeSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Balance Card Skeleton */}
      <View style={styles.balanceCard}>
        <Skeleton width={120} height={16} style={styles.mb8} />
        <Skeleton width={180} height={48} style={styles.mb16} />
        <View style={styles.row}>
          <View style={styles.statItem}>
            <Skeleton width={80} height={12} style={styles.mb4} />
            <Skeleton width={60} height={20} />
          </View>
          <View style={styles.statItem}>
            <Skeleton width={80} height={12} style={styles.mb4} />
            <Skeleton width={60} height={20} />
          </View>
        </View>
      </View>

      {/* Earn Options Skeleton */}
      <View style={styles.earnOptions}>
        <Skeleton width={140} height={20} style={styles.mb12} />
        <View style={styles.optionsGrid}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.optionCard}>
              <Skeleton width={48} height={48} borderRadius={24} style={styles.mb8} />
              <Skeleton width={60} height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity Skeleton */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <Skeleton width={160} height={20} />
          <Skeleton width={60} height={16} />
        </View>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.activityItem}>
            <Skeleton width={44} height={44} borderRadius={8} />
            <View style={styles.activityContent}>
              <Skeleton width="70%" height={16} style={styles.mb8} />
              <Skeleton width="50%" height={12} />
            </View>
            <View style={styles.activityRight}>
              <Skeleton width={50} height={20} style={styles.mb4} />
              <Skeleton width={40} height={12} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  statItem: {
    flex: 1,
  },
  earnOptions: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  optionCard: {
    width: '22%',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  activitySection: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  activityContent: {
    flex: 1,
  },
  activityRight: {
    alignItems: 'flex-end',
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
  mb16: {
    marginBottom: 16,
  },
});
