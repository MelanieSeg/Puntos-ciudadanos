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
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import { getCategoryIcon, getFrequencyLabel } from '../../utils/missionCategories';

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
      // Mapear filtros del frontend al formato del backend
      let statusParam = null;
      if (filter === 'ACTIVE') statusParam = 'active';
      else if (filter === 'PAUSED') statusParam = 'inactive';
      // 'ALL' y 'ARCHIVED' se manejan sin parámetro (todas las misiones)
      
      console.log('[MissionsManagement] Loading missions with status:', statusParam);
      const response = await adminAPI.getAllMissions(statusParam);
      setMissions(response.data.data.missions || []);
    } catch (error) {
      console.error('Error loading missions:', error);
      console.error('Error response:', error.response?.data);
      if (Platform.OS === 'web') {
        alert('Error al cargar misiones: ' + (error.response?.data?.message || error.message));
      } else {
        Alert.alert('Error', 'No se pudieron cargar las misiones');
      }
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
    navigation.navigate('MissionForm', { mission });
  };

  const handleDeleteMission = async (missionId) => {
    const mensaje = '¿Estás seguro? Se eliminarán todos los envíos asociados.';
    
    // En web usar confirm, en mobile usar Alert
    const confirmed = Platform.OS === 'web'
      ? window.confirm(mensaje)
      : await new Promise((resolve) => {
          Alert.alert(
            'Eliminar Misión',
            mensaje,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
    
    if (!confirmed) return;
    
    try {
      await adminAPI.deleteMission(missionId);
      
      setMissions(missions.filter(m => m.id !== missionId));
      
      if (Platform.OS === 'web') {
        alert('Misión eliminada exitosamente');
      } else {
        Alert.alert('Éxito', 'Misión eliminada exitosamente');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message;
      if (Platform.OS === 'web') {
        alert('Error al eliminar: ' + mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
    }
  };

  const handleToggleStatus = async (mission) => {
    const newActive = !mission.active;
    const mensaje = `¿Estás seguro de que deseas ${newActive ? 'reactivar' : 'pausar'} esta misión?`;
    
    // En web usar confirm, en mobile usar Alert
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(mensaje)
      : await new Promise((resolve) => {
          Alert.alert(
            newActive ? 'Reactivar Misión' : 'Pausar Misión',
            mensaje,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continuar', style: 'default', onPress: () => resolve(true) },
            ]
          );
        });
    
    if (!confirmed) return;
    
    try {
      await adminAPI.updateMissionStatus(mission.id, newActive);
      
      setMissions(
        missions.map(m =>
          m.id === mission.id ? { ...m, active: newActive } : m
        )
      );
      
      if (Platform.OS === 'web') {
        alert(`Misión ${newActive ? 'reactivada' : 'pausada'} exitosamente`);
      } else {
        Alert.alert('Éxito', `Misión ${newActive ? 'reactivada' : 'pausada'}`);
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || error.message;
      if (Platform.OS === 'web') {
        alert('Error: ' + mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
    }
  };

  const renderMissionCard = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.inputBg }]}>
          <MaterialCommunityIcons
            name={getCategoryIcon(item.category || 'OTHER')}
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
                {
                  backgroundColor: (item.active ? COLORS.success : COLORS.gray) + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: item.active ? COLORS.success : COLORS.gray },
                ]}
              >
                {item.active ? 'Activa' : 'Pausada'}
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

      <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="inbox-multiple" size={16} color={COLORS.info} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.totalSubmissions || 0} envío(s)
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="repeat" size={16} color={COLORS.gray} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>{getFrequencyLabel(item.frequency)}</Text>
        </View>
        {item.expiresAt && (
          <View style={styles.stat}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.warning} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              Expira: {new Date(item.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() => handleToggleStatus(item)}
        >
          <MaterialCommunityIcons
            name={item.active ? 'pause-circle' : 'play-circle'}
            size={18}
            color={COLORS.primary}
          />
          <Text style={[styles.actionSmallText, { color: theme.text }]}>
            {item.active ? 'Pausar' : 'Reactivar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonInfo}
          onPress={() => handleEditMission(item)}
        >
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.info} />
          <Text style={[styles.actionSmallText, { color: theme.text }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonDanger}
          onPress={() => handleDeleteMission(item.id)}
        >
          <MaterialCommunityIcons name="trash-can" size={18} color={COLORS.danger} />
          <Text style={[styles.actionSmallText, { color: theme.text }]}>Eliminar</Text>
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
              onPress={() => navigation.navigate('MissionForm')}
            >
              <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>Crear Primera Misión</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB - Botón flotante para crear misión */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('MissionForm')}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
});
