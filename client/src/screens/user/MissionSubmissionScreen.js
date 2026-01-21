/**
 * MissionSubmissionScreen - Envío de Evidencia de Misión
 * Pantalla donde el usuario sube fotos/documentos como prueba de completar una misión
 * Integración completa con expo-image-picker y Cloudinary (1-4 imágenes)
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
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { missionsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const MAX_IMAGES = 4;
const MIN_IMAGES = 1;

export default function MissionSubmissionScreen({ route, navigation }) {
  const { missionId, missionName, missionPoints } = route.params || {};
  const { theme } = useTheme();
  
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Solicitar permisos de galería y seleccionar imagen
   */
  const pickImage = async () => {
    try {
      // Verificar si ya alcanzamos el máximo
      if (images.length >= MAX_IMAGES) {
        const message = `Solo puedes adjuntar hasta ${MAX_IMAGES} imágenes`;
        Platform.OS === 'web' ? window.alert(message) : Alert.alert('Límite alcanzado', message);
        return;
      }

      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const message = 'Necesitamos permiso para acceder a tu galería';
        Platform.OS === 'web' ? window.alert(message) : Alert.alert('Permisos requeridos', message);
        return;
      }

      // Lanzar selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImages([...images, asset]);
        setError(null);
      }
    } catch (err) {
      console.error('Error seleccionando imagen:', err);
      setError('Error al seleccionar imagen');
    }
  };

  /**
   * Solicitar permisos de cámara y tomar foto
   */
  const takePhoto = async () => {
    try {
      // Verificar si ya alcanzamos el máximo
      if (images.length >= MAX_IMAGES) {
        const message = `Solo puedes adjuntar hasta ${MAX_IMAGES} imágenes`;
        Platform.OS === 'web' ? window.alert(message) : Alert.alert('Límite alcanzado', message);
        return;
      }

      // Solicitar permisos
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        const message = 'Necesitamos permiso para acceder a tu cámara';
        Platform.OS === 'web' ? window.alert(message) : Alert.alert('Permisos requeridos', message);
        return;
      }

      // Lanzar cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImages([...images, asset]);
        setError(null);
      }
    } catch (err) {
      console.error('Error tomando foto:', err);
      setError('Error al tomar foto');
    }
  };

  /**
   * Eliminar una imagen de la lista
   */
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  /**
   * Enviar evidencia al backend
   */
  const handleSubmit = async () => {
    // Validaciones
    if (!description.trim()) {
      setError('Por favor describe tu evidencia');
      return;
    }

    if (images.length < MIN_IMAGES) {
      setError(`Debes adjuntar al menos ${MIN_IMAGES} imagen(es)`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Crear FormData con las imágenes
      const formData = new FormData();
      formData.append('description', description.trim());

      // Agregar cada imagen al FormData
      if (Platform.OS === 'web') {
        // En web, convertir las imágenes a Blob
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          try {
            // Fetch the image data
            const response = await fetch(image.uri);
            const blob = await response.blob();
            
            const fileExtension = image.uri.split('.').pop().split('?')[0] || 'jpg';
            const fileName = `evidence_${Date.now()}_${i}.${fileExtension}`;
            
            // Create a File object from the blob
            const file = new File([blob], fileName, { 
              type: blob.type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}` 
            });
            
            formData.append('evidence', file);
          } catch (fetchError) {
            console.error('Error fetching image:', fetchError);
            throw new Error('No se pudo procesar la imagen');
          }
        }
      } else {
        // En mobile (iOS/Android), usar el formato nativo
        images.forEach((image, index) => {
          const fileExtension = image.uri.split('.').pop();
          const fileName = `evidence_${Date.now()}_${index}.${fileExtension}`;
          
          formData.append('evidence', {
            uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
            name: fileName,
            type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          });
        });
      }

      // Enviar al backend
      const response = await missionsAPI.submitEvidence(missionId, formData);

      if (response.data.success) {
        // Mostrar mensaje de éxito
        const message = 'Evidencia enviada para revisión. ¡El admin la revisará pronto!';
        if (Platform.OS === 'web') {
          window.alert(`✅ Éxito\n\n${message}`);
        } else {
          Alert.alert('✅ Éxito', message, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }

        // Navegar de vuelta después de un delay
        setTimeout(() => {
          navigation.goBack();
        }, Platform.OS === 'web' ? 100 : 500);
      } else {
        setError(response.data.message || 'Error al enviar evidencia');
      }
    } catch (err) {
      console.error('Error enviando evidencia:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al enviar evidencia';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Enviar Evidencia</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Misión Info */}
        <View style={[styles.missionCard, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="target" size={32} color={COLORS.primary} />
          <View style={styles.missionInfo}>
            <Text style={[styles.missionName, { color: theme.text }]}>{missionName || 'Misión'}</Text>
            <View style={styles.pointsBadge}>
              <MaterialCommunityIcons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.pointsText}>{missionPoints || 0} pts</Text>
            </View>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Describe tu evidencia *</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Cuéntanos cómo completaste esta misión..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={500}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {description.length}/500 caracteres
          </Text>
        </View>

        {/* Adjuntar Imágenes */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>
            Adjuntar Evidencia * ({images.length}/{MAX_IMAGES})
          </Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={[
                styles.uploadButton, 
                { backgroundColor: theme.surface, borderColor: theme.border },
                images.length >= MAX_IMAGES && styles.uploadButtonDisabled
              ]}
              onPress={takePhoto}
              disabled={loading || images.length >= MAX_IMAGES}
            >
              <MaterialCommunityIcons name="camera" size={24} color={images.length >= MAX_IMAGES ? COLORS.gray : COLORS.primary} />
              <Text style={[styles.uploadButtonText, { color: images.length >= MAX_IMAGES ? COLORS.gray : COLORS.primary }]}>
                Cámara
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadButton, 
                { backgroundColor: theme.surface, borderColor: theme.border },
                images.length >= MAX_IMAGES && styles.uploadButtonDisabled
              ]}
              onPress={pickImage}
              disabled={loading || images.length >= MAX_IMAGES}
            >
              <MaterialCommunityIcons name="image" size={24} color={images.length >= MAX_IMAGES ? COLORS.gray : COLORS.primary} />
              <Text style={[styles.uploadButtonText, { color: images.length >= MAX_IMAGES ? COLORS.gray : COLORS.primary }]}>
                Galería
              </Text>
            </TouchableOpacity>
          </View>

          {/* Previsualización de Imágenes */}
          {images.length > 0 && (
            <View style={styles.imagesPreview}>
              {images.map((image, index) => (
                <View key={index} style={[styles.imageCard, { backgroundColor: theme.surface }]}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                    disabled={loading}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.danger} />
                  </TouchableOpacity>
                  <Text style={[styles.imageNumber, { color: theme.textSecondary }]}>
                    Imagen {index + 1}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Requisitos */}
        <View style={[styles.requirements, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="information" size={20} color={COLORS.info} />
          <View style={styles.requirementsContent}>
            <Text style={[styles.requirementsTitle, { color: theme.text }]}>Requisitos</Text>
            <View style={styles.requirement}>
              <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                Mínimo {MIN_IMAGES} y máximo {MAX_IMAGES} fotos
              </Text>
            </View>
            <View style={styles.requirement}>
              <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                Imágenes claras y legibles
              </Text>
            </View>
            <View style={styles.requirement}>
              <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
              <Text style={[styles.requirementText, { color: theme.textSecondary }]}>
                Describe cómo completaste la misión
              </Text>
            </View>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Botón Enviar */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || images.length < MIN_IMAGES || !description.trim()) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading || images.length < MIN_IMAGES || !description.trim()}
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 4,
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
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  imagesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  imageCard: {
    width: (Dimensions.get('window').width - SPACING.md * 4 - SPACING.sm) / 2,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...LAYOUT.shadowSmall,
  },
  imagePreview: {
    width: '100%',
    height: 150,
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.white + 'DD',
    borderRadius: 12,
  },
  imageNumber: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: SPACING.xs,
  },
  requirements: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  requirementsContent: {
    flex: 1,
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
