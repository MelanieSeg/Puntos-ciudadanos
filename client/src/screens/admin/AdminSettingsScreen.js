/**
 * AdminSettingsScreen - Configuración de Políticas y Parámetros
 * Pantalla para que el administrador configure cooldowns, límites y políticas del sistema
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';

export default function AdminSettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Cooldowns
    missionCooldownDays: '',
    minPointsForRedeem: '',
    
    // Límites
    maxRedemptsPerDay: '',
    maxPointsPerDay: '',
    
    // Políticas
    requireApprovalForRedeem: false,
    allowMultipleMissionsPerDay: false,
    enableNewUserBonus: false,
    newUserBonusPoints: '',
    
    // Notificaciones
    notifyOnSubmission: false,
    notifyOnApproval: false,
  });

  React.useEffect(() => {
    // Por hacer: cargar configuración del sistema
    // loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // const response = await adminAPI.getSettings();
      // setSettings(response.data.data);
    } catch (error) {
      alert('Error cargando configuración: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    Alert.alert(
      'Guardar Configuración',
      '¿Estás seguro de que deseas aplicar estos cambios a todo el sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          style: 'default',
          onPress: async () => {
            try {
              setSaving(true);
              // Por hacer: guardar configuración actualizada
              // await adminAPI.updateSettings(settings);
              await new Promise(r => setTimeout(r, 1500));
              alert('Configuración guardada exitosamente');
            } catch (error) {
              alert('Error: ' + error.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Restablecer Predeterminados',
      '¿Estás seguro de que deseas restablecer todos los valores predeterminados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Por hacer: cargar valores predeterminados desde el backend
              // const response = await adminAPI.getDefaultSettings();
              // setSettings(response.data.data);
              alert('Funcionalidad pendiente de implementación');
            } catch (error) {
              alert('Error: ' + error.message);
            }
          },
        },
      ]
    );
  };

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
    <ScreenWrapper bgColor={COLORS.light} safeArea={false} padding={0}>
      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xl }}>
        {/* Cooldowns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="timer-sand" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Cooldowns</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Cooldown entre Misiones</Text>
              <Text style={styles.settingDescription}>Días entre envíos de misiones</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              keyboardType="number-pad"
              value={settings.missionCooldownDays}
              onChangeText={(value) =>
                setSettings({ ...settings, missionCooldownDays: value })
              }
              editable={!saving}
            />
            <Text style={styles.inputSuffix}>días</Text>
          </View>
        </View>

        {/* Límites de Puntos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="star-circle" size={24} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Límites de Puntos</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Puntos Mínimos para Canje</Text>
              <Text style={styles.settingDescription}>Puntos requeridos para redimir</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              keyboardType="number-pad"
              value={settings.minPointsForRedeem}
              onChangeText={(value) =>
                setSettings({ ...settings, minPointsForRedeem: value })
              }
              editable={!saving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Máximo Puntos por Día</Text>
              <Text style={styles.settingDescription}>Puntos máximos ganables en 24h</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              keyboardType="number-pad"
              value={settings.maxPointsPerDay}
              onChangeText={(value) =>
                setSettings({ ...settings, maxPointsPerDay: value })
              }
              editable={!saving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Máximos Canjes por Día</Text>
              <Text style={styles.settingDescription}>Beneficios canjeables en 24h</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              keyboardType="number-pad"
              value={settings.maxRedemptsPerDay}
              onChangeText={(value) =>
                setSettings({ ...settings, maxRedemptsPerDay: value })
              }
              editable={!saving}
            />
          </View>
        </View>

        {/* Políticas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Políticas</Text>
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Requerir Aprobación para Canje</Text>
              <Text style={styles.settingDescription}>
                Los canjes deben ser aprobados por admin
              </Text>
            </View>
            <Switch
              value={settings.requireApprovalForRedeem}
              onValueChange={(value) =>
                setSettings({ ...settings, requireApprovalForRedeem: value })
              }
              trackColor={{ false: COLORS.light, true: COLORS.primary + '40' }}
              thumbColor={settings.requireApprovalForRedeem ? COLORS.primary : COLORS.gray}
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Permitir Múltiples Misiones/Día</Text>
              <Text style={styles.settingDescription}>
                Los usuarios pueden enviar múltiples misiones en 24h
              </Text>
            </View>
            <Switch
              value={settings.allowMultipleMissionsPerDay}
              onValueChange={(value) =>
                setSettings({ ...settings, allowMultipleMissionsPerDay: value })
              }
              trackColor={{ false: COLORS.light, true: COLORS.primary + '40' }}
              thumbColor={
                settings.allowMultipleMissionsPerDay ? COLORS.primary : COLORS.gray
              }
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Bonus de Nuevo Usuario</Text>
              <Text style={styles.settingDescription}>
                Puntos iniciales para usuarios nuevos
              </Text>
            </View>
            <Switch
              value={settings.enableNewUserBonus}
              onValueChange={(value) =>
                setSettings({ ...settings, enableNewUserBonus: value })
              }
              trackColor={{ false: COLORS.light, true: COLORS.primary + '40' }}
              thumbColor={settings.enableNewUserBonus ? COLORS.primary : COLORS.gray}
              disabled={saving}
            />
          </View>

          {settings.enableNewUserBonus && (
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Text style={styles.settingName}>Puntos Bonus Inicial</Text>
                <Text style={styles.settingDescription}>
                  Puntos otorgados al registrarse
                </Text>
              </View>
              <TextInput
                style={styles.numberInput}
                keyboardType="number-pad"
                value={settings.newUserBonusPoints}
                onChangeText={(value) =>
                  setSettings({ ...settings, newUserBonusPoints: value })
                }
                editable={!saving}
              />
            </View>
          )}
        </View>

        {/* Notificaciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bell" size={24} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Notificaciones</Text>
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Notificar en Envío</Text>
              <Text style={styles.settingDescription}>
                Avisar cuando se envía una misión
              </Text>
            </View>
            <Switch
              value={settings.notifyOnSubmission}
              onValueChange={(value) =>
                setSettings({ ...settings, notifyOnSubmission: value })
              }
              trackColor={{ false: COLORS.light, true: COLORS.primary + '40' }}
              thumbColor={settings.notifyOnSubmission ? COLORS.primary : COLORS.gray}
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingName}>Notificar en Aprobación</Text>
              <Text style={styles.settingDescription}>
                Avisar cuando se aprueba una misión
              </Text>
            </View>
            <Switch
              value={settings.notifyOnApproval}
              onValueChange={(value) =>
                setSettings({ ...settings, notifyOnApproval: value })
              }
              trackColor={{ false: COLORS.light, true: COLORS.primary + '40' }}
              thumbColor={settings.notifyOnApproval ? COLORS.primary : COLORS.gray}
              disabled={saving}
            />
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={saving}
          >
            <MaterialCommunityIcons name="restore" size={20} color={COLORS.danger} />
            <Text style={styles.resetButtonText}>Restablecer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonLoading]}
            onPress={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Espaciado */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
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
  },
  title: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  settingLabel: {
    flex: 1,
  },
  settingName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  numberInput: {
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginLeft: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  resetButton: {
    flex: 1,
    backgroundColor: `${COLORS.error}15`,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...LAYOUT.shadowSmall,
  },
  resetButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...LAYOUT.shadowSmall,
  },
  saveButtonLoading: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
  },
});
