import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import api from '../../services/api';

export default function BenefitsManagementScreen() {
  const [loading, setLoading] = useState(false);
  const [benefits, setBenefits] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newBenefit, setNewBenefit] = useState({
    title: '',
    description: '',
    pointsCost: '',
    stock: '',
    merchantId: '',
    category: 'PRODUCT',
  });

  useEffect(() => {
    fetchBenefits();
    fetchMerchants();
  }, []);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      // Agregar timestamp para evitar caché del navegador
      const response = await api.get(`/benefits?t=${Date.now()}`);
      setBenefits(response.data.data || []);
    } catch (error) {
      console.error('Error al obtener beneficios:', error);
      Alert.alert('Error', 'No se pudieron cargar los beneficios');
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      const response = await api.get('/admin/users?role=MERCHANT');
      setMerchants(response.data.data?.users || []);
    } catch (error) {
      console.error('Error al obtener comercios:', error);
    }
  };

  const pickImage = async () => {
    // Solicitar permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tu galería');
      return;
    }

    // Abrir selector de imágenes
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleCreateBenefit = async () => {
    // Validaciones
    if (!newBenefit.title.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!newBenefit.description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    if (!newBenefit.pointsCost || parseInt(newBenefit.pointsCost) <= 0) {
      Alert.alert('Error', 'El costo en puntos debe ser mayor a 0');
      return;
    }
    if (!newBenefit.stock || parseInt(newBenefit.stock) < 0) {
      Alert.alert('Error', 'El stock debe ser un número válido');
      return;
    }
    if (!newBenefit.merchantId) {
      Alert.alert('Error', 'Debes seleccionar un comercio');
      return;
    }

    try {
      setCreating(true);

      // Crear FormData para enviar imagen
      const formData = new FormData();
      formData.append('title', newBenefit.title);
      formData.append('description', newBenefit.description);
      formData.append('pointsCost', parseInt(newBenefit.pointsCost));
      formData.append('stock', parseInt(newBenefit.stock));
      formData.append('merchantId', newBenefit.merchantId);
      formData.append('category', newBenefit.category);

      // Agregar imagen si se seleccionó
      if (selectedImage) {
        console.log('📸 Procesando imagen:', selectedImage.uri);
        const imageUri = selectedImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // En web, necesitamos convertir a Blob
        if (Platform.OS === 'web') {
          console.log('🌐 Plataforma web, convirtiendo a Blob...');
          try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            console.log('✅ Blob creado:', blob.size, 'bytes, tipo:', blob.type);
            formData.append('image', blob, filename);
          } catch (error) {
            console.error('❌ Error al convertir imagen a Blob:', error);
            throw error;
          }
        } else {
          formData.append('image', {
            uri: imageUri,
            name: filename,
            type: type,
          });
        }
      } else {
        console.log('⚠️ No hay imagen seleccionada');
      }

      console.log('📤 Enviando petición a /admin/benefits...');
      // Enviar con axios
      await api.post('/admin/benefits', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ Beneficio creado exitosamente');

      Alert.alert('Éxito', 'Beneficio creado exitosamente');
      setShowAddModal(false);
      setSelectedImage(null);
      setNewBenefit({
        title: '',
        description: '',
        pointsCost: '',
        stock: '',
        merchantId: '',
        category: 'PRODUCT',
      });
      fetchBenefits(); // Recargar lista
    } catch (error) {
      console.error('Error al crear beneficio:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el beneficio');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBenefit = async (benefitId, benefitName) => {
    // Guardar el beneficio a eliminar y mostrar modal
    setBenefitToDelete({ id: benefitId, name: benefitName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!benefitToDelete) return;

    try {
      setDeleting(true);
      console.log('🗑️ Eliminando beneficio:', benefitToDelete.id);
      await api.delete(`/admin/benefits/${benefitToDelete.id}`);
      console.log('✅ Beneficio eliminado');
      
      if (Platform.OS === 'web') {
        alert('Beneficio eliminado exitosamente');
      } else {
        Alert.alert('Éxito', 'Beneficio eliminado exitosamente');
      }
      
      setShowDeleteModal(false);
      setBenefitToDelete(null);
      fetchBenefits(); // Recargar lista
    } catch (error) {
      console.error('❌ Error al eliminar beneficio:', error);
      const mensaje = error.response?.data?.message || 'No se pudo eliminar el beneficio';
      
      if (Platform.OS === 'web') {
        alert(`Error: ${mensaje}`);
      } else {
        Alert.alert('Error', mensaje);
      }
    } finally {
      setDeleting(false);
    }
  };

  const renderBenefitCard = ({ item }) => (
    <View style={styles.benefitCard}>
      <View style={styles.benefitImage}>
        <MaterialCommunityIcons 
          name={getCategoryIcon(item.category)} 
          size={48} 
          color={COLORS.primary} 
        />
      </View>
      <View style={styles.benefitInfo}>
        <Text style={styles.benefitName}>{item.title}</Text>
        <Text style={styles.benefitDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.benefitMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="star-circle" size={16} color={COLORS.primary} />
            <Text style={styles.metaText}>{item.pointsCost} pts</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons 
              name="package-variant" 
              size={16} 
              color={item.stock === 0 ? COLORS.error : item.stock < 10 ? COLORS.warning : '#4CAF50'} 
            />
            <Text style={styles.metaText}>Stock: {item.stock}</Text>
          </View>
        </View>
        <Text style={styles.merchantName}>
          <MaterialCommunityIcons name="store" size={14} color={COLORS.gray} /> 
          {item.merchant?.name || 'Sin asignar'}
        </Text>
      </View>
      
      {/* Botón de eliminar */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBenefit(item.id, item.title)}
      >
        <MaterialCommunityIcons name="delete" size={24} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  const getCategoryIcon = (category) => {
    const icons = {
      'FOOD': 'food',
      'BEVERAGE': 'cup',
      'DISCOUNT': 'percent',
      'SERVICE': 'wrench',
      'ENTERTAINMENT': 'ticket',
      'PRODUCT': 'gift',
    };
    return icons[category] || 'gift';
  };

  if (loading) {
    return (
      <ScreenWrapper bgColor={COLORS.light}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando beneficios...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={COLORS.light}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestión de Beneficios</Text>
          <Text style={styles.subtitle}>{benefits.length} beneficios disponibles</Text>
        </View>
      </View>

      <FlatList
        data={benefits}
        keyExtractor={(item) => item.id}
        renderItem={renderBenefitCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="gift-off" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No hay beneficios creados</Text>
            <Text style={styles.emptySubtext}>
              Crea el primer beneficio para los ciudadanos
            </Text>
          </View>
        }
      />

      {/* Botón flotante para agregar */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Modal para crear beneficio */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <MaterialCommunityIcons name="gift-outline" size={48} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Crear Nuevo Beneficio</Text>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre del Beneficio *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Café Gratis"
                    value={newBenefit.title}
                    onChangeText={(text) => setNewBenefit({ ...newBenefit, title: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descripción *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe el beneficio..."
                    value={newBenefit.description}
                    onChangeText={(text) => setNewBenefit({ ...newBenefit, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                    <Text style={styles.inputLabel}>Costo (Puntos) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="100"
                      value={newBenefit.pointsCost}
                      onChangeText={(text) => setNewBenefit({ ...newBenefit, pointsCost: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Stock Inicial *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="50"
                      value={newBenefit.stock}
                      onChangeText={(text) => setNewBenefit({ ...newBenefit, stock: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Categoría *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={newBenefit.category}
                      onValueChange={(value) => setNewBenefit({ ...newBenefit, category: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="🎁 Producto" value="PRODUCT" />
                      <Picker.Item label="🍔 Comida" value="FOOD" />
                      <Picker.Item label="☕ Bebida" value="BEVERAGE" />
                      <Picker.Item label="💰 Descuento" value="DISCOUNT" />
                      <Picker.Item label="🔧 Servicio" value="SERVICE" />
                      <Picker.Item label="🎭 Entretenimiento" value="ENTERTAINMENT" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Comercio Asociado *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={newBenefit.merchantId}
                      onValueChange={(value) => setNewBenefit({ ...newBenefit, merchantId: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Selecciona un comercio..." value="" />
                      {Array.isArray(merchants) && merchants.map((merchant) => (
                        <Picker.Item 
                          key={merchant.id} 
                          label={`${merchant.name} (${merchant.email})`} 
                          value={merchant.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Imagen del Beneficio (Opcional)</Text>
                  
                  {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={pickImage}
                    >
                      <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.primary} />
                      <Text style={styles.imagePickerText}>📷 Seleccionar Foto</Text>
                      <Text style={styles.imagePickerSubtext}>Galería o cámara</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.noteText}>
                  * Campos requeridos
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setShowAddModal(false)}
                  disabled={creating}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButtonConfirm, creating && styles.buttonDisabled]}
                  onPress={handleCreateBenefit}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalButtonConfirmText}>Crear</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.error} />
              <Text style={styles.deleteModalTitle}>Confirmar eliminación</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              ¿Estás seguro de que deseas eliminar el beneficio{' '}
              <Text style={styles.deleteModalBenefitName}>"{benefitToDelete?.name}"</Text>?
            </Text>
            
            <Text style={styles.deleteModalWarning}>
              Esta acción no se puede deshacer.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.deleteModalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonDelete]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete" size={20} color={COLORS.white} />
                    <Text style={styles.deleteModalButtonDeleteText}>Eliminar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.lg,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitImage: {
    width: 80,
    height: 80,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  benefitName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  benefitDescription: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  benefitMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.dark,
    fontWeight: '600',
  },
  merchantName: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...LAYOUT.shadowMedium,
  },
  benefitActions: {
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    padding: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginTop: SPACING.xs,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  input: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.dark,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  noteText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    marginTop: SPACING.lg,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalButtonConfirmText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.white,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 120 : 50,
  },
  imagePickerButton: {
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  imagePickerSubtext: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: LAYOUT.borderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  // Estilos del modal de eliminación
  deleteModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    ...LAYOUT.shadowLarge,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  deleteModalTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  deleteModalBenefitName: {
    fontWeight: '700',
    color: COLORS.error,
  },
  deleteModalWarning: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: SPACING.xl,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  deleteModalButtonCancel: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.gray + '40',
  },
  deleteModalButtonCancelText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  deleteModalButtonDelete: {
    backgroundColor: COLORS.error,
  },
  deleteModalButtonDeleteText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.white,
  },
});
