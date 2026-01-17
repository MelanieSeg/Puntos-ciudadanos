/**
 * AdminNavigator
 * Bottom Tab Navigator para admins
 * Pestañas: Dashboard, Misiones, Beneficios, Aprobaciones, Usuarios, Configuración
 */

import React, { useContext, useState } from 'react';
import { StyleSheet, Platform, TouchableOpacity } from 'react-native';
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
import { COLORS, TAB_CONFIG, SPACING } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const isWeb = Platform.OS === 'web';

export default function AdminNavigator() {
  const insets = useSafeAreaInsets();
  const { logout, authState } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    console.log('Botón logout presionado');
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
          options={{ title: 'Aprobaciones Pendientes' }}
        />
        <Stack.Group screenOptions={{ 
          presentation: 'modal', 
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

  // Verificar si el usuario es MASTER_ADMIN
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
              style={styles.logoutButton}
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
                color={focused ? tabConfig.color : COLORS.gray}
              />
            );
          },
          tabBarLabel: tabConfig?.label,
          tabBarActiveTintColor: tabConfig?.color,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: isWeb 
            ? styles.webTabBar 
            : { ...styles.mobileTabBar, paddingBottom: insets.bottom, height: 60 + insets.bottom },
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
        options={{ headerShown: false, title: 'Aprobaciones' }}
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

const styles = StyleSheet.create({
  mobileTabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    height: 60,
    paddingTop: SPACING.xs,
  },
  webTabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    height: 70,
    paddingTop: SPACING.sm,
  },
  logoutButton: {
    marginRight: SPACING.md,
    padding: SPACING.sm,
  },
});
