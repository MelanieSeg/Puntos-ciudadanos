/**
 * MerchantNavigator
 * Navegación adaptada a plataforma:
 * - MÓVIL: Bottom Tab Navigator con 3 pestañas
 * - WEB: Layout con Sidebar (izquierda 20%) + Contenido (derecha 80%)
 */

import React, { useState, useContext } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text, ScrollView, Modal, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen';
import MerchantBenefitsScreen from '../screens/merchant/MerchantBenefitsScreen';
import ScannerScreen from '../screens/merchant/ScannerScreen';
import QRScannerScreen from '../screens/merchant/QRScannerScreen';
import HistoryScreen from '../screens/merchant/HistoryScreen';
import WebHeader from '../components/WebHeader';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING } from '../theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const isWeb = Platform.OS === 'web';

// ============================================================================
// COMPONENTE: Sidebar para WEB
// ============================================================================
function WebSidebar({ activeTab, onNavigate }) {
  const { logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
    }
  };

  const tabs = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'chart-box' },
    { id: 'Benefits', label: 'Mis Beneficios', icon: 'gift' },
    { id: 'Scanner', label: 'Validar Cupones', icon: 'qrcode-scan' },
    { id: 'History', label: 'Historial', icon: 'history' },
  ];

  return (
    <View style={[styles.webSidebar, { backgroundColor: theme.sidebarBg || '#1a1f36' }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons name="leaf" size={28} color={theme.sidebarText || COLORS.white} />
        <View>
          <Text style={[styles.logoMain, { color: theme.sidebarText || COLORS.white }]}>Puntos</Text>
          <Text style={[styles.logoSub, { color: theme.sidebarText || COLORS.white }]}>Ciudadanos</Text>
          <Text style={[styles.logoMerchant, { color: (theme.sidebarText || COLORS.white) + '99' }]}>Mi Comercio</Text>
        </View>
      </View>

      <ScrollView style={styles.sidebarNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.sidebarItem,
              activeTab === tab.id && styles.sidebarItemActive,
            ]}
            onPress={() => onNavigate(tab.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? COLORS.merchant : (theme.sidebarText || COLORS.white)}
            />
            <Text
              style={[
                styles.sidebarLabel,
                { color: theme.sidebarText || COLORS.white },
                activeTab === tab.id && styles.sidebarLabelActive,
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
            color={theme.sidebarText || COLORS.white} 
          />
          <Text style={[styles.themeToggleText, { color: theme.sidebarText || COLORS.white }]}>
            {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: COLORS.merchant }}
            thumbColor={isDarkMode ? COLORS.success : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
          <MaterialCommunityIcons name="logout" size={20} color={theme.sidebarText || COLORS.white} />
          <Text style={[styles.logoutText, { color: theme.sidebarText || COLORS.white }]}>Cerrar Sesión</Text>
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
// COMPONENTE: Web Layout (Sidebar + Content)
// ============================================================================
function WebLayout() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const navigationMock = {
    navigate: (screen) => {
      if (screen === 'QRScanner') {
        setActiveTab('Scanner');
      } else {
        setActiveTab(screen);
      }
    }
  };

  const renderContent = () => {
    return (
      <>
        <View style={activeTab === 'Dashboard' ? styles.activeScreen : styles.hiddenScreen}>
          <MerchantDashboardScreen navigation={navigationMock} />
        </View>
        <View style={activeTab === 'Benefits' ? styles.activeScreen : styles.hiddenScreen}>
          <MerchantBenefitsScreen navigation={navigationMock} />
        </View>
        <View style={activeTab === 'Scanner' ? styles.activeScreen : styles.hiddenScreen}>
          <ScannerScreen navigation={navigationMock} />
        </View>
        <View style={activeTab === 'History' ? styles.activeScreen : styles.hiddenScreen}>
          <HistoryScreen navigation={navigationMock} />
        </View>
      </>
    );
  };

  const getPageTitle = () => {
    const titles = {
      'Dashboard': 'Panel de Control',
      'Benefits': 'Mis Beneficios',
      'Scanner': 'Validar Cupones',
      'History': 'Historial de Validaciones',
    };
    return titles[activeTab] || 'Mi Comercio';
  };

  return (
    <View style={styles.webContainer}>
      <WebSidebar activeTab={activeTab} onNavigate={setActiveTab} />
      <View style={styles.webContent}>
        <WebHeader title={getPageTitle()} hideBalance={true} />
        {renderContent()}
      </View>
    </View>
  );
}

// ============================================================================
// COMPONENTE: Scanner Stack (para incluir QRScannerScreen en móvil)
// ============================================================================
function ScannerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ScannerMain" 
        component={ScannerScreen} 
        options={{
          headerShown: false, // Ocultamos el header del Stack para usar el del Tab
        }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{
          headerShown: false, // Ocultamos header aquí también (tiene su propia UI de cámara)
        }}
      />
    </Stack.Navigator>
  );
}

// ============================================================================
// COMPONENTE: Mobile Layout (Bottom Tabs)
// ============================================================================
function MobileLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.merchant,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerTitleAlign: 'left',
        tabBarIcon: ({ focused }) => {
          const iconMap = {
            Dashboard: 'chart-box',
            Benefits: 'gift',
            Scanner: 'qrcode-scan',
            History: 'history',
          };
          return (
            <MaterialCommunityIcons
              name={iconMap[route.name]}
              size={24}
              color={focused ? COLORS.merchant : COLORS.gray}
            />
          );
        },
        tabBarActiveTintColor: COLORS.merchant,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          ...styles.mobileTabBar,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={MerchantDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Benefits"
        component={MerchantBenefitsScreen}
        options={{ title: 'Beneficios' }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerStack}
        options={{ title: 'Validar Cupón' }} // Activamos el header del Tab (quitando headerShown: false)
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Historial' }}
      />
    </Tab.Navigator>
  );
}

// ============================================================================
// EXPORT: Selector de Layout según plataforma
// ============================================================================
export default function MerchantNavigator() {
  return isWeb ? <WebLayout /> : <MobileLayout />;
}

const styles = StyleSheet.create({
  // ========== MOBILE TAB BAR ==========
  mobileTabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    height: 60,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },

  // ========== WEB LAYOUT ==========
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
  logoMerchant: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    marginTop: 2,
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
    backgroundColor: 'rgba(255, 138, 76, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.merchant,
  },
  sidebarLabel: {
    marginLeft: 12,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarLabelActive: {
    color: COLORS.merchant,
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
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  themeToggleText: {
    flex: 1,
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

  // ========== LOGOUT MODAL ==========
  modalOverlay: {
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
});
