/**
 * AdminNavigator
 * Layout adaptativo: WebLayout (Sidebar) en web, Bottom Tabs en mobile
 * Pestañas: Dashboard, Misiones, Beneficios, Aprobaciones, Usuarios, Auditoría, Configuración
 */

import React, { useContext, useState, useRef, useEffect, createContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen';
import BenefitsManagementScreen from '../screens/admin/BenefitsManagementScreen';
import SubmissionsApprovalScreen from '../screens/admin/SubmissionsApprovalScreen';
import SubmissionDetailScreen from '../screens/admin/SubmissionDetailScreen';
import MissionsManagementScreen from '../screens/admin/MissionsManagementScreen';
import MissionFormScreen from '../screens/admin/MissionFormScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminAuditScreen from '../screens/admin/AdminAuditScreen';
import { COLORS, TAB_CONFIG, SPACING, LAYOUT, TYPOGRAPHY } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const isWeb = Platform.OS === 'web';

// Constantes para el sidebar
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const HEADER_HEIGHT = 64;

// Configuración común de header para Admin (Mobile)
const ADMIN_HEADER_CONFIG = {
  headerShown: true,
  headerStyle: {
    backgroundColor: COLORS.admin,
    height: 56, // Altura fija para todos los headers
  },
  headerTintColor: COLORS.white,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17, // Tamaño estándar de iOS
  },
};

