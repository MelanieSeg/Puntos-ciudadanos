import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import MerchantDashboardSkeleton from '../../components/skeletons/MerchantDashboardSkeleton';
import api from '../../services/api';

export default function MerchantDashboardScreen({ navigation }) {
  const { authState, logout } = useContext(AuthContext);
  const { user, role } = authState;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Historial de transacciones recientes
  const mockHistorial = [
    {
      id: '1',
      cliente: 'Juan Pérez',
      producto: 'Pizza 2x1',
      hora: '10:30 AM',
      fecha: 'Hoy',
    },
    {
      id: '2',
      cliente: 'María González',
      producto: 'Descuento 20%',
      hora: '09:15 AM',
      fecha: 'Hoy',
    },
    {
      id: '3',
      cliente: 'Carlos López',
      producto: 'Hamburguesa Gratis',
      hora: '08:45 AM',
      fecha: 'Hoy',
    },
    {
      id: '4',
      cliente: 'Ana Martínez',
      producto: 'Bebida Gratis',
      hora: '15:20 PM',
      fecha: 'Ayer',
    },
    {
      id: '5',
      cliente: 'Roberto Silva',
      producto: 'Postre Gratis',
      hora: '14:10 PM',
      fecha: 'Ayer',
    },
  ];

  // Cargar estadísticas del backend
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/merchant/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Valores predeterminados en caso de error de red
      setStats({
        totalPuntosCanjeados: 2450,
        qrsValidados: 12,
        ultimasTransacciones: mockHistorial,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  const renderHistorialItem = ({ item }) => (
    <View style={styles.historialItem}>
      <View style={styles.historialContent}>
        <Text style={styles.historialCliente}>{item.cliente}</Text>
        <Text style={styles.historialProducto}>{item.producto}</Text>
        <Text style={styles.historialFecha}>{item.fecha}</Text>
      </View>
      <Text style={styles.historialHora}>{item.hora}</Text>
    </View>
  );

  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <MerchantDashboardSkeleton />
      </SafeAreaView>
    );
  }

  const totalPuntosCanjeados = stats?.totalPuntosCanjeados || 2450;
  const qrsValidados = stats?.qrsValidados || 12;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={mockHistorial}
        renderItem={renderHistorialItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerGreeting}>Hola, {user?.name}</Text>
                <Text style={styles.headerSubtitle}>Comercio - {user?.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutIconButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutIcon}>🚪</Text>
              </TouchableOpacity>
            </View>

            {/* Tarjetas de Estadísticas */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Puntos Canjeados</Text>
                <Text style={styles.statValue}>{totalPuntosCanjeados}</Text>
                <Text style={styles.statUnit}>pts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>QRs Validados</Text>
                <Text style={styles.statValue}>{qrsValidados}</Text>
                <Text style={styles.statUnit}>validaciones</Text>
              </View>
            </View>

            {/* Botón de Escanear (FAB Style) */}
            <View style={styles.fabContainer}>
              <TouchableOpacity
                style={styles.fabButton}
                onPress={handleScanQR}
                activeOpacity={0.7}
              >
                <Text style={styles.fabIcon}>📱</Text>
                <Text style={styles.fabText}>Escanear Cupón</Text>
              </TouchableOpacity>
            </View>

            {/* Sección de Historial */}
            <View style={styles.historialHeader}>
              <Text style={styles.historialTitle}>Últimos Canjes</Text>
            </View>
          </View>
        }
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  logoutIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  logoutIcon: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 11,
    color: '#bbb',
  },
  fabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fabButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 5,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historialHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  historialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  historialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  historialContent: {
    flex: 1,
    marginRight: 12,
  },
  historialCliente: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  historialProducto: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  historialFecha: {
    fontSize: 11,
    color: '#bbb',
  },
  historialHora: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
});
