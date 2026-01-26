import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

const isWeb = Platform.OS === 'web';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SubmissionDetailScreen({ route, navigation, isWebModal = false }) {
  const { submission } = route.params || {};
  const { theme } = useTheme();

  // En web dentro de modal, no necesitamos el container con backdrop
  const renderContent = () => {
    if (!submission) {
      return (
        <View style={styles.modalContent}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.error} />
            <Text style={styles.errorText}>No se encontraron datos del envío</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Detalles de la Solicitud</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCloseButton}>
            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <MaterialCommunityIcons 
              name={submission.status === 'APPROVED' ? 'check-circle' : submission.status === 'REJECTED' ? 'close-circle' : 'clock-outline'} 
              size={20} 
              color={getStatusTextColor()} 
            />
            <Text style={[styles.statusText, { color: getStatusTextColor() }]}>{getStatusText()}</Text>
          </View>

          {/* User Info Card */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Usuario</Text>
            <View style={[styles.userInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.avatarContainer}>
                  <MaterialCommunityIcons name="account" size={32} color={COLORS.white} />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: theme.text }]}>{submission.userName}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{submission.userEmail}</Text>
              </View>
            </View>
          </View>

          {/* Mission Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Misión</Text>
            <View style={[styles.infoRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Nombre</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{submission.missionName}</Text>
              </View>
              <View style={styles.infoItemRight}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Puntos</Text>
                <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '700' }]}>+{submission.points}</Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={[styles.infoRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Fecha de Envío</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {new Date(submission.submittedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>

            {submission.observation && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={[styles.infoItem, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Observaciones</Text>
                  <Text style={[styles.observationText, { color: theme.text }]}>{submission.observation}</Text>
                </View>
              </>
            )}
          </View>

          {/* Evidence */}
          {submission.evidenceUrl && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Evidencia {submission.metadata?.allImages ? `(${submission.metadata.allImages.length})` : ''}
              </Text>
              
              {submission.metadata?.allImages ? (
                <View style={styles.imagesGrid}>
                  {submission.metadata.allImages.map((imageUrl, index) => (
                    <Image 
                      key={index} 
                      source={{ uri: imageUrl }} 
                      style={styles.evidenceImageGrid}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              ) : (
                <Image 
                  source={{ uri: submission.evidenceUrl }} 
                  style={styles.evidenceImage} 
                  resizeMode="cover" 
                />
              )}
            </View>
          )}
        </ScrollView>
        
        <View style={[styles.modalFooter, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.closeButtonText, { color: theme.text }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStatusColor = () => {
    switch (submission?.status) {
      case 'PENDING': return '#FFF3CD';
      case 'APPROVED': return '#D4EDDA';
      case 'REJECTED': return '#F8D7DA';
      default: return COLORS.light;
    }
  };

  const getStatusTextColor = () => {
    switch (submission?.status) {
      case 'PENDING': return '#856404';
      case 'APPROVED': return '#155724';
      case 'REJECTED': return '#721C24';
      default: return COLORS.gray;
    }
  };

  const getStatusText = () => {
    switch (submission?.status) {
      case 'PENDING': return 'Pendiente de Revisión';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return submission?.status;
    }
  };

  // En web con modal externo, solo renderizar el contenido
  if (isWeb) {
    return renderContent();
  }

  // En mobile, renderizar con backdrop
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={() => navigation.goBack()}
      />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Importante para que se vea el fondo
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%', // Evita que se esconda bajo tabs
    ...LAYOUT.shadowLarge,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: TYPOGRAPHY.h5,
    fontWeight: '700',
    color: COLORS.dark,
  },
  headerCloseButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  statusText: {
    fontWeight: '700',
    fontSize: TYPOGRAPHY.body2,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.body2,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    gap: SPACING.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoItem: {
    flex: 1,
  },
  infoItemRight: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.dark,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.light,
    marginVertical: SPACING.md,
  },
  observationText: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.dark,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  evidenceImage: {
    width: '100%',
    height: 250,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  evidenceImageGrid: {
    width: '48%',
    height: 150,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: COLORS.light,
    marginBottom: SPACING.sm,
  },
  modalFooter: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    backgroundColor: COLORS.light,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
  },
  errorContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
