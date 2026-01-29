/**
 * UsersManagementScreen - Gestión de usuarios
 * Permite al admin ver todos los usuarios y cambiar su estado (activar/desactivar/banear)
 * 
 * MEJORAS UX:
 * - Tabs separadas por tipo de usuario (Ciudadanos/Comercios/Admins)
 * - Búsqueda en tiempo real por nombre/email
 * - Ordenamiento flexible (nombre, fecha, puntos)
 * - Paginación infinita para escalar a miles de usuarios
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useInfiniteUsers } from '../../hooks/useUserData';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function UsersManagementScreen() {
  const queryClient = useQueryClient();
  const { authState } = React.useContext(AuthContext);
  const { theme } = useTheme();
  const currentUserRole = authState?.user?.role;
  
  const { data: userCountData } = useQuery({ 
    queryKey: ['userCount'], 
    queryFn: () => adminAPI.getUsers('USER', null, 9999, 0),
    staleTime: 1000 * 60 * 5,
  });
  const { data: merchantCountData } = useQuery({ 
    queryKey: ['merchantCount'], 
    queryFn: () => adminAPI.getUsers('MERCHANT', null, 9999, 0),
    staleTime: 1000 * 60 * 5,
  });
  const { data: adminCountData } = useQuery({ 
    queryKey: ['adminCount'], 
    queryFn: () => adminAPI.getUsers(null, null, 9999, 0),
    staleTime: 1000 * 60 * 5,
  });

  const userCount = userCountData?.data?.data?.users?.length || 0;
  const merchantCount = merchantCountData?.data?.data?.users?.length || 0;
  
  const admins = adminCountData?.data?.data?.users || [];
  // Filtrar solo los usuarios que sean realmente admins (MASTER_ADMIN o SUPPORT_ADMIN)
  const onlyAdmins = admins.filter(u => u.role === 'MASTER_ADMIN' || u.role === 'SUPPORT_ADMIN');
  const masterAdminCount = onlyAdmins.filter(u => u.role === 'MASTER_ADMIN').length;
  const supportAdminCount = onlyAdmins.filter(u => u.role === 'SUPPORT_ADMIN').length;
  const adminCount = onlyAdmins.length;

  const totalUsers = userCount + merchantCount + adminCount;

  const getCategoryCount = (role) => {
    if (role === 'USER') return userCount;
    if (role === 'MERCHANT') return merchantCount;
    if (role === 'MASTER_ADMIN') return adminCount;
    return 0;
  };
    
  // Tab activa (USER, MERCHANT, MASTER_ADMIN)
  
    const [activeTab, setActiveTab] = useState('USER');
  
  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, name, balance
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  
  // Filtro de estado (ACTIVE, INACTIVE, BANNED, null=todos)
  const [filterStatus, setFilterStatus] = useState(null);

  // Paginación infinita por rol
  const roleForQuery = activeTab === 'MASTER_ADMIN' ? null : activeTab; // null carga todos los admins
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers(roleForQuery, filterStatus, 50); // 50 usuarios por página

  // Aplanar todas las páginas
  const allUsers = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Aplicar filtros locales (búsqueda, tab de admin, ordenamiento)
  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    // 1. Filtrar por tab activa (para MASTER_ADMIN que muestra MASTER_ADMIN + SUPPORT_ADMIN)
    if (activeTab === 'MASTER_ADMIN') {
      result = result.filter(user => user.role === 'MASTER_ADMIN' || user.role === 'SUPPORT_ADMIN');
    }

    // 2. Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // 3. Aplicar ordenamiento
    result.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          compareValue = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'balance':
          compareValue = (a.wallet?.balance || 0) - (b.wallet?.balance || 0);
          break;
        default:
          compareValue = 0;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [allUsers, activeTab, searchQuery, sortBy, sortOrder]);

  // Modal de confirmación de acción
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { userId, newStatus, userName }

  // Modal de baneo con motivo
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [userToBan, setUserToBan] = useState(null);

  // Modal para crear nuevo usuario (admin o comercio)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState('SUPPORT_ADMIN'); // 'SUPPORT_ADMIN' o 'MERCHANT'
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    rut: '',
  });

  // Modal para mostrar la contraseña generada
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState({
    password: '',
    userName: '',
    userEmail: '',
    userType: '',
  });

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const onRefresh = async () => {
    await refetch();
  };

  const handleChangeStatus = (userId, currentStatus, userName) => {
    // Determinar el nuevo estado
    let newStatus;
    let actionText;
    refetch(); // Recargar con React Query
    if (currentStatus === 'ACTIVE') {
      newStatus = 'INACTIVE';
      actionText = 'desactivar';
    } else if (currentStatus === 'INACTIVE') {
      newStatus = 'ACTIVE';
      actionText = 'activar';
    } else if (currentStatus === 'BANNED' || currentStatus === 'SUSPENDED') {
      newStatus = 'ACTIVE';
      actionText = 'reactivar';
    } else {
      // Caso por defecto - activar usuario
      newStatus = 'ACTIVE';
      actionText = 'activar';
    }

    setPendingAction({ userId, newStatus, userName, actionText });
    setShowConfirmModal(true);
  };

  const handleBanUser = (userId, userName, userEmail) => {
    setUserToBan({ id: userId, name: userName, email: userEmail });
    setBanReason('');
    setShowBanModal(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    setShowConfirmModal(false);

    try {
      await adminAPI.updateUserStatus(pendingAction.userId, pendingAction.newStatus, 'Cambio manual desde panel de administración');
      Alert.alert('Éxito', `Usuario ${pendingAction.actionText}do correctamente`);
      await loadUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.data?.message || error.response?.data?.message || 'Error al cambiar estado';
      Alert.alert('Error', errorMsg);
    }

    setPendingAction(null);
  };

  const confirmBan = async () => {
    if (!banReason.trim()) {
      Alert.alert('Motivo Requerido', 'Debes especificar un motivo para el baneo');
      return;
    }

    if (!userToBan || !userToBan.id) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    setShowBanModal(false);

    try {
      await adminAPI.updateUserStatus(userToBan.id, 'SUSPENDED', banReason.trim());
      Alert.alert('Éxito', 'Usuario baneado correctamente');
      await loadUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.data?.message || error.response?.data?.message || 'Error al banear usuario';
      Alert.alert('Error', errorMsg);
    }

    setBanReason('');
    setUserToBan(null);
  };

  const cancelAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const handleOpenAddModal = () => {
    // Determinar qué tipo de usuario crear según la tab activa
    if (activeTab === 'MASTER_ADMIN') {
      setAddModalType('SUPPORT_ADMIN');
    } else if (activeTab === 'MERCHANT') {
      setAddModalType('MERCHANT');
    }
    setShowAddModal(true);
  };

  const handleCreateUser = async () => {
    // Validación básica
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserForm.email)) {
      Alert.alert('Error', 'Email inválido');
      return;
    }

    // Validar si el email ya existe
    const emailExists = allUsers.some(user => user.email.toLowerCase() === newUserForm.email.toLowerCase());
    if (emailExists) {
      Alert.alert('Error', 'Este email ya está registrado');
      return;
    }

    try {
      let response;
      if (addModalType === 'SUPPORT_ADMIN') {
        response = await adminAPI.createSupportAdmin({
          name: newUserForm.name,
          email: newUserForm.email,
        });
        const password = response.data?.data?.temporaryPassword || 'N/A';
        
        // Mostrar modal con la contraseña generada
        setGeneratedPassword({
          password: password,
          userName: newUserForm.name,
          userEmail: newUserForm.email,
          userType: 'Administrador de Soporte',
        });
        setShowPasswordModal(true);
      } else if (addModalType === 'MERCHANT') {
        response = await adminAPI.createMerchant({
          name: newUserForm.name,
          email: newUserForm.email,
          address: newUserForm.address,
          phone: newUserForm.phone,
          rut: newUserForm.rut,
        });
        const password = response.data?.data?.temporaryPassword || 'N/A';
        
        // Mostrar modal con la contraseña generada
        setGeneratedPassword({
          password: password,
          userName: newUserForm.name,
          userEmail: newUserForm.email,
          userType: 'Comercio',
        });
        setShowPasswordModal(true);
      }

      setShowAddModal(false);
      setNewUserForm({ name: '', email: '', password: '', address: '', phone: '', rut: '' });
      await refetch(); // Recargar con React Query
      queryClient.invalidateQueries(['userCount']);
      queryClient.invalidateQueries(['merchantCount']);
      queryClient.invalidateQueries(['adminCount']);
    } catch (error) {
      const errorMsg = error.response?.data?.data?.message || error.response?.data?.message || 'Error al crear usuario';
      Alert.alert('Error', errorMsg);
    }
  };

  const cancelAddUser = () => {
    setShowAddModal(false);
    setNewUserForm({ name: '', email: '', password: '', address: '', phone: '', rut: '' });
  };

  const getAvailableTabs = () => {
    // SUPPORT_ADMIN no puede ver administradores
    if (currentUserRole === 'SUPPORT_ADMIN') {
      return ['USER', 'MERCHANT'];
    }
    // MASTER_ADMIN ve todo
    return ['USER', 'MERCHANT', 'MASTER_ADMIN'];
  };

  const canAddUser = () => {
    // Solo puede agregar si está en tab de Comercios o Administradores
    if (activeTab === 'MERCHANT') return true;
    if (activeTab === 'MASTER_ADMIN' && currentUserRole === 'MASTER_ADMIN') return true;
    return false;
  };

  const getRoleLabel = (role) => {
    const labels = {
      USER: 'Usuario',
      MERCHANT: 'Comercio',
      MASTER_ADMIN: 'Admin',
      SUPPORT_ADMIN: 'Soporte',
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role) => {
    if (role === 'MERCHANT') return 'store';
    if (role === 'MASTER_ADMIN' || role === 'SUPPORT_ADMIN') return 'shield-crown';
    return 'account';
  };

  const getRoleColor = (role) => {
    if (role === 'MERCHANT') return '#FF6B35';
    if (role === 'MASTER_ADMIN') return '#9C27B0';
    if (role === 'SUPPORT_ADMIN') return '#3F51B5';
    return COLORS.primary;
  };

  const getTabLabel = (role) => {
    const labels = {
      USER: 'Ciudadanos',
      MERCHANT: 'Comercios',
      MASTER_ADMIN: 'Administradores',
    };
    return labels[role] || role;
  };

  const getTabCount = (role) => {
    if (role === 'MASTER_ADMIN') {
        return allUsers.filter(u => u.role === 'MASTER_ADMIN' || u.role === 'SUPPORT_ADMIN').length;
    }
    return allUsers.filter(u => u.role === role).length;
  };

  const getStatusColor = (status) => {
    if (status === 'ACTIVE') return COLORS.success;
    if (status === 'INACTIVE') return COLORS.warning;
    if (status === 'BANNED') return COLORS.error;
    return COLORS.gray;
  };

  const getStatusLabel = (status) => {
    const labels = {
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
      BANNED: 'Baneado',
    };
    return labels[status] || status;
  };

  const renderUserCard = ({ item }) => (
    <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.userHeader}>
        <View style={[styles.avatar, { backgroundColor: `${getRoleColor(item.role)}20` }]}>
          <MaterialCommunityIcons
            name={getRoleIcon(item.role)}
            size={24}
            color={getRoleColor(item.role)}
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{item.email}</Text>
          {item.role === 'MERCHANT' && item.merchantProfile?.address && (
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={theme.textSecondary} />
              <Text style={[styles.addressText, { color: theme.textSecondary }]} numberOfLines={1}>{item.merchantProfile.address}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            {item.role === 'USER' && (
              <View style={styles.pointsContainer}>
                <MaterialCommunityIcons name="star-circle" size={16} color={COLORS.primary} />
                <Text style={[styles.pointsText, { color: theme.text }]}>{item.wallet?.balance || 0} pts</Text>
              </View>
            )}
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      {/* Estadísticas según rol */}
      <View style={styles.statsRow}>
        {item.role === 'USER' && (
          <>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>{item._count?.missionCompletions || 0} aprobadas</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.warning} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>{item._count?.missionSubmissions || 0} solicitudes</Text>
            </View>
          </>
        )}
        
        {item.role === 'MERCHANT' && (
          <>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="gift" size={16} color={COLORS.primary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>Beneficios del comercio</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="swap-horizontal" size={16} color={COLORS.gray} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>Canjes realizados</Text>
            </View>
          </>
        )}
        
        {(item.role === 'MASTER_ADMIN' || item.role === 'SUPPORT_ADMIN') && (
          <>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.gray} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {item.lastLoginAt 
                  ? `Último acceso: ${new Date(item.lastLoginAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
                  : 'Nunca ha ingresado'
                }
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.primary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>{getRoleLabel(item.role)}</Text>
            </View>
          </>
        )}
      </View>

      {item.role !== 'MASTER_ADMIN' && (
        <View style={styles.actions}>
          {item.status !== 'BANNED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => handleChangeStatus(item.id, item.status, item.name)}
            >
              <MaterialCommunityIcons
                name={item.status === 'ACTIVE' ? 'pause-circle' : 'play-circle'}
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.primaryActionText}>
                {item.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
              </Text>
            </TouchableOpacity>
          )}
          
          {item.status === 'SUSPENDED' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.successActionButton]}
              onPress={() => handleChangeStatus(item.id, item.status, item.name)}
            >
              <MaterialCommunityIcons name="account-check" size={18} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Desbanear</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerActionButton]}
              onPress={() => handleBanUser(item.id, item.name, item.email)}
            >
              <MaterialCommunityIcons name="gavel" size={18} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Banear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (isLoading && !allUsers.length) {
    return (
      <ScreenWrapper bgColor={theme.background} safeArea={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando usuarios...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bgColor={theme.background} safeArea={false} padding={0}>
      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {getAvailableTabs().map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterButton,
              { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border },
              activeTab === role && styles.filterButtonActive,
            ]}
            onPress={() => setActiveTab(role)}
          >
            <Text style={[styles.filterButtonText, { color: theme.textSecondary }, activeTab === role && styles.filterButtonTextActive]}>
              {getTabLabel(role)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.userCountContainer}>
        <Text style={[styles.userCountText, { color: theme.textSecondary }]}>
            {`${getCategoryCount(activeTab)} de ${totalUsers || 0} usuarios`}
        </Text>
        {activeTab === 'MASTER_ADMIN' && (
            <View style={styles.adminCountBreakdown}>
                <Text style={styles.breakdownText}>Master: {masterAdminCount}</Text>
                <Text style={styles.breakdownText}>Soporte: {supportAdminCount}</Text>
            </View>
        )}
      </View>

      {/* Barra de Búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Controles de Ordenamiento y Filtros */}
      <View style={[styles.controlsRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {/* Ordenamiento */}
        <View style={styles.sortContainer}>
          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>Ordenar:</Text>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
            onPress={() => {
              // Opciones según el rol activo
              const options = activeTab === 'USER' 
                ? ['createdAt', 'name', 'balance'] 
                : ['createdAt', 'name'];
              const currentIndex = options.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % options.length;
              setSortBy(options[nextIndex]);
            }}
          >
            <MaterialCommunityIcons
              name={sortBy === 'name' ? 'sort-alphabetical-ascending' : sortBy === 'balance' ? 'star-circle' : 'calendar'}
              size={16}
              color={COLORS.primary}
            />
            <Text style={[styles.sortButtonText, { color: theme.text }]}>
              {sortBy === 'name' ? 'Nombre' : sortBy === 'balance' ? 'Puntos' : 'Fecha'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOrderButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <MaterialCommunityIcons
              name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Filtro de Estado */}
        <View style={styles.statusFilterContainer}>
          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>Estado:</Text>
          <TouchableOpacity
            style={[styles.miniFilterButton, { backgroundColor: theme.inputBg, borderColor: theme.border }, !filterStatus && styles.miniFilterButtonActive]}
            onPress={() => setFilterStatus(null)}
          >
            <Text style={[styles.miniFilterText, { color: theme.textSecondary }, !filterStatus && styles.miniFilterTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniFilterButton, { backgroundColor: theme.inputBg, borderColor: theme.border }, filterStatus === 'ACTIVE' && styles.miniFilterButtonActive]}
            onPress={() => setFilterStatus('ACTIVE')}
          >
            <Text style={[styles.miniFilterText, { color: theme.textSecondary }, filterStatus === 'ACTIVE' && styles.miniFilterTextActive]}>Activos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniFilterButton, { backgroundColor: theme.inputBg, borderColor: theme.border }, filterStatus === 'SUSPENDED' && styles.miniFilterButtonActive]}
            onPress={() => setFilterStatus('SUSPENDED')}
          >
            <Text style={[styles.miniFilterText, { color: theme.textSecondary }, filterStatus === 'SUSPENDED' && styles.miniFilterTextActive]}>Baneados</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Usuarios */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        refreshControl={<RefreshControl refreshing={isLoading && !isFetchingNextPage} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        windowSize={10}
        maxToRenderPerBatch={10}
        ListFooterComponent={() => {
          if (isFetchingNextPage) {
            return (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingFooterText}>Cargando más usuarios...</Text>
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptyText}>Cargando usuarios...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-off" size={64} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios en esta categoría'}
              </Text>
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Botón Flotante (FAB) para agregar usuarios */}
      {canAddUser() && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenAddModal}>
          <MaterialCommunityIcons
            name={activeTab === 'MERCHANT' ? 'store-plus' : 'shield-plus'}
            size={28}
            color={COLORS.white}
          />
        </TouchableOpacity>
      )}

      {/* Modal para agregar usuario (admin o comercio) */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={cancelAddUser}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ScrollView 
              style={{ width: '100%' }}
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
            <MaterialCommunityIcons
              name={addModalType === 'MERCHANT' ? 'store-plus' : 'shield-plus'}
              size={48}
              color={COLORS.primary}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {addModalType === 'MERCHANT' ? 'Crear Cuenta de Comercio' : 'Crear Administrador de Soporte'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {addModalType === 'MERCHANT'
                ? 'El comercio podrá validar cupones.'
                : 'Los administradores de soporte pueden aprobar misiones y gestionar usuarios, pero no pueden crear otros administradores.'}
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {addModalType === 'MERCHANT' ? 'Nombre del comercio' : 'Nombre completo'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder={addModalType === 'MERCHANT' ? 'Ej: Restaurante El Buen Sabor' : 'Ej: Juan Pérez'}
                  placeholderTextColor={theme.textSecondary}
                  value={newUserForm.name}
                  onChangeText={(text) => setNewUserForm({ ...newUserForm, name: text })}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder={addModalType === 'MERCHANT' ? 'comercio@ejemplo.com' : 'admin@ejemplo.com'}
                  placeholderTextColor={theme.textSecondary}
                  value={newUserForm.email}
                  onChangeText={(text) => setNewUserForm({ ...newUserForm, email: text })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {addModalType === 'MERCHANT' && (
                <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Link de Google Maps / Dirección</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="Ej: https://maps.app.goo.gl/..."
                    placeholderTextColor={theme.textSecondary}
                    value={newUserForm.address}
                    onChangeText={(text) => setNewUserForm({ ...newUserForm, address: text })}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Teléfono</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="+569 1234 5678"
                    placeholderTextColor={theme.textSecondary}
                    value={newUserForm.phone}
                    onChangeText={(text) => setNewUserForm({ ...newUserForm, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>RUT</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="12.345.678-9"
                    placeholderTextColor={theme.textSecondary}
                    value={newUserForm.rut}
                    onChangeText={(text) => setNewUserForm({ ...newUserForm, rut: text })}
                    autoCapitalize="none"
                  />
                </View>
                </>
              )}

              <Text style={[styles.passwordNote, { color: theme.textSecondary }]}>
                Nota: Se generará una contraseña temporal automáticamente que deberá cambiarse en el primer inicio de sesión.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButtonCancel, { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }]} onPress={cancelAddUser}>
                <Text style={[styles.modalButtonCancelText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleCreateUser}>
                <Text style={styles.modalButtonConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de acción */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={cancelAction}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color={pendingAction?.newStatus === 'BANNED' ? COLORS.error : COLORS.warning}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Confirmar acción</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              ¿Estás seguro de que quieres {pendingAction?.actionText} a {pendingAction?.userName}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButtonCancel, { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }]} onPress={cancelAction}>
                <Text style={[styles.modalButtonCancelText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={confirmAction}>
                <Text style={styles.modalButtonConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para mostrar contraseña generada */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.passwordModalContent, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons
              name="key-variant"
              size={64}
              color={COLORS.success}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>¡Cuenta Creada Exitosamente!</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {generatedPassword.userType} creado correctamente
            </Text>

            <View style={[styles.passwordInfoContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <View style={styles.passwordInfoRow}>
                <MaterialCommunityIcons name="account" size={20} color={COLORS.gray} />
                <Text style={[styles.passwordInfoLabel, { color: theme.textSecondary }]}>Nombre:</Text>
                <Text style={[styles.passwordInfoValue, { color: theme.text }]}>{generatedPassword.userName}</Text>
              </View>
              
              <View style={styles.passwordInfoRow}>
                <MaterialCommunityIcons name="email" size={20} color={COLORS.gray} />
                <Text style={[styles.passwordInfoLabel, { color: theme.textSecondary }]}>Email:</Text>
                <Text style={[styles.passwordInfoValue, { color: theme.text }]}>{generatedPassword.userEmail}</Text>
              </View>

              <View style={[styles.passwordDivider, { backgroundColor: theme.border }]} />

              <View style={styles.passwordSection}>
                <View style={styles.passwordHeader}>
                  <MaterialCommunityIcons name="lock-alert" size={24} color={COLORS.warning} />
                  <Text style={[styles.passwordSectionTitle, { color: theme.text }]}>Contraseña Temporal</Text>
                </View>
                <View style={[styles.passwordBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[styles.passwordText, { color: COLORS.primary }]} selectable>
                    {generatedPassword.password}
                  </Text>
                </View>
                <Text style={[styles.passwordWarning, { color: COLORS.warning }]}>
                  Importante: Esta contraseña debe ser cambiada en el primer inicio de sesión
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.passwordModalButton} 
              onPress={() => {
                setShowPasswordModal(false);
                setGeneratedPassword({ password: '', userName: '', userEmail: '', userType: '' });
              }}
            >
              <Text style={styles.passwordModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Baneo con Input de Motivo */}
      <Modal
        visible={showBanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.banModalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.banModalHeader}>
              <MaterialCommunityIcons name="alert-octagon" size={48} color={COLORS.error} />
              <Text style={[styles.banModalTitle, { color: theme.text }]}>
                Confirmar Baneo
              </Text>
            </View>

            {userToBan && (
              <View style={styles.banModalBody}>
                <Text style={[styles.banModalText, { color: theme.text }]}>
                  ¿Estás seguro de banear a este usuario?
                </Text>
                <View style={[styles.userInfoBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={[styles.userInfoLabel, { color: theme.textSecondary }]}>Nombre:</Text>
                  <Text style={[styles.userInfoValue, { color: theme.text }]}>{userToBan.name}</Text>
                  <Text style={[styles.userInfoLabel, { color: theme.textSecondary }]}>Email:</Text>
                  <Text style={[styles.userInfoValue, { color: theme.text }]}>{userToBan.email}</Text>
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Motivo del baneo *
                </Text>
                <TextInput
                  style={[styles.reasonInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                  placeholder="Ej: Violación de términos y condiciones..."
                  placeholderTextColor={theme.textSecondary}
                  value={banReason}
                  onChangeText={setBanReason}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
                <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                  {banReason.length}/500 caracteres
                </Text>

                <View style={styles.banModalButtons}>
                  <TouchableOpacity
                    style={[styles.banModalButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => {
                      setShowBanModal(false);
                      setBanReason('');
                      setUserToBan(null);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.banModalButton, styles.confirmBanButton]}
                    onPress={confirmBan}
                  >
                    <MaterialCommunityIcons name="gavel" size={18} color={COLORS.white} />
                    <Text style={styles.confirmBanButtonText}>Banear Ahora</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  // Header reorganizado
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    gap: SPACING.lg,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
  },
  // Filters (replaces Tabs)
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadowSmall,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...LAYOUT.shadowSmall,
  },
  filterButtonText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  userCountContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  userCountText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.gray,
  },
  adminCountBreakdown: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  breakdownText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  // Botón Flotante (FAB)
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
    ...LAYOUT.shadowLarge,
    elevation: 8,
    zIndex: 100,
  },
  // Búsqueda
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadowSmall,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.dark,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  // Controles
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  controlLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
    gap: SPACING.xs,
  },
  sortButtonText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sortOrderButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  miniFilterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: COLORS.light,
    marginRight: SPACING.xs,
  },
  miniFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  miniFilterText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
  },
  miniFilterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadowSmall,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  addressText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dateText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  statItem: {
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
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    gap: SPACING.xs,
  },
  primaryActionButton: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryActionText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  successActionButton: {
    backgroundColor: COLORS.success,
  },
  dangerActionButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  loadingFooterText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  clearSearchButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
  },
  clearSearchText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: '600',
  },
  // Modal de crear admin
  formContainer: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
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
  passwordNote: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    lineHeight: 18,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.sm,
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
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalText: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
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
  modalButtonConfirmText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Estilos para el modal de contraseña
  passwordModalContent: {
    maxWidth: 500,
  },
  passwordInfoContainer: {
    width: '100%',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  passwordInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  passwordInfoLabel: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  passwordInfoValue: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.dark,
    flex: 1,
  },
  passwordDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  passwordSection: {
    width: '100%',
    backgroundColor: COLORS.light,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  passwordSectionTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  passwordBox: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 2,
    borderColor: COLORS.success,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  passwordText: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  passwordWarning: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.warning,
    textAlign: 'center',
    fontWeight: '600',
  },
  passwordModalButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  passwordModalButtonText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Ban Modal Styles
  banModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    maxWidth: 500,
    width: '90%',
  },
  banModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  banModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  banModalBody: {
    width: '100%',
  },
  banModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  userInfoBox: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  userInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  userInfoValue: {
    fontSize: 14,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  banModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  banModalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBanButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    gap: 8,
  },
  confirmBanButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
