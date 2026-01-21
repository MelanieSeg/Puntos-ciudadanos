/**
 * AdminNavigator
 * Layout adaptativo: WebLayout (Sidebar) en web, Bottom Tabs en mobile
 * Pestañas: Dashboard, Misiones, Beneficios, Aprobaciones, Usuarios, Auditoría, Configuración
 */

import React, { useContext, useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen';
import BenefitsManagementScreen from '../screens/admin/BenefitsManagementScreen';
import SubmissionsApprovalScreen from '../screens/admin/SubmissionsApprovalScreen';
import SubmissionDetailScreen from '../screens/admin/SubmissionDetailScreen';
import MissionsManagementScreen from '../screens/admin/MissionsManagementScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminAuditScreen from '../screens/admin/AdminAuditScreen';
import { COLORS, TAB_CONFIG, SPACING, LAYOUT, TYPOGRAPHY } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const isWeb = Platform.OS === 'web';

// Constantes para el sidebar
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const HEADER_HEIGHT = 64;

// ============================================
// WEB SIDEBAR COMPONENT
// ============================================
function WebSidebar({ activeTab, onNavigate, isCollapsed, setIsCollapsed, isMasterAdmin, onLogout }) {
  const { isDarkMode, toggleTheme, theme } = useContext(AuthContext);
  const sidebarWidth = useRef(new Animated.Value(isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)).current;
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
    { id: 'AdminDashboard', label: 'Dashboard', icon: 'view-dashboard' },
    { id: 'Missions', label: 'Misiones', icon: 'target' },
    { id: 'Benefits', label: 'Beneficios', icon: 'gift' },
    { id: 'Approvals', label: 'Solicitudes', icon: 'check-circle' },
    { id: 'Users', label: 'Usuarios', icon: 'account-multiple' },
    ...(isMasterAdmin ? [{ id: 'Audit', label: 'Auditoría', icon: 'shield-lock' }] : []),
    { id: 'Settings', label: 'Configuración', icon: 'cog' },
  ];

  return (
    <Animated.View style={[styles.webSidebar, { width: sidebarWidth }]}>
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
          const isActive = activeTab === item.id;

          return (
            <View key={item.id} style={styles.menuItemWrapper}>
              <TouchableOpacity
                style={[
                  styles.sidebarItem,
                  isActive && styles.sidebarItemActive,
                ]}
                onPress={() => onNavigate(item.id)}
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

      {/* Footer con Logout */}
      <View style={styles.sidebarFooter}>
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
          <View style={styles.logoutModalContent}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="logout" size={56} color={COLORS.error} />
            </View>
            <Text style={styles.logoutModalTitle}>Cerrar Sesión</Text>
            <Text style={styles.logoutModalMessage}>¿Estás seguro que deseas salir de tu cuenta?</Text>
            
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
    <View style={styles.webHeader}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>{title}</Text>
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
            <Text style={styles.userName}>{userName || 'Admin'}</Text>
            <Text style={styles.userEmail}>{userEmail || ''}</Text>
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
  const [activeTab, setActiveTab] = useState('AdminDashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Modal para SubmissionDetail en web
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const isMasterAdmin = authState?.user?.role === 'MASTER_ADMIN';
  const userName = authState?.user?.name || 'Administrador';
  const userEmail = authState?.user?.email || '';
  const userRole = authState?.user?.role || 'ADMIN';

  const handleLogout = () => {
    logout().then(() => {
      console.log('Logout exitoso');
    }).catch((err) => {
      console.error('Error en logout:', err);
    });
  };

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
  };

  // Navegación mock para pasar a las pantallas
  const mockNavigation = {
    navigate: (screen, params) => {
      if (screen === 'SubmissionDetail') {
        setSelectedSubmission(params?.submission);
        setShowDetailModal(true);
      }
    },
    goBack: () => {
      setShowDetailModal(false);
      setSelectedSubmission(null);
    },
  };

  const getScreenTitle = () => {
    const titles = {
      AdminDashboard: 'Dashboard',
      Missions: 'Gestión de Misiones',
      Benefits: 'Gestión de Beneficios',
      Approvals: 'Solicitudes Pendientes',
      Users: 'Gestión de Usuarios',
      Audit: 'Auditoría del Sistema',
      Settings: 'Configuración',
    };
    return titles[activeTab] || 'Admin';
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'AdminDashboard':
        return <AdminDashboardScreen />;
      case 'Missions':
        return <MissionsManagementScreen />;
      case 'Benefits':
        return <BenefitsManagementScreen />;
      case 'Approvals':
        return <SubmissionsApprovalScreen navigation={mockNavigation} />;
      case 'Users':
        return <UsersManagementScreen />;
      case 'Audit':
        return isMasterAdmin ? <AdminAuditScreen /> : null;
      case 'Settings':
        return <AdminSettingsScreen />;
      default:
        return <AdminDashboardScreen />;
    }
  };

  return (
    <View style={styles.webLayoutContainer}>
      {/* Sidebar */}
      <WebSidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMasterAdmin={isMasterAdmin}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Header */}
        <AdminWebHeader 
          title={getScreenTitle()} 
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />

        {/* Screen Content */}
        <View style={styles.screenContainer}>
          {renderScreen()}
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
                navigation={mockNavigation}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
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
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.admin,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="MissionsMain"
          component={MissionsManagementScreen}
          options={{ title: 'Gestión de Misiones' }}
        />
      </Stack.Navigator>
    );
  }

  // Stack para Aprobaciones
  function ApprovalsStack() {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.admin,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
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
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.admin,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="SettingsMain"
          component={AdminSettingsScreen}
          options={{ title: 'Configuración del Sistema' }}
        />
      </Stack.Navigator>
    );
  }

  const isMasterAdmin = authState?.user?.role === 'MASTER_ADMIN';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tabConfig = TAB_CONFIG.adminTabs.find((t) => t.name === route.name);

        return {
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.admin,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.mobileLogoutButton}
            >
              <MaterialCommunityIcons name="logout" size={20} color={COLORS.white} />
            </TouchableOpacity>
          ),
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
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: { 
            ...styles.mobileTabBar, 
            paddingBottom: insets.bottom, 
            height: 60 + insets.bottom 
          },
        };
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Missions"
        component={MissionsStack}
        options={{ headerShown: false, title: 'Misiones' }}
      />
      <Tab.Screen
        name="Benefits"
        component={BenefitsManagementScreen}
        options={{ title: 'Beneficios' }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalsStack}
        options={{ headerShown: false, title: 'Solicitudes' }}
      />
      <Tab.Screen
        name="Users"
        component={UsersManagementScreen}
        options={{ title: 'Usuarios' }}
      />
      {isMasterAdmin && (
        <Tab.Screen
          name="Audit"
          component={AdminAuditScreen}
          options={{ title: 'Auditoría' }}
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
