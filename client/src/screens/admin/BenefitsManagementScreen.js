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
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function BenefitsManagementScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [benefits, setBenefits] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState(null);
  const [benefitToEdit, setBenefitToEdit] = useState(null);
  const [benefitToToggleStock, setBenefitToToggleStock] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, AVAILABLE, OUT_OF_STOCK
  const [newBenefit, setNewBenefit] = useState({
    title: '',
    description: '',
    pointsCost: '',
    stock: '',
    merchantId: '',
    category: 'PRODUCTO',
  });
  const [editBenefit, setEditBenefit] = useState({
    title: '',
    description: '',
    pointsCost: '',
    stock: '',
    merchantId: '',
    category: 'PRODUCTO',
  });

  useEffect(() => {
    fetchBenefits();
    fetchMerchants();
  }, []);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/benefits?t=${Date.now()}`);
      setBenefits(response.data.data || []);
    } catch (error) {
      console.error('Error al obtener beneficios:', error);
      Alert.alert('Error', 'No se pudieron cargar los beneficios');
    } finally {
      setLoading(false);
    }
  };

  const filteredBenefits = benefits.filter(benefit => {
    if (filter === 'ALL') return true;
    if (filter === 'AVAILABLE') return benefit.stock > 0;
    if (filter === 'OUT_OF_STOCK') return benefit.stock === 0;
    return true;
  });

  const fetchMerchants = async () => {
    try {
      const response = await api.get('/admin/users?role=MERCHANT');
      setMerchants(response.data.data?.users || []);
    } catch (error) {
      console.error('Error al obtener comercios:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tu galería');
      return;
    }

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

      const formData = new FormData();
      formData.append('title', newBenefit.title);
      formData.append('description', newBenefit.description);
      formData.append('pointsCost', parseInt(newBenefit.pointsCost));
      formData.append('stock', parseInt(newBenefit.stock));
      formData.append('merchantId', newBenefit.merchantId);
      formData.append('category', newBenefit.category);

      if (selectedImage) {
        const imageUri = selectedImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        if (Platform.OS === 'web') {
          try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            formData.append('image', blob, filename);
          } catch (error) {
            console.error('Error al convertir imagen a Blob:', error);
            throw error;
          }
        } else {
          formData.append('image', {
            uri: imageUri,
            name: filename,
            type: type,
          });
        }
      }

      await api.post('/admin/benefits', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Éxito', 'Beneficio creado exitosamente');
      setShowAddModal(false);
      setSelectedImage(null);
      setNewBenefit({
        title: '',
        description: '',
        pointsCost: '',
        stock: '',
        merchantId: '',
        category: 'PRODUCTO',
      });
      fetchBenefits();
    } catch (error) {
      console.error('Error al crear beneficio:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el beneficio');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBenefit = async (benefitId, benefitName) => {
    setBenefitToDelete({ id: benefitId, name: benefitName });
    setShowDeleteModal(true);
  };

  const handleEditBenefit = (benefit) => {
    setBenefitToEdit(benefit);
    setEditBenefit({
      title: benefit.title,
      description: benefit.description,
      pointsCost: benefit.pointsCost.toString(),
      stock: benefit.stock.toString(),
      merchantId: benefit.merchantId,
      category: benefit.category,
    });
    setSelectedImage(null);
    setShowEditModal(true);
  };

  const handleUpdateBenefit = async () => {
    if (!editBenefit.title.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!editBenefit.description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    if (!editBenefit.pointsCost || parseInt(editBenefit.pointsCost) <= 0) {
      Alert.alert('Error', 'El costo en puntos debe ser mayor a 0');
      return;
    }
    if (editBenefit.stock === '' || parseInt(editBenefit.stock) < 0) {
      Alert.alert('Error', 'El stock debe ser un número válido');
      return;
    }
    if (!editBenefit.merchantId) {
      Alert.alert('Error', 'Debes seleccionar un comercio');
      return;
    }

    try {
      setUpdating(true);

      const formData = new FormData();
      formData.append('title', editBenefit.title);
      formData.append('description', editBenefit.description);
      formData.append('pointsCost', parseInt(editBenefit.pointsCost));
      formData.append('stock', parseInt(editBenefit.stock));
      formData.append('merchantId', editBenefit.merchantId);
      formData.append('category', editBenefit.category);

      if (selectedImage) {
        const imageUri = selectedImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        if (Platform.OS === 'web') {
          try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            formData.append('image', blob, filename);
          } catch (error) {
            console.error('Error al convertir imagen a Blob:', error);
            throw error;
          }
        } else {
          formData.append('image', {
            uri: imageUri,
            name: filename,
            type: type,
          });
        }
      }

      await api.patch(`/admin/benefits/${benefitToEdit.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Éxito', 'Beneficio actualizado exitosamente');
      setShowEditModal(false);
      setBenefitToEdit(null);
      setSelectedImage(null);
      fetchBenefits();
    } catch (error) {
      console.error('Error al actualizar beneficio:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar el beneficio');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStock = (benefit) => {
    setBenefitToToggleStock(benefit);
    setShowStockModal(true);
  };

  const confirmToggleStock = async () => {
    if (!benefitToToggleStock) return;

    const newStock = benefitToToggleStock.stock === 0 ? 10 : 0;

    try {
      setUpdatingStock(true);
      await api.patch(`/admin/benefits/${benefitToToggleStock.id}/stock`, { stock: newStock });
      
      setShowStockModal(false);
      setBenefitToToggleStock(null);
      await fetchBenefits();
      
      if (Platform.OS === 'web') {
        alert(`Stock ${newStock > 0 ? 'restaurado' : 'agotado'} correctamente`);
      } else {
        Alert.alert('Éxito', `Stock ${newStock > 0 ? 'restaurado' : 'agotado'} correctamente`);
      }
    } catch (error) {
      console.error('Error al cambiar stock:', error);
      const mensaje = error.response?.data?.message || 'No se pudo cambiar el stock';
      
      if (Platform.OS === 'web') {
        alert(`Error: ${mensaje}`);
      } else {
        Alert.alert('Error', mensaje);
      }
    } finally {
      setUpdatingStock(false);
    }
  };

  const confirmDelete = async () => {
    if (!benefitToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/admin/benefits/${benefitToDelete.id}`);
      
      if (Platform.OS === 'web') {
        alert('Beneficio eliminado exitosamente');
      } else {
        Alert.alert('Éxito', 'Beneficio eliminado exitosamente');
      }
      
      setShowDeleteModal(false);
      setBenefitToDelete(null);
      fetchBenefits();
    } catch (error) {
      console.error('Error al eliminar beneficio:', error);
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
    <View style={[styles.benefitCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.benefitImage}>
          <MaterialCommunityIcons 
            name={getCategoryIcon(item.category)} 
            size={40} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.benefitInfo}>
          <Text style={[styles.benefitName, { color: theme.text }]}>{item.title}</Text>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: item.stock === 0 ? '#f8d7da' : '#d4edda' }]}>
              <Text style={[styles.badgeText, { color: item.stock === 0 ? '#721c24' : '#155724' }]}>
                {item.stock === 0 ? 'Agotado' : 'Disponible'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }]}>
              <Text style={[styles.badgeText, { color: theme.text }]}>{item.category}</Text>
            </View>
          </View>
        </View>
        <View style={styles.pointsBox}>
          <MaterialCommunityIcons name="star" size={16} color="#FFB84D" />
          <Text style={styles.pointsText}>{item.pointsCost}</Text>
        </View>
      </View>

      <Text style={[styles.benefitDescription, { color: theme.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <MaterialCommunityIcons 
            name="package-variant" 
            size={16} 
            color={item.stock === 0 ? COLORS.error : item.stock < 10 ? COLORS.warning : '#4CAF50'} 
          />
          <Text style={styles.statText}>Stock: {item.stock}</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="store" size={16} color={COLORS.gray} />
          <Text style={styles.statText}>{item.merchant?.name || 'Sin asignar'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() => handleToggleStock(item)}
        >
          <MaterialCommunityIcons
            name={item.stock === 0 ? 'package-up' : 'package-down'}
            size={18}
            color={COLORS.primary}
          />
          <Text style={[styles.actionSmallText, { color: theme.text }]}>
            {item.stock === 0 ? 'Restaurar' : 'Agotar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonInfo}
          onPress={() => handleEditBenefit(item)}
        >
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.info} />
          <Text style={[styles.actionSmallText, { color: theme.text }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonDanger}
          onPress={() => handleDeleteBenefit(item.id, item.title)}
        >
          <MaterialCommunityIcons name="trash-can" size={18} color={COLORS.error} />
          <Text style={[styles.actionSmallText, { color: theme.text }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCategoryIcon = (category) => {
    const icons = {
      'COMIDA': 'food',
      'BEBIDA': 'coffee',
      'POSTRE': 'cupcake',
      'DESCUENTO': 'tag',
      'SERVICIO': 'truck-delivery',
      'PRODUCTO': 'gift',
    };
    return icons[category] || 'gift';
  };

  if (loading) {
    return (
      <ScreenWrapper bgColor={theme.background}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando beneficios...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.background} padding={0}>
      <View style={[styles.filters, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {['ALL', 'AVAILABLE', 'OUT_OF_STOCK'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border },
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
              {status === 'ALL' ? 'Todos' : status === 'AVAILABLE' ? 'Disponibles' : 'Agotados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBenefits}
        keyExtractor={(item) => item.id}
        renderItem={renderBenefitCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="gift-off" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              {filter === 'ALL' 
                ? 'No hay beneficios creados' 
                : filter === 'AVAILABLE' 
                ? 'No hay beneficios disponibles' 
                : 'No hay beneficios agotados'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'ALL' && 'Crea el primer beneficio para los ciudadanos'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <MaterialCommunityIcons name="gift-outline" size={48} color={COLORS.primary} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Crear Nuevo Beneficio</Text>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Nombre del Beneficio *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="Ej: Café Gratis"
                    placeholderTextColor={theme.textSecondary}
                    value={newBenefit.title}
                    onChangeText={(text) => setNewBenefit({ ...newBenefit, title: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Descripción *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="Describe el beneficio..."
                    placeholderTextColor={theme.textSecondary}
                    value={newBenefit.description}
                    onChangeText={(text) => setNewBenefit({ ...newBenefit, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Costo (Puntos) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                      placeholder="100"
                      placeholderTextColor={theme.textSecondary}
                      value={newBenefit.pointsCost}
                      onChangeText={(text) => setNewBenefit({ ...newBenefit, pointsCost: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Stock Inicial *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                      placeholder="50"
                      placeholderTextColor={theme.textSecondary}
                      value={newBenefit.stock}
                      onChangeText={(text) => setNewBenefit({ ...newBenefit, stock: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Categoría *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={newBenefit.category}
                      onValueChange={(value) => setNewBenefit({ ...newBenefit, category: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Comida" value="COMIDA" />
                      <Picker.Item label="Bebida" value="BEBIDA" />
                      <Picker.Item label="Postre" value="POSTRE" />
                      <Picker.Item label="Descuento" value="DESCUENTO" />
                      <Picker.Item label="Servicio" value="SERVICIO" />
                      <Picker.Item label="Producto" value="PRODUCTO" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Comercio Asociado *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
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
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Imagen del Beneficio (Opcional)</Text>
                  
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
                      style={[styles.imagePickerButton, { backgroundColor: theme.surface, borderColor: COLORS.primary }]}
                      onPress={pickImage}
                    >
                      <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.primary} />
                      <Text style={styles.imagePickerText}>Seleccionar Foto</Text>
                      <Text style={[styles.imagePickerSubtext, { color: theme.textSecondary }]}>Galería o cámara</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.noteText, { color: COLORS.warning }]}>
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

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.deleteModalHeader}>
              <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.error} />
              <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Confirmar eliminación</Text>
            </View>
            
            <Text style={[styles.deleteModalMessage, { color: theme.text }]}>
              ¿Estás seguro de que deseas eliminar el beneficio{' '}
              <Text style={styles.deleteModalBenefitName}>"{benefitToDelete?.name}"</Text>?
            </Text>
            
            <Text style={[styles.deleteModalWarning, { color: theme.textSecondary }]}>
              Esta acción no se puede deshacer.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonCancel, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={[styles.deleteModalButtonCancelText, { color: theme.text }]}>Cancelar</Text>
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

      {/* Modal de confirmación de cambio de stock */}
      <Modal
        visible={showStockModal}
        transparent
        animationType="fade"
        onRequestClose={() => !updatingStock && setShowStockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.deleteModalHeader}>
              <MaterialCommunityIcons 
                name={benefitToToggleStock?.stock === 0 ? 'package-up' : 'package-down'} 
                size={48} 
                color={COLORS.primary} 
              />
              <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Cambiar disponibilidad</Text>
            </View>
            
            <Text style={[styles.deleteModalMessage, { color: theme.text }]}>
              ¿Deseas {benefitToToggleStock?.stock === 0 ? 'restaurar stock' : 'agotar stock'} de{' '}
              <Text style={styles.deleteModalBenefitName}>"{benefitToToggleStock?.title}"</Text>?
            </Text>
            
            <Text style={[styles.deleteModalWarning, { color: theme.textSecondary }]}>
              El stock se {benefitToToggleStock?.stock === 0 ? 'cambiará a 10 unidades' : 'reducirá a 0 unidades'}.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                onPress={() => setShowStockModal(false)}
                disabled={updatingStock}
              >
                <Text style={styles.deleteModalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalButton, styles.stockModalButtonConfirm]}
                onPress={confirmToggleStock}
                disabled={updatingStock}
              >
                {updatingStock ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons 
                      name={benefitToToggleStock?.stock === 0 ? 'package-up' : 'package-down'} 
                      size={20} 
                      color={COLORS.white} 
                    />
                    <Text style={styles.deleteModalButtonDeleteText}>Confirmar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de edición */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => !updating && setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <MaterialCommunityIcons name="pencil-outline" size={48} color={COLORS.info} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Editar Beneficio</Text>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Nombre del Beneficio *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="Ej: Café Gratis"
                    placeholderTextColor={theme.textSecondary}
                    value={editBenefit.title}
                    onChangeText={(text) => setEditBenefit({ ...editBenefit, title: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Descripción *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="Describe el beneficio..."
                    placeholderTextColor={theme.textSecondary}
                    value={editBenefit.description}
                    onChangeText={(text) => setEditBenefit({ ...editBenefit, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Costo (Puntos) *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                      placeholder="100"
                      placeholderTextColor={theme.textSecondary}
                      value={editBenefit.pointsCost}
                      onChangeText={(text) => setEditBenefit({ ...editBenefit, pointsCost: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Stock *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                      placeholder="50"
                      placeholderTextColor={theme.textSecondary}
                      value={editBenefit.stock}
                      onChangeText={(text) => setEditBenefit({ ...editBenefit, stock: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Categoría *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={editBenefit.category}
                      onValueChange={(value) => setEditBenefit({ ...editBenefit, category: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Comida" value="COMIDA" />
                      <Picker.Item label="Bebida" value="BEBIDA" />
                      <Picker.Item label="Postre" value="POSTRE" />
                      <Picker.Item label="Descuento" value="DESCUENTO" />
                      <Picker.Item label="Servicio" value="SERVICIO" />
                      <Picker.Item label="Producto" value="PRODUCTO" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Comercio Asociado *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={editBenefit.merchantId}
                      onValueChange={(value) => setEditBenefit({ ...editBenefit, merchantId: value })}
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
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Cambiar Imagen (Opcional)</Text>
                  
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
                      style={[styles.imagePickerButton, { backgroundColor: theme.surface, borderColor: COLORS.primary }]}
                      onPress={pickImage}
                    >
                      <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.primary} />
                      <Text style={styles.imagePickerText}>Seleccionar Nueva Foto</Text>
                      <Text style={[styles.imagePickerSubtext, { color: theme.textSecondary }]}>
                        {benefitToEdit?.imageUrl ? 'Dejar vacío para mantener imagen actual' : 'Galería o cámara'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.noteText, { color: COLORS.warning }]}>
                  * Campos requeridos
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButtonCancel, { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }]}
                  onPress={() => {
                    setShowEditModal(false);
                    setBenefitToEdit(null);
                    setSelectedImage(null);
                  }}
                  disabled={updating}
                >
                  <Text style={[styles.modalButtonCancelText, { color: theme.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButtonConfirm, updating && styles.buttonDisabled]}
                  onPress={handleUpdateBenefit}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalButtonConfirmText}>Guardar Cambios</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  listContent: {
    paddingBottom: SPACING.xl,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadowSmall,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
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
  benefitCard: {
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
  benefitImage: {
    width: 56,
    height: 56,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitInfo: {
    flex: 1,
  },
  benefitName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
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
    backgroundColor: COLORS.light,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
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
    color: '#FFB84D',
  },
  benefitDescription: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginBottom: SPACING.md,
    lineHeight: 20,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...LAYOUT.shadowSmall,
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
    ...LAYOUT.shadowSmall,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalButtonConfirmText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
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
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
    ...LAYOUT.shadowSmall,
  },
  deleteModalButtonCancel: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteModalButtonCancelText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  deleteModalButtonDelete: {
    backgroundColor: COLORS.error,
  },
  deleteModalButtonDeleteText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.white,
  },
  stockModalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
});
