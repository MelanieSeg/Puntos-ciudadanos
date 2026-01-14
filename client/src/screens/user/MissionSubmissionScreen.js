/**
 * MissionSubmissionScreen - Envío de Evidencia de Misión
 * Pantalla donde el usuario sube fotos/documentos como prueba de completar una misión
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { missionsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function MissionSubmissionScreen({ route, navigation }) {
  const { missionId, missionName, missionPoints } = route.params || {};
  const { theme } = useTheme();
  
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectImage = () => {
    // Por hacer: integrar galería del dispositivo
    // const result = await ImagePicker.launchImageLibraryAsync({...});
    // setAttachments([...attachments, result]);
    // Por ahora, agregamos una imagen de prueba
    if (attachments.length < 3) {
      setAttachments([...attachments, {
        uri: 'https://via.placeholder.com/300',
        name: `Evidencia ${attachments.length + 1}.jpg`,
        type: 'image/jpeg',
      }]);
    }
  };

  const handleTakePhoto = () => {
    // Por hacer: integrar cámara del dispositivo
    // const result = await ImagePicker.launchCameraAsync({...});
    // setAttachments([...attachments, result]);
    // Por ahora, agregamos una foto de prueba
    if (attachments.length < 3) {
      setAttachments([...attachments, {
        uri: 'https://via.placeholder.com/300',
        name: `Foto ${attachments.length + 1}.jpg`,
        type: 'image/jpeg',
      }]);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Describe tu evidencia');
      return;
    }

    if (attachments.length === 0) {
      setError('Adjunta al menos una foto o documento');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Enviar evidencia a la API con descripción
      const evidenceUrl = attachments[0]?.uri || 'https://via.placeholder.com/300';
      
      const response = await missionsAPI.submitEvidence(
        missionId,
        evidenceUrl,
        description.trim() // Enviar la descripción del usuario
      );
      
      if (response.data.success) {
        // Mostrar alert
        if (Platform.OS === 'web') {
          window.alert('✅ Éxito - Evidencia enviada para revisión. ¡El admin la revisará pronto!');
        } else {
          Alert.alert('Éxito', 'Evidencia enviada para revisión. ¡El admin la revisará pronto!');
        }
        // Cerrar modal/pantalla después de 500ms
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        setError(response.data.message || 'Error al enviar evidencia');
      }
    } catch (err) {
      console.error('Error enviando evidencia:', err);
      setError(err.response?.data?.message || err.message || 'Error al enviar evidencia');
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Enviar Evidencia</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Misión Info */}
        <View style={styles.missionCard}>
          <MaterialCommunityIcons name="target" size={32} color={COLORS.primary} />
          <View style={styles.missionInfo}>
            <Text style={styles.missionName}>{missionName || 'Misión'}</Text>
            <Text style={styles.missionId}>ID: {missionId}</Text>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.label}>Describe tu evidencia</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Cuéntanos cómo completaste esta misión..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Adjuntos */}
        <View style={styles.section}>
          <Text style={styles.label}>Adjuntar Evidencia</Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleTakePhoto}
              disabled={loading}
            >
              <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
              <Text style={styles.uploadButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleSelectImage}
              disabled={loading}
            >
              <MaterialCommunityIcons name="file-image" size={24} color={COLORS.primary} />
              <Text style={styles.uploadButtonText}>Galería</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Adjuntos */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              <Text style={styles.attachmentsCount}>
                {attachments.length} archivo(s) adjuntado(s)
              </Text>
              {attachments.map((item, index) => (
                <View key={index} style={styles.attachment}>
                  <MaterialCommunityIcons name="file" size={20} color={COLORS.gray} />
                  <Text style={styles.attachmentName}>Archivo {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <MaterialCommunityIcons name="close" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Requisitos */}
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Requisitos</Text>
          <View style={styles.requirement}>
            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
            <Text style={styles.requirementText}>Foto clara y legible</Text>
          </View>
          <View style={styles.requirement}>
            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
            <Text style={styles.requirementText}>Documento original o certificado</Text>
          </View>
          <View style={styles.requirement}>
            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
            <Text style={styles.requirementText}>Máximo 10 archivos por misión</Text>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Botón Enviar */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Enviar Evidencia</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
    paddingTop: Platform.OS === 'web' ? SPACING.xl : SPACING.md,
    paddingBottom: SPACING.xl * 2,
    ...(Platform.OS === 'web' && {
      maxWidth: 900,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
  },
  missionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  missionInfo: {
    flex: 1,
  },
  missionName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  missionId: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  textarea: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.body2,
    borderWidth: 1,
    borderColor: COLORS.light,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  attachmentsList: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
  },
  attachmentsCount: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  attachmentName: {
    flex: 1,
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.dark,
  },
  requirements: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  requirementsTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  requirementText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.body2,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
  },
});
