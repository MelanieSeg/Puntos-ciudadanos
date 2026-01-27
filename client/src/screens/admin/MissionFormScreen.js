/**
 * MissionFormScreen - Formulario para crear/editar misiones
 * Incluye todos los campos necesarios y selector de fecha de expiración
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import { MISSION_CATEGORIES, getCategoryIcon } from '../../utils/missionCategories';

export default function MissionFormScreen({ route, navigation }) {
  const { theme } = useTheme();
  const mission = route.params?.mission; // Para editar
  const isEdit = !!mission;

  const [formData, setFormData] = useState({
    name: mission?.name || '',
    description: mission?.description || '',
    points: mission?.points?.toString() || '',
    frequency: mission?.frequency || 'DAILY',
    evidenceType: mission?.evidenceType || 'PHOTO',
    category: mission?.category || 'OTHER',
  });

  const [hasExpiration, setHasExpiration] = useState(!!mission?.expiresAt);
  const [expirationDate, setExpirationDate] = useState(
    mission?.expiresAt ? new Date(mission.expiresAt) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setExpirationDate(selectedTime);
    }
  };

  const validate = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return false;
    }
    const points = parseInt(formData.points);
    if (isNaN(points) || points <= 0) {
      Alert.alert('Error', 'Los puntos deben ser un número mayor a 0');
      return false;
    }
    if (hasExpiration && expirationDate <= new Date()) {
      Alert.alert('Error', 'La fecha de expiración debe ser futura');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        points: parseInt(formData.points),
        frequency: formData.frequency,
        evidenceType: formData.evidenceType,
        category: formData.category,
        ...(hasExpiration && { expiresAt: expirationDate.toISOString() }),
      };

      if (isEdit) {
        await adminAPI.updateMission(mission.id, payload);
        
        if (Platform.OS === 'web') {
          alert('Misión actualizada exitosamente');
        } else {
          Alert.alert('Éxito', 'Misión actualizada exitosamente', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
        navigation.goBack();
      } else {
        await adminAPI.createMission(payload);
        
        if (Platform.OS === 'web') {
          alert('Misión creada exitosamente');
        } else {
          Alert.alert('Éxito', 'Misión creada exitosamente', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error al guardar misión:', error);
      const mensaje = error.response?.data?.message || error.message;
      if (Platform.OS === 'web') {
        alert('Error: ' + mensaje);
      } else {
        Alert.alert('Error', mensaje);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>
              {isEdit ? 'Editar Misión' : 'Nueva Misión'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.form}>
            {/* Nombre */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Nombre *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="Ej: Reciclar envases plásticos"
                placeholderTextColor={theme.textSecondary}
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                editable={!loading}
              />
            </View>

            {/* Descripción */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Descripción *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe qué debe hacer el usuario..."
                placeholderTextColor={theme.textSecondary}
                value={formData.description}
                onChangeText={(value) => handleChange('description', value)}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            {/* Puntos */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Puntos a Otorgar *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="Ej: 100"
                placeholderTextColor={theme.textSecondary}
                value={formData.points}
                onChangeText={(value) => handleChange('points', value)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            {/* Frecuencia */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Frecuencia *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Picker
                  selectedValue={formData.frequency}
                  onValueChange={(value) => handleChange('frequency', value)}
                  enabled={!loading}
                  style={[
                    { color: theme.text, backgroundColor: theme.inputBg },
                    Platform.OS === 'web' && { 
                      backgroundColor: theme.inputBg,
                      borderWidth: 0,
                      outlineStyle: 'none'
                    }
                  ]}
                  dropdownIconColor={theme.text}
                  itemStyle={{ color: theme.text, backgroundColor: theme.inputBg }}
                >
                  <Picker.Item label="Una sola vez" value="ONCE" color={theme.text} />
                  <Picker.Item label="Diaria" value="DAILY" color={theme.text} />
                  <Picker.Item label="Semanal" value="WEEKLY" color={theme.text} />
                  <Picker.Item label="Mensual" value="MONTHLY" color={theme.text} />
                  <Picker.Item label="Trimestral" value="QUARTERLY" color={theme.text} />
                  <Picker.Item label="Anual" value="YEARLY" color={theme.text} />
                  <Picker.Item label="Período Electoral" value="ELECTION_PERIOD" color={theme.text} />
                </Picker>
              </View>
            </View>

            {/* Tipo de Evidencia */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Tipo de Evidencia *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Picker
                  selectedValue={formData.evidenceType}
                  onValueChange={(value) => handleChange('evidenceType', value)}
                  enabled={!loading}
                  style={[
                    { color: theme.text, backgroundColor: theme.inputBg },
                    Platform.OS === 'web' && { 
                      backgroundColor: theme.inputBg,
                      borderWidth: 0,
                      outlineStyle: 'none'
                    }
                  ]}
                  dropdownIconColor={theme.text}
                  itemStyle={{ color: theme.text, backgroundColor: theme.inputBg }}
                >
                  <Picker.Item label="Fotografía" value="PHOTO" color={theme.text} />
                  <Picker.Item label="Documento" value="DOCUMENT" color={theme.text} />
                  <Picker.Item label="Certificado" value="CERTIFICATE" color={theme.text} />
                  <Picker.Item label="Recibo/Comprobante" value="RECEIPT" color={theme.text} />
                </Picker>
              </View>
            </View>

            {/* Categoría */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Categoría *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                  enabled={!loading}
                  style={[
                    { color: theme.text, backgroundColor: theme.inputBg },
                    Platform.OS === 'web' && { 
                      backgroundColor: theme.inputBg,
                      borderWidth: 0,
                      outlineStyle: 'none'
                    }
                  ]}
                  dropdownIconColor={theme.text}
                  itemStyle={{ color: theme.text, backgroundColor: theme.inputBg }}
                >
                  {MISSION_CATEGORIES.map(cat => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} color={theme.text} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Fecha de Expiración */}
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: theme.text }]}>¿Tiene fecha de expiración?</Text>
                <Switch
                  value={hasExpiration}
                  onValueChange={setHasExpiration}
                  disabled={loading}
                  trackColor={{ false: theme.border, true: COLORS.primary }}
                  thumbColor={hasExpiration ? COLORS.white : theme.textSecondary}
                />
              </View>

              {hasExpiration && (
                Platform.OS === 'web' ? (
                  <View style={styles.dateTimeContainer}>
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Fecha:</Text>
                      <input
                        type="date"
                        value={expirationDate.toISOString().split('T')[0]}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value + 'T' + expirationDate.toTimeString().split(' ')[0]);
                          setExpirationDate(newDate);
                        }}
                        style={{
                          flex: 1,
                          padding: SPACING.sm,
                          borderRadius: LAYOUT.borderRadius.md,
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.inputBg,
                          color: theme.text,
                          fontSize: TYPOGRAPHY.body2,
                        }}
                      />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Hora:</Text>
                      <input
                        type="time"
                        value={expirationDate.toTimeString().split(' ')[0].substring(0, 5)}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(expirationDate);
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          setExpirationDate(newDate);
                        }}
                        style={{
                          flex: 1,
                          padding: SPACING.sm,
                          borderRadius: LAYOUT.borderRadius.md,
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.inputBg,
                          color: theme.text,
                          fontSize: TYPOGRAPHY.body2,
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={styles.dateTimeContainer}>
                      <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primary} />
                        <Text style={[styles.dateButtonText, { color: theme.text }]}>
                          {expirationDate.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
                        <Text style={[styles.dateButtonText, { color: theme.text }]}>
                          {expirationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                      <DateTimePicker
                        value={expirationDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                      />
                    )}

                    {showTimePicker && (
                      <DateTimePicker
                        value={expirationDate}
                        mode="time"
                        display="default"
                        onChange={onTimeChange}
                      />
                    )}
                  </View>
                )
              )}
            </View>

            {/* Botones */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                    <Text style={styles.submitButtonText}>
                      {isEdit ? 'Guardar Cambios' : 'Crear Misión'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
  },
  form: {
    padding: SPACING.md,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.caption,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  dateButtonText: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
  },
});
