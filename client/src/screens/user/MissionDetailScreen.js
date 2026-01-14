/**
 * MissionDetailScreen - Detalle de Misión
 * Pantalla que muestra información completa de una misión y permite al usuario enviar evidencia
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

export default function MissionDetailScreen({ route, navigation }) {
  const { missionId, mission } = route.params || {};
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Por hacer: conectar a GET /api/v1/missions/{missionId}
    // para obtener datos completos si no está en route.params
  }, [missionId]);

  const handleSubmitMission = () => {
    navigation.navigate('MissionSubmission', {
      missionId: mission?.id,
      missionName: mission?.name,
    });
  };

  const data = mission || {
    id: 'mission_001',
    name: 'Reciclaje de Plásticos',
    description: 'Recicla 5kg de plástico en un punto de acopio municipal',
    points: 50,
    category: 'RECYCLING',
    difficulty: 'EASY',
    frequency: 'WEEKLY',
    cooldownDays: 7,
    requirements: [
      'Mínimo 5kg de plástico',
      'Punto de acopio autorizado',
      'Evidencia fotográfica',
    ],
    hoursRemaining: 12,
    submissions: 24,
    approvals: 18,
    icon: 'trash-can',
  };

  const canSubmit = data.hoursRemaining > 0;

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Detalles de Misión</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.heroCard}>
          <View style={styles.iconLarge}>
            <MaterialCommunityIcons
              name={data.icon}
              size={48}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.missionName}>{data.name}</Text>
          <View style={styles.pointsLarge}>
            <MaterialCommunityIcons name="star" size={28} color={COLORS.warning} />
            <Text style={styles.pointsLargeText}>{data.points}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{data.description}</Text>
        </View>
        <View style={styles.badgesSection}>
          <View style={styles.infoBadge}>
            <MaterialCommunityIcons name="timer" size={20} color={COLORS.info} />
            <View>
              <Text style={styles.badgeLabel}>Frecuencia</Text>
              <Text style={styles.badgeValue}>{data.frequency}</Text>
            </View>
          </View>
          <View style={styles.infoBadge}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.warning} />
            <View>
              <Text style={styles.badgeLabel}>Dificultad</Text>
              <Text style={styles.badgeValue}>Media</Text>
            </View>
          </View>
          <View style={styles.infoBadge}>
            <MaterialCommunityIcons name="reload" size={20} color={COLORS.gray} />
            <View>
              <Text style={styles.badgeLabel}>Cooldown</Text>
              <Text style={styles.badgeValue}>{data.cooldownDays}d</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requisitos</Text>
          {data.requirements.map((req, idx) => (
            <View key={idx} style={styles.requirement}>
              <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.success} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{data.submissions}</Text>
              <Text style={styles.statLabel}>Envíos</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{data.approvals}</Text>
              <Text style={styles.statLabel}>Aprobados</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {Math.round((data.approvals / data.submissions) * 100) || 0}%
              </Text>
              <Text style={styles.statLabel}>Tasa Éxito</Text>
            </View>
          </View>
        </View>
        {!canSubmit && (
          <View style={styles.cooldownAlert}>
            <MaterialCommunityIcons
              name="clock-alert"
              size={20}
              color={COLORS.warning}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cooldownTitle}>Cooldown Activo</Text>
              <Text style={styles.cooldownText}>
                Podrás enviar evidencia en {data.hoursRemaining} horas
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmitMission}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>
                {canSubmit ? 'Enviar Evidencia' : 'En Cooldown'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  missionName: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  pointsLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#fff8e1',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
  },
  pointsLargeText: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.warning,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    lineHeight: 22,
  },
  badgesSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadowSmall,
  },
  badgeLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  badgeValue: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.xs,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  requirementText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.dark,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  cooldownAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#fff3cd',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  cooldownTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: '#856404',
  },
  cooldownText: {
    fontSize: TYPOGRAPHY.caption,
    color: '#856404',
    marginTop: SPACING.xs,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
});