// ============================================
// WEB SIDEBAR COMPONENT
// ============================================
function WebSidebar({ isCollapsed, setIsCollapsed, isMasterAdmin, onLogout, onNavigate, activeRoute }) {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const sidebarWidth = useRef(new Animated.Value(isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)).current;
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Usar la ruta activa pasada como prop
  const activeRouteName = activeRoute || 'AdminDashboard';

  useEffect(() => {
    Animated.timing(sidebarWidth, {
      toValue: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isCollapsed]);

  const handleLogoutConfirm = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { id: 'AdminDashboard', label: 'Panel', icon: 'view-dashboard' },
    { id: 'Missions', label: 'Misiones', icon: 'target' },
    { id: 'Benefits', label: 'Beneficios', icon: 'gift' },
    { id: 'Approvals', label: 'Solicitudes', icon: 'check-circle' },
    { id: 'Users', label: 'Usuarios', icon: 'account-multiple' },
    ...(isMasterAdmin ? [{ id: 'Audit', label: 'Auditoría', icon: 'shield-lock' }] : []),
    { id: 'Settings', label: 'Configuración', icon: 'cog' },
  ];

  const handleNavigate = (tabId) => {
    if (onNavigate) {
      onNavigate(tabId);
    }
  };

  return (
    <Animated.View style={[styles.webSidebar, { width: sidebarWidth, backgroundColor: theme.sidebarBg, borderRightColor: theme.border }]}>
      {/* Logo y Toggle */}
      <View style={styles.logoContainer}>
        <View style={styles.logoContent}>
          <MaterialCommunityIcons name="shield-star" size={28} color={COLORS.white} />
          {!isCollapsed && (
            <View>
              <Text style={styles.logoMain}>Puntos</Text>
              <Text style={styles.logoSub}>Ciudadanos</Text>
              <Text style={styles.logoAdmin}>Panel Admin</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          <MaterialCommunityIcons 
            name={isCollapsed ? 'chevron-right' : 'chevron-left'} 
            size={20} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.sidebarNav}>
        {menuItems.map((item) => {
          const isActive = activeRouteName === item.id;

          return (
            <View key={item.id} style={styles.menuItemWrapper}>
              <TouchableOpacity
                style={[
                  styles.sidebarItem,
                  isActive && styles.sidebarItemActive,
                ]}
                onPress={() => handleNavigate(item.id)}
                activeOpacity={0.7}
                onMouseEnter={() => {
                  setHoveredItem(item.id);
                  if (isCollapsed) setShowTooltip(item.id);
                }}
                onMouseLeave={() => {
                  setHoveredItem(null);
                  setShowTooltip(null);
                }}
              >
                <MaterialCommunityIcons 
                  name={item.icon} 
                  size={20} 
                  color={isActive ? COLORS.admin : COLORS.white} 
                />
                {!isCollapsed && (
                  <Text style={[
                    styles.sidebarLabel,
                    isActive && styles.sidebarLabelActive,
                  ]}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
              
              {/* Tooltip para modo colapsado */}
              {isCollapsed && showTooltip === item.id && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{item.label}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Footer con Theme Toggle y Logout */}
      <View style={styles.sidebarFooter}>
        {/* Control de Tema */}
        {!isCollapsed && (
          <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
            <MaterialCommunityIcons 
              name={isDarkMode ? 'weather-sunny' : 'weather-night'} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.themeToggleText}>
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: COLORS.admin }}
              thumbColor={isDarkMode ? COLORS.success : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </TouchableOpacity>
        )}
        
        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.7}
          onMouseEnter={() => {
            setHoveredItem('logout');
            if (isCollapsed) setShowTooltip('logout');
          }}
          onMouseLeave={() => {
            setHoveredItem(null);
            setShowTooltip(null);
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.white} />
          {!isCollapsed && <Text style={styles.logoutText}>Cerrar Sesión</Text>}
        </TouchableOpacity>
        
        {isCollapsed && showTooltip === 'logout' && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Cerrar Sesión</Text>
          </View>
        )}
      </View>

      {/* Modal de confirmación de logout */}
      <Modal
        transparent
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlayLogout}>
          <View style={[styles.logoutModalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="logout" size={56} color={COLORS.error} />
            </View>
            <Text style={[styles.logoutModalTitle, { color: theme.text }]}>Cerrar Sesión</Text>
            <Text style={[styles.logoutModalMessage, { color: theme.textSecondary }]}>¿Estás seguro que deseas salir de tu cuenta?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm]} 
                onPress={() => {
                  setShowLogoutModal(false);
                  handleLogoutConfirm();
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ============================================
// WEB HEADER COMPONENT (Admin específico)
// ============================================
function AdminWebHeader({ title, userName, userEmail, userRole }) {
  const { theme } = useTheme();
  
  const getRoleBadge = () => {
    if (userRole === 'MASTER_ADMIN') {
      return { label: 'Master Admin', color: '#9C27B0' };
    }
    return { label: 'Administrador', color: COLORS.admin };
  };

  const roleBadge = getRoleBadge();

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={[styles.webHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.headerLeft}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={[styles.roleBadge, { backgroundColor: `${roleBadge.color}15` }]}>
          <MaterialCommunityIcons name="shield-account" size={16} color={roleBadge.color} />
          <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
        </View>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{userName || 'Admin'}</Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{userEmail || ''}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================
// WEB LAYOUT COMPONENT
// ============================================
function WebLayout() {
  const { logout, authState } = useContext(AuthContext);
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeRoute, setActiveRoute] = useState('AdminDashboard');
  const navigationRef = useRef(null);
  
  // Modal para SubmissionDetail en web
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Modal para MissionForm en web
  const [showMissionFormModal, setShowMissionFormModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  const isMasterAdmin = authState?.user?.role === 'MASTER_ADMIN';
  const userName = authState?.user?.name || 'Administrador';
  const userEmail = authState?.user?.email || '';
  const userRole = authState?.user?.role || 'ADMIN';

  // Handler para navegación desde el sidebar
  const handleSidebarNavigate = (routeName) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(routeName);
    }
  };

  // Handler para cambios de estado de navegación
  const handleNavigationStateChange = (state) => {
    if (state) {
      const currentRoute = state.routes[state.index];
      setActiveRoute(currentRoute?.name || 'AdminDashboard');
    }
  };

  const handleLogout = () => {
    logout().then(() => {
      console.log('Logout exitoso');
    }).catch((err) => {
      console.error('Error en logout:', err);
    });
  };

  // Navegación mock para pasar a las pantallas (manejo de modales)
  const createMockNavigation = (navigation) => ({
    navigate: (screen, params) => {
      if (screen === 'SubmissionDetail') {
        setSelectedSubmission(params?.submission);
        setShowDetailModal(true);
      } else if (screen === 'MissionForm') {
        setSelectedMission(params?.mission || null);
        setShowMissionFormModal(true);
      } else {
        navigation.navigate(screen, params);
      }
    },
    goBack: () => {
      if (showMissionFormModal) {
        setShowMissionFormModal(false);
        setSelectedMission(null);
      } else if (showDetailModal) {
        setShowDetailModal(false);
        setSelectedSubmission(null);
      }
    },
  });

  const getScreenTitle = (routeName) => {
    const titles = {
      AdminDashboard: 'Panel de Control',
      Missions: 'Gestión de Misiones',
      Benefits: 'Gestión de Beneficios',
      Approvals: 'Solicitudes Pendientes',
      Users: 'Gestión de Usuarios',
      Audit: 'Auditoría del Sistema',
      Settings: 'Configuración',
    };
    return titles[routeName] || 'Admin';
  };

  return (
    <>
      <View style={[styles.webLayoutContainer, { backgroundColor: theme.background }]}>
        <WebSidebar 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMasterAdmin={isMasterAdmin}
          onLogout={handleLogout}
          onNavigate={handleSidebarNavigate}
          activeRoute={activeRoute}
        />
        <View style={styles.mainContent}>
          <Tab.Navigator
            screenListeners={{
              state: (e) => {
                const state = e.data.state;
                if (state) {
                  const currentRoute = state.routes[state.index];
                  setActiveRoute(currentRoute?.name || 'AdminDashboard');
                }
              },
            }}
            screenOptions={({ navigation: tabNavigation }) => {
              // Guardar referencia a la navegación del tab
              if (!navigationRef.current) {
                navigationRef.current = tabNavigation;
              }
              return {
                headerShown: true,
                header: ({ route }) => (
                  <AdminWebHeader 
                    title={getScreenTitle(route.name)} 
                    userName={userName}
                    userEmail={userEmail}
                    userRole={userRole}
                  />
                ),
                tabBarStyle: { display: 'none' },
              };
            }}
          >
            <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Panel - Admin' }} />
            <Tab.Screen name="Missions" options={{ title: 'Misiones - Admin' }}>
              {(props) => <MissionsManagementScreen {...props} navigation={createMockNavigation(props.navigation)} />}
            </Tab.Screen>
            <Tab.Screen name="Benefits" component={BenefitsManagementScreen} options={{ title: 'Beneficios - Admin' }} />
            <Tab.Screen name="Approvals" options={{ title: 'Solicitudes - Admin' }}>
              {(props) => <SubmissionsApprovalScreen {...props} navigation={createMockNavigation(props.navigation)} />}
            </Tab.Screen>
            <Tab.Screen name="Users" component={UsersManagementScreen} options={{ title: 'Usuarios - Admin' }} />
            {isMasterAdmin && (
              <Tab.Screen name="Audit" component={AdminAuditScreen} options={{ title: 'Auditoría - Admin' }} />
            )}
            <Tab.Screen name="Settings" component={AdminSettingsScreen} options={{ title: 'Configuración - Admin' }} />
          </Tab.Navigator>
        </View>
      </View>

      {/* Modal para Detalle de Envío */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setShowDetailModal(false)}
          />
          <View style={styles.modalContainer}>
            {selectedSubmission && (
              <SubmissionDetailScreen
                route={{ params: { submission: selectedSubmission } }}
                navigation={{
                  goBack: () => {
                    setShowDetailModal(false);
                    setSelectedSubmission(null);
                  }
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para Formulario de Misión */}
      <Modal
        visible={showMissionFormModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowMissionFormModal(false);
          setSelectedMission(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => {
              setShowMissionFormModal(false);
              setSelectedMission(null);
            }}
          />
          <View style={styles.modalContainer}>
            <MissionFormScreen
              route={{ params: { mission: selectedMission } }}
              navigation={{
                goBack: () => {
                  setShowMissionFormModal(false);
                  setSelectedMission(null);
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ============================================
// MOBILE LAYOUT (Bottom Tabs)
// ============================================
function MobileLayout() {
  const insets = useSafeAreaInsets();
  const { logout, authState } = useContext(AuthContext);

  const handleLogout = () => {
    logout().then(() => {
      console.log('Logout exitoso');
    }).catch((err) => {
      console.error('Error en logout:', err);
    });
  };

  // Stack para Misiones con gestión
  function MissionsStack() {
    return (
      <Stack.Navigator
        initialRouteName="MissionsMain"
        screenOptions={ADMIN_HEADER_CONFIG}
      >
        <Stack.Screen
          name="MissionsMain"
          component={MissionsManagementScreen}
          options={{ title: 'Gestión de Misiones' }}
        />
        <Stack.Screen
          name="MissionForm"
          component={MissionFormScreen}
          options={{ title: 'Nueva Misión', presentation: 'card' }}
        />
      </Stack.Navigator>
    );
  }

  // Stack para Aprobaciones
  function ApprovalsStack() {
    return (
      <Stack.Navigator
        screenOptions={ADMIN_HEADER_CONFIG}
      >
        <Stack.Screen
          name="ApprovalsMain"
          component={SubmissionsApprovalScreen}
          options={{ title: 'Solicitudes Pendientes' }}
        />
        <Stack.Group screenOptions={{ 
          presentation: 'transparentModal', 
          headerShown: false, 
          animationEnabled: true 
        }}>
          <Stack.Screen
            name="SubmissionDetail"
            component={SubmissionDetailScreen}
            options={{ 
              cardOverlayEnabled: true,
              cardStyle: { backgroundColor: 'transparent' }
            }}
          />
        </Stack.Group>
      </Stack.Navigator>
    );
  }

  // Stack para Configuración
  function SettingsStack() {
    return (
      <Stack.Navigator
        screenOptions={ADMIN_HEADER_CONFIG}
      >
        <Stack.Screen
          name="SettingsMain"
          component={AdminSettingsScreen}
          options={{ title: 'Configuración del Sistema' }}
        />
      </Stack.Navigator>
    );
  }

  // Stack para Dashboard
  function DashboardStack() {
    return (
      <Stack.Navigator screenOptions={ADMIN_HEADER_CONFIG}>
        <Stack.Screen
          name="DashboardMain"
          component={AdminDashboardScreen}
          options={{ title: 'Panel de Control' }}
        />
      </Stack.Navigator>
    );
  }

  // Stack para Benefits
  function BenefitsStack() {
    return (
      <Stack.Navigator screenOptions={ADMIN_HEADER_CONFIG}>
        <Stack.Screen
          name="BenefitsMain"
          component={BenefitsManagementScreen}
          options={{ title: 'Gestión de Beneficios' }}
        />
      </Stack.Navigator>
    );
  }

  // Stack para Users
  function UsersStack() {
    return (
      <Stack.Navigator screenOptions={ADMIN_HEADER_CONFIG}>
        <Stack.Screen
          name="UsersMain"
          component={UsersManagementScreen}
          options={{ title: 'Gestión de Usuarios' }}
        />
      </Stack.Navigator>
    );
  }

  // Stack para Audit
  function AuditStack() {
    return (
      <Stack.Navigator screenOptions={ADMIN_HEADER_CONFIG}>
        <Stack.Screen
          name="AuditMain"
          component={AdminAuditScreen}
          options={{ title: 'Auditoría del Sistema' }}
        />
      </Stack.Navigator>
    );
  }

  const isMasterAdmin = authState?.user?.role === 'MASTER_ADMIN';
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tabConfig = TAB_CONFIG.adminTabs.find((t) => t.name === route.name);

        return {
          headerShown: false, // Desactivar headers del Tab, cada Stack maneja el suyo
          tabBarIcon: ({ focused }) => {
            const iconMap = {
              AdminDashboard: 'view-dashboard',
              Users: 'account-multiple',
              Benefits: 'gift',
              Missions: 'target',
              Approvals: 'check-circle',
              Audit: 'shield-lock',
              Settings: 'cog',
            };
            return (
              <MaterialCommunityIcons
                name={iconMap[route.name]}
                size={24}
                color={focused ? tabConfig?.color : COLORS.gray}
              />
            );
          },
          tabBarLabel: tabConfig?.label,
          tabBarActiveTintColor: tabConfig?.color,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: { 
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom, 
            height: 60 + insets.bottom 
          },
        };
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={DashboardStack}
        options={{ headerShown: false, title: 'Panel' }}
      />
      <Tab.Screen
        name="Missions"
        component={MissionsStack}
        options={{ headerShown: false, title: 'Misiones' }}
      />
      <Tab.Screen
        name="Benefits"
        component={BenefitsStack}
        options={{ headerShown: false, title: 'Beneficios' }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsStack}
        options={{ headerShown: false, title: 'Solicitudes' }}
      />
      <Tab.Screen
        name="Users"
        component={UsersStack}
        options={{ headerShown: false, title: 'Usuarios' }}
      />
      {isMasterAdmin && (
        <Tab.Screen
          name="Audit"
          component={AuditStack}
          options={{ headerShown: false, title: 'Auditoría' }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{ headerShown: false, title: 'Configuración' }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// MAIN EXPORT
// ============================================
export default function AdminNavigator() {
  return isWeb ? <WebLayout /> : <MobileLayout />;
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  // Web Layout
  webLayoutContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.light,
  },

  // Sidebar
  sidebar: {
    backgroundColor: '#1a1f36',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: '#2a2f46',
  },
  webSidebar: {
    backgroundColor: '#1a1f36',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: '#2a2f46',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f46',
  },
  logoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMain: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  logoSub: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  logoAdmin: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  toggleButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarNav: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItemWrapper: {
    position: 'relative',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.admin,
  },
  sidebarLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarLabelActive: {
    color: COLORS.admin,
    fontWeight: '600',
  },
  tooltip: {
    position: 'absolute',
    left: SIDEBAR_WIDTH_COLLAPSED + 8,
    top: '50%',
    transform: [{ translateY: -14 }],
    backgroundColor: COLORS.dark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.sm,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  tooltipText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  sidebarFooter: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2f46',
    paddingTop: 8,
    position: 'relative',
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    gap: 12,
    marginBottom: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  themeToggleText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },

  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  // Web Header
  webHeader: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.dark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.full,
    gap: SPACING.xs,
  },
  roleBadgeText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.admin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.caption,
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: 2,
  },

  // Screen Container
  screenContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    backgroundColor: 'transparent',
  },

  // Logout Modal Styles
  modalOverlayLogout: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  logoutModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl * 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  logoutModalMessage: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.light,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonTextCancel: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Mobile Styles
  mobileTabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    height: 60,
    paddingTop: SPACING.xs,
  },
  mobileLogoutButton: {
    marginRight: SPACING.md,
    padding: SPACING.sm,
  },
});
