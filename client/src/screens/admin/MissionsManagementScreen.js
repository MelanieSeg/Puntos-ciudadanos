/**
 * MissionsManagementScreen - CRUD de Misiones
 * Pantalla de administrador para crear, editar y eliminar misiones
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

export default function MissionsManagementScreen({ navigation }) {
  const { theme } = useTheme();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, PAUSED, ARCHIVED

  useFocusEffect(
    useCallback(() => {
      loadMissions();
    }, [filter])
  );

  const loadMissions = async () => {
    try {
      setLoading(true);
      // Por hacer: conectar a GET /api/v1/admin/missions?status={filter}
      // const response = await adminAPI.getMissions(filter);
      // setMissions(response.data.data);
      setMissions([]);
    } catch (error) {
      console.error('Error loading missions:', error);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const handleEditMission = (mission) => {
    navigation.navigate('EditMission', { mission });
  };

  const handleDeleteMission = (missionId) => {
    Alert.alert(
      'Eliminar Misión',
      '¿Estás seguro? Se eliminarán todos los envíos asociados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Por hacer: conectar a DELETE /api/v1/admin/missions/{id}
              // await adminAPI.deleteMission(missionId);
              await new Promise(r => setTimeout(r, 600));
              
              setMissions(missions.filter(m => m.id !== missionId));
              alert('Misión eliminada');
            } catch (error) {
              alert('Error al eliminar: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = (mission) => {
    const newStatus = mission.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    Alert.alert(
      newStatus === 'ACTIVE' ? 'Reactivar' : 'Pausar',
      `¿Estás seguro de que deseas ${newStatus === 'ACTIVE' ? 'reactivar' : 'pausar'} esta misión?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'default',
          onPress: async () => {
            try {
              // Por hacer: conectar a PATCH /api/v1/admin/missions/{id}/status
              // await adminAPI.updateMissionStatus(mission.id, newStatus);
              await new Promise(r => setTimeout(r, 600));
              
              setMissions(
                missions.map(m =>
                  m.id === mission.id ? { ...m, status: newStatus } : m
                )
              );
            } catch (error) {
              alert('Error: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const difficultyColor = {
    EASY: COLORS.success,
    MEDIUM: '#ff9800',
    HARD: COLORS.danger,
  };

  const statusColor = {
    ACTIVE: COLORS.success,
    PAUSED: COLORS.warning,
    ARCHIVED: COLORS.gray,
  };

  const renderMissionCard = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={item.icon}
            size={28}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.missionName, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: difficultyColor[item.difficulty] + '20' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: difficultyColor[item.difficulty] },
                ]}
              >
                {item.difficulty === 'EASY'
                  ? 'Fácil'
                  : item.difficulty === 'MEDIUM'
                  ? 'Media'
                  : 'Difícil'}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: statusColor[item.status] + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: statusColor[item.status] },
                ]}
              >
                {item.status === 'ACTIVE'
                  ? 'Activa'
                  : item.status === 'PAUSED'
                  ? 'Pausada'
                  : 'Archivada'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.pointsBox}>
          <MaterialCommunityIcons
            name="star"
            size={16}
            color={COLORS.warning}
          />
          <Text style={styles.pointsText}>{item.points}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="inbox-multiple" size={16} color={COLORS.info} />
          <Text style={styles.statText}>
            {item.submissionsCount} envío(s)
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
          <Text style={styles.statText}>
            {item.approvalsCount} aprobado(s)
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="repeat" size={16} color={COLORS.gray} />
          <Text style={styles.statText}>{item.frequency}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() => handleToggleStatus(item)}
        >
          <MaterialCommunityIcons
            name={item.status === 'ACTIVE' ? 'pause-circle' : 'play-circle'}
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.actionSmallText}>
            {item.status === 'ACTIVE' ? 'Pausar' : 'Reactivar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonInfo}
          onPress={() => handleEditMission(item)}
        >
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.info} />
          <Text style={styles.actionSmallText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonDanger}
          onPress={() => handleDeleteMission(item.id)}
        >
          <MaterialCommunityIcons name="trash-can" size={18} color={COLORS.danger} />
          <Text style={styles.actionSmallText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper bgColor={COLORS.light} safeArea={false}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Filtros */}
      <View style={[styles.filters, { backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
        {['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              { backgroundColor: theme.inputBg },
              filter === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: theme.textSecondary },
                filter === status && styles.filterButtonTextActive,
              ]}
            >
              {status === 'ALL'
                ? 'Todas'
                : status === 'ACTIVE'
                ? 'Activas'
                : status === 'PAUSED'
                ? 'Pausadas'
                : 'Archivadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={missions}
        renderItem={renderMissionCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="target" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No hay misiones creadas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateMission')}
            >
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>Crear Primera Misión</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  title: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  createButton: {
    padding: SPACING.sm,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  filterButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  missionName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  badge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  pointsBox: {
    flexDirection: 'row',
    backgroundColor: '#fff8e1',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  pointsText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.warning,
  },
  description: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
    marginBottom: SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
    ...LAYOUT.shadowSmall,
  },
  actionButtonInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: `${COLORS.info}10`,
    borderWidth: 1,
    borderColor: COLORS.info,
    gap: SPACING.xs,
    ...LAYOUT.shadowSmall,
  },
  actionButtonDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: `${COLORS.error}10`,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: SPACING.xs,
    ...LAYOUT.shadowSmall,
  },
  actionSmallText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.dark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...LAYOUT.shadowSmall,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
  },
});
