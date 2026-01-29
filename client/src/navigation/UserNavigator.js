/**
 * UserNavigator
 * Navegación adaptada a plataforma:
 * - MÓVIL: Bottom Tab Navigator con 4 pestañas
 * - WEB: Layout con Sidebar (izquierda 20%) + Contenido (derecha 80%)
 */

import React, { useState, useContext, useRef } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text, ScrollView, Modal, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import UserHomeScreen from '../screens/user/UserHomeScreen';
import BenefitsScreen from '../screens/user/BenefitsScreen';
import EarnScreen from '../screens/user/EarnScreen';
import AssociatesScreen from '../screens/user/AssociatesScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import HistorialScreen from '../screens/user/HistorialScreen';
import MissionDetailScreen from '../screens/user/MissionDetailScreen';
import MissionSubmissionScreen from '../screens/user/MissionSubmissionScreen';
import BenefitDetailScreen from '../screens/user/BenefitDetailScreen';
import QRCodeScreen from '../screens/user/QRCodeScreen';
import WebHeader from '../components/WebHeader';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING } from '../theme/theme';

const Stack = createNativeStackNavigator();

const Tab = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';

// ============================================================================
// COMPONENTE: Sidebar para WEB (recibe props del WebLayout)
// ============================================================================
function WebSidebar({ onNavigate, activeRoute }) {
  const { logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Usar la ruta activa pasada como prop
  const activeRouteName = activeRoute || 'Home';

  const handleLogoutConfirm = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
    }
  };

  const tabs = [
    { id: 'Home', label: 'Tus estadísticas', icon: 'home' },
    { id: 'Earn', label: 'Gana Puntos', icon: 'star' },
    { id: 'Benefits', label: 'Beneficios', icon: 'gift' },
    { id: 'Historial', label: 'Historial', icon: 'history' },
    { id: 'Profile', label: 'Configuración', icon: 'cog' },
  ];

  const handleNavigate = (tabId) => {
    if (onNavigate) {
      onNavigate(tabId);
    }
  };

  return (
    <View style={[styles.webSidebar, { backgroundColor: theme.sidebarBg }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons name="leaf" size={28} color={theme.sidebarText} />
        <View>
          <Text style={[styles.logoMain, { color: theme.sidebarText }]}>Puntos</Text>
          <Text style={[styles.logoSub, { color: theme.sidebarText }]}>Ciudadanos</Text>
        </View>
      </View>

      <ScrollView style={styles.sidebarNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.sidebarItem,
              activeRouteName === tab.id && styles.sidebarItemActive,
            ]}
            onPress={() => handleNavigate(tab.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={20}
              color={activeRouteName === tab.id ? COLORS.primary : theme.sidebarText}
            />
            <Text
              style={[
                styles.sidebarLabel,
                { color: theme.sidebarText },
                activeRouteName === tab.id && styles.sidebarLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        {/* Control de Tema */}
        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <MaterialCommunityIcons 
            name={isDarkMode ? 'weather-sunny' : 'weather-night'} 
            size={20} 
            color={theme.sidebarText} 
          />
          <Text style={[styles.themeToggleText, { color: theme.sidebarText }]}>
            {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={isDarkMode ? COLORS.success : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </TouchableOpacity>
        
        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
          <MaterialCommunityIcons name="logout" size={20} color={theme.sidebarText} />
          <Text style={[styles.logoutText, { color: theme.sidebarText }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de confirmación */}
      <Modal
        transparent
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
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
    </View>
  );
}

// ============================================================================
// COMPONENTE: Web Layout (Sidebar + Content con Tab.Navigator real)
// ============================================================================
function WebLayout() {
  const { theme } = useTheme();
  const [activeRoute, setActiveRoute] = useState('Home');
  const navigationRef = useRef(null);
  
  const [missionSubmissionVisible, setMissionSubmissionVisible] = useState(false);
  const [missionSubmissionParams, setMissionSubmissionParams] = useState(null);
  const [benefitDetailVisible, setBenefitDetailVisible] = useState(false);
  const [benefitDetailParams, setBenefitDetailParams] = useState(null);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [qrCodeParams, setQrCodeParams] = useState(null);
  const [associatesVisible, setAssociatesVisible] = useState(false);

  // Handler para navegación desde el sidebar
  const handleSidebarNavigate = (routeName) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(routeName);
    }
  };

  const handleMissionPress = (params) => {
    setMissionSubmissionParams(params);
    setMissionSubmissionVisible(true);
  };

  const handleCloseMissionSubmission = () => {
    setMissionSubmissionVisible(false);
    setTimeout(() => {
      setMissionSubmissionParams(null);
    }, 300);
  };

  const handleBenefitPress = (params) => {
    setBenefitDetailParams(params);
    setBenefitDetailVisible(true);
  };

  const handleCloseBenefitDetail = () => {
    setBenefitDetailVisible(false);
    setTimeout(() => {
      setBenefitDetailParams(null);
    }, 300);
  };

  const handleQRCodePress = (params) => {
    console.log('[UserNavigator] Navegando a QRCode con params:', params);
    setQrCodeParams(params);
    setQrCodeVisible(true);
  };

  const handleCloseQRCode = () => {
    setQrCodeVisible(false);
    setTimeout(() => {
      setQrCodeParams(null);
    }, 300);
  };

  const handleAssociatesPress = () => {
    setAssociatesVisible(true);
  };

  // Navegación mock para componentes que abren modales
  const createNavigationMock = (navigation) => ({
    navigate: (screen, params) => {
      if (screen === 'MissionSubmission') {
        handleMissionPress(params);
      } else if (screen === 'BenefitDetail') {
        handleBenefitPress(params);
      } else if (screen === 'QRCode') {
        handleQRCodePress(params);
      } else if (screen === 'Associates') {
        handleAssociatesPress();
      } else {
        // Usar navegación real para tabs
        navigation.navigate(screen, params);
      }
    },
    push: (screen, params) => {
      if (screen === 'MissionSubmission') {
        handleMissionPress(params);
      } else if (screen === 'BenefitDetail') {
        handleBenefitPress(params);
      } else if (screen === 'QRCode') {
        handleQRCodePress(params);
      }
    },
    goBack: () => {
      if (qrCodeVisible) {
        handleCloseQRCode();
      } else if (benefitDetailVisible) {
        handleCloseBenefitDetail();
      } else if (missionSubmissionVisible) {
        handleCloseMissionSubmission();
      }
    }
  });

  // Obtener título según la ruta activa
  const getPageTitle = (routeName) => {
    const titles = {
      'Home': 'Tus Estadísticas',
      'Earn': 'Gana Puntos',
      'Benefits': 'Beneficios Disponibles',
      'Historial': 'Mi Historial',
      'Profile': 'Configuración',
    };
    return titles[routeName] || 'Puntos Ciudadanos';
  };

  return (
    <>
      <View style={styles.webContainer}>
        <WebSidebar onNavigate={handleSidebarNavigate} activeRoute={activeRoute} />
        <View style={styles.webContent}>
          <Tab.Navigator
            screenListeners={{
              state: (e) => {
                const state = e.data.state;
                if (state) {
                  const currentRoute = state.routes[state.index];
                  setActiveRoute(currentRoute?.name || 'Home');
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
                header: ({ route }) => <WebHeader title={getPageTitle(route.name)} />,
                tabBarStyle: { display: 'none' },
              };
            }}
          >
            <Tab.Screen name="Home" options={{ title: 'Inicio - Puntos Ciudadanos' }}>
              {(props) => <UserHomeScreen {...props} navigation={createNavigationMock(props.navigation)} />}
            </Tab.Screen>
            <Tab.Screen name="Earn" options={{ title: 'Gana Puntos - Puntos Ciudadanos' }}>
              {(props) => <EarnScreen {...props} navigation={createNavigationMock(props.navigation)} />}
            </Tab.Screen>
            <Tab.Screen name="Benefits" options={{ title: 'Beneficios - Puntos Ciudadanos' }}>
              {(props) => <BenefitsScreen {...props} navigation={createNavigationMock(props.navigation)} />}
            </Tab.Screen>
            <Tab.Screen name="Historial" options={{ title: 'Historial - Puntos Ciudadanos' }}>
              {(props) => <HistorialStack />}
            </Tab.Screen>
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Configuración - Puntos Ciudadanos' }} />
          </Tab.Navigator>
        </View>
      </View>

      {/* Modal para MissionSubmission */}
      <Modal
        visible={missionSubmissionVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMissionSubmission}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <TouchableOpacity 
              style={[styles.modalClose, { backgroundColor: theme.surface }]}
              onPress={handleCloseMissionSubmission}
            >
              <Text style={[styles.modalCloseText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
            {missionSubmissionParams && (
              <MissionSubmissionScreen 
                route={{ params: missionSubmissionParams }}
                navigation={{ goBack: handleCloseMissionSubmission }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para BenefitDetail */}
      <Modal
        visible={benefitDetailVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseBenefitDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <TouchableOpacity 
              style={[styles.modalClose, { backgroundColor: theme.surface }]}
              onPress={handleCloseBenefitDetail}
            >
              <Text style={[styles.modalCloseText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
            {benefitDetailParams && (
              <BenefitDetailScreen 
                route={{ params: benefitDetailParams }}
                navigation={{ 
                  goBack: handleCloseBenefitDetail,
                  navigate: (screen, params) => {
                    if (screen === 'QRCode') {
                      handleCloseBenefitDetail();
                      handleQRCodePress(params);
                    }
                  },
                  replace: (screen, params) => {
                    if (screen === 'QRCode') {
                      handleCloseBenefitDetail();
                      handleQRCodePress(params);
                    }
                  }
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para QRCode */}
      <Modal
        visible={qrCodeVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseQRCode}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.qrModalContent, { backgroundColor: theme.background }]}>
            {qrCodeParams && (
              <QRCodeScreen 
                route={{ params: qrCodeParams }}
                navigation={{ 
                  goBack: handleCloseQRCode
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para Associates */}
      <Modal
        visible={associatesVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAssociatesVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <TouchableOpacity 
              style={[styles.modalClose, { backgroundColor: theme.surface }]}
              onPress={() => setAssociatesVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
            <AssociatesScreen navigation={{ goBack: () => setAssociatesVisible(false) }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

// ============================================================================
// COMPONENTE: Stack para Misiones
// ============================================================================
function EarnStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="EarnScreen"
        component={EarnScreen}
        options={{ title: 'Gana Puntos' }}
      />
      <Stack.Screen
        name="MissionDetail"
        component={MissionDetailScreen}
        options={{ title: 'Detalles de Misión' }}
      />
      <Stack.Screen
        name="MissionSubmission"
        component={MissionSubmissionScreen}
        options={{ title: 'Enviar Evidencia' }}
      />
    </Stack.Navigator>
  );
}

// ============================================================================
// COMPONENTE: Stack para Beneficios
// ============================================================================
function BenefitsStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="BenefitsMain"
        component={BenefitsScreen}
        options={{ title: 'Beneficios' }}
      />
      <Stack.Screen
        name="BenefitDetail"
        component={BenefitDetailScreen}
        options={{ title: 'Detalles del Beneficio' }}
      />
      <Stack.Screen
        name="QRCode"
        component={QRCodeScreen}
        options={{ title: 'Código QR' }}
      />
    </Stack.Navigator>
  );
}

// ============================================================================
// COMPONENTE: Historial Stack
// ============================================================================
function HistorialStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="HistorialMain"
        component={HistorialScreen}
        options={{ title: 'Mi Historial' }}
      />
      <Stack.Screen
        name="QRCode"
        component={QRCodeScreen}
        options={{ title: 'Código QR' }}
      />
    </Stack.Navigator>
  );
}

// ============================================================================
// COMPONENTE: Stack para Home (Incluye Associates)
// ============================================================================
function HomeStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="HomeMain" component={UserHomeScreen} options={{ title: 'Inicio' }} />
      <Stack.Screen name="Associates" component={AssociatesScreen} options={{ title: 'Comercios Asociados' }} />
    </Stack.Navigator>
  );
}

// ============================================================================
// COMPONENTE: Mobile Layout (Bottom Tabs)
// ============================================================================
function MobileLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerSafeAreaEnabled: false,
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        tabBarIcon: ({ focused, color }) => {
          const iconMap = {
            Home: 'home',
            Benefits: 'gift',
            Earn: 'star',
            Historial: 'history',
            Profile: 'cog',
          };

          return (
            <MaterialCommunityIcons
              name={iconMap[route.name]}
              size={24}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: { 
          ...styles.mobileTabBar, 
          paddingBottom: insets.bottom, 
          height: 60 + insets.bottom,
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Inicio', headerShown: false }}
      />
      <Tab.Screen
        name="Benefits"
        component={BenefitsStack}
        options={{ headerShown: false, title: 'Beneficios' }}
      />
      <Tab.Screen
        name="Earn"
        component={EarnStack}
        options={{ headerShown: false, title: 'Gana Puntos' }}
      />
      <Tab.Screen
        name="Historial"
        component={HistorialStack}
        options={{ headerShown: false, title: 'Historial' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================================
// COMPONENTE: Principal (Detecta plataforma)
// ============================================================================
export default function UserNavigator() {
  return isWeb ? <WebLayout /> : <MobileLayout />;
}

// ============================================================================
// ESTILOS
// ============================================================================
const styles = StyleSheet.create({
  // --------- MOBILE STYLES ---------
  mobileTabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    height: 60,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  // --------- WEB STYLES ---------
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  webSidebar: {
    width: '20%',
    backgroundColor: '#1a1f36',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: '#2a2f46',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f46',
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
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f46',
  },
  sidebarTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  sidebarNav: {
    flex: 1,
    paddingVertical: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  sidebarLabel: {
    marginLeft: 12,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sidebarFooter: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2f46',
    paddingTop: 8,
    gap: 8,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    gap: 12,
  },
  themeToggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  webContent: {
    flex: 1,
    width: '80%',
    backgroundColor: COLORS.white,
    overflow: 'auto',
  },
  activeScreen: {
    flex: 1,
    display: 'flex',
  },
  hiddenScreen: {
    display: 'none',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 900,
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 0,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  qrModalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalCloseText: {
    fontSize: 24,
    color: COLORS.dark,
    fontWeight: '600',
    lineHeight: 24,
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
});
