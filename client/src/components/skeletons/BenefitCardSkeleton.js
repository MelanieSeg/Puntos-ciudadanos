/**
 * BenefitCardSkeleton - Skeleton loader para tarjetas de beneficios
 * Simula la estructura de una tarjeta de beneficio
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../Skeleton';
import { COLORS, SPACING } from '../../theme/theme';

export default function BenefitCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Imagen del beneficio */}
      <Skeleton 
        width="100%" 
        height={140} 
        borderRadius={12}
        style={styles.image}
      />
      
      {/* Contenido */}
      <View style={styles.content}>
        {/* Título */}
        <Skeleton width="90%" height={16} style={styles.mb8} />
        
        {/* Descripción */}
        <Skeleton width="70%" height={12} style={styles.mb12} />
        
        {/* Footer con puntos */}
        <View style={styles.footer}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  image: {
    marginBottom: 0,
  },
  content: {
    padding: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
});
