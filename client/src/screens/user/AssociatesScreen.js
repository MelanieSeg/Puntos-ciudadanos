import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Platform, TouchableOpacity, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { useAssociates } from '../../hooks/useUserData';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING } from '../../theme/theme';

export default function AssociatesScreen() {
  const { theme } = useTheme();
  const { data: associates, isLoading } = useAssociates();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssociates = associates?.filter(merchant => 
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface }]}
      onPress={() => {
        const address = item.merchantProfile?.address;
        if (address) {
          // Si empieza con http es un link, si no, creamos una búsqueda en Google Maps
          const finalUrl = address.startsWith('http') 
            ? address 
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
            
          Linking.openURL(finalUrl).catch(err => {
            if (Platform.OS === 'web') {
              window.alert('Error: No se pudo abrir el mapa');
            } else {
              Alert.alert('Error', 'No se pudo abrir el mapa');
            }
          });
        } else {
          if (Platform.OS === 'web') {
            window.alert('Aviso: Este comercio no tiene ubicación registrada');
          } else {
            Alert.alert('Aviso', 'Este comercio no tiene ubicación registrada');
          }
        }
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: COLORS.light }]}>
        <MaterialCommunityIcons name="store" size={32} color={COLORS.primary} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.merchantName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.merchantCategory, { color: theme.textSecondary }]}>
          {item.category || 'Comercio Asociado'}
        </Text>
        {item.merchantProfile?.address && (
          <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>
            Ver ubicación <MaterialCommunityIcons name="map-marker" size={12} />
          </Text>
        )}
        {item.merchantProfile?.phone && (
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            <MaterialCommunityIcons name="phone" size={12} /> {item.merchantProfile.phone}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper bgColor={theme.background} padding={0} maxWidth={Platform.OS === 'web'} safeArea={Platform.OS !== 'web'}>
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <MaterialCommunityIcons name="magnify" size={24} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar comercio..."
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAssociates}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="store-off" size={48} color={COLORS.gray} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No se encontraron comercios
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContainer: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  merchantCategory: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xl * 2,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
  },
});