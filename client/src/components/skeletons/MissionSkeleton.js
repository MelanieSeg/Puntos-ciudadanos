/**
 * MissionSkeleton - Skeleton loader para tarjetas de misiones
 * Simula la estructura de una tarjeta de misión
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../Skeleton';
import { COLORS, SPACING } from '../../theme/theme';

export default function MissionSkeleton() {
  return (
    <View style={styles.card}>
      {/* Badge de puntos */}
      <View style={styles.pointsBadge}>
        <Skeleton width={60} height={20} borderRadius={12} />
      </View>

      {/* Ícono circular */}
      <View style={styles.iconContainer}>
        <Skeleton width={80} height={80} borderRadius={40} />
      </View>

      {/* Título */}
      <Skeleton width="80%" height={18} style={styles.mb8} />

      {/* Descripción (2 líneas) */}
      <Skeleton width="100%" height={14} style={styles.mb4} />
      <Skeleton width="70%" height={14} style={styles.mb12} />

      {/* Frecuencia */}
      <View style={styles.frequencyRow}>
        <Skeleton width={12} height={12} borderRadius={6} style={styles.mr4} />
        <Skeleton width={80} height={12} />
      </View>

      {/* Botón de acción */}
      <View style={styles.buttonContainer}>
        <Skeleton width="100%" height={40} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    position: 'relative',
  },
  pointsBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  iconContainer: {
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonContainer: {
    width: '100%',
    marginTop: SPACING.sm,
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
  mr4: {
    marginRight: 4,
  },
});
