import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT } from '../../theme/theme';

const isWeb = Platform.OS === 'web';

// Overlay CSS para web
const overlayStyle = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

export default function SubmissionDetailScreen({ route, navigation }) {
  const { submission } = route.params || {};
  const [showModal, setShowModal] = useState(isWeb ? true : false);

  useEffect(() => {
    if (isWeb) {
      // Bloquear scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowModal(false);
          setTimeout(() => {
            document.body.style.overflow = 'auto';
            navigation.goBack();
          }, 300);
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'auto';
      };
    }
  }, [navigation]);

  if (!submission) {
    if (isWeb) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
            <Text style={styles.errorText}>No se encontraron datos del envío</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </div>
        </div>
      );
    }
    return (
      <ScreenWrapper bgColor={COLORS.light} safeArea={false}>
        <View style={[styles.container, styles.modalContainer]}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>No se encontraron datos del envío</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const getStatusColor = () => {
    switch (submission.status) {
      case 'PENDING':
        return '#fff3cd';
      case 'APPROVED':
        return '#d4edda';
      case 'REJECTED':
        return '#f8d7da';
      default:
        return COLORS.light;
    }
  };

  const getStatusText = () => {
    switch (submission.status) {
      case 'PENDING':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      default:
        return submission.status;
    }
  };

  // En web, renderizar como HTML nativo para evitar problemas con React Navigation modal
  if (isWeb) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid #f0f0f0',
          }}>
            <Text style={styles.title}>Detalles de la Solicitud</Text>
            <TouchableOpacity onPress={() => {
              setShowModal(false);
              setTimeout(() => navigation.goBack(), 300);
            }}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.dark} />
            </TouchableOpacity>
          </div>
          
          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.statusBadge}>
              <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.badgeText}>{getStatusText()}</Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Usuario</Text>
              <View style={styles.userInfo}>
                <MaterialCommunityIcons name="account-circle" size={48} color={COLORS.primary} />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{submission.userName}</Text>
                  <Text style={styles.userEmail}>{submission.userEmail}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Misión</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="target" size={20} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{submission.missionName}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="star" size={20} color={COLORS.warning} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Puntos</Text>
                  <Text style={styles.infoValue}>+{submission.points}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Envío</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={COLORS.info} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha de Envío</Text>
                  <Text style={styles.infoValue}>
                    {(() => {
                      const date = new Date(submission.submittedAt);
                      const day = date.getDate();
                      const month = date.toLocaleString('es-ES', { month: 'long' });
                      const year = date.getFullYear();
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${day} de ${month} de ${year} a las ${hours}:${minutes}`;
                    })()}
                  </Text>
                </View>
              </View>
              {submission.observation && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="note-text" size={20} color={COLORS.gray} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Observaciones</Text>
                    <Text style={styles.infoValue}>{submission.observation}</Text>
                  </View>
                </View>
              )}
              {submission.evidenceUrl && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.infoLabel}>
                    Evidencia {submission.metadata?.allImages ? `(${submission.metadata.allImages.length} imágenes)` : ''}
                  </Text>
                  {/* Si hay múltiples imágenes en metadata, mostrarlas todas */}
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
                    /* Si solo hay una imagen, mostrarla grande */
                    <Image source={{ uri: submission.evidenceUrl }} style={styles.evidenceImage} resizeMode="cover" />
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </div>
      </div>
    );
  }

  // En mobile, usar React Native normal
  return (
    <ScreenWrapper bgColor={COLORS.light} safeArea={false}>
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Detalles de la Solicitud</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.statusBadge}>
              <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.badgeText}>{getStatusText()}</Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Usuario</Text>
              <View style={styles.userInfo}>
                <MaterialCommunityIcons name="account-circle" size={48} color={COLORS.primary} />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{submission.userName}</Text>
                  <Text style={styles.userEmail}>{submission.userEmail}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Misión</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="target" size={20} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{submission.missionName}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="star" size={20} color={COLORS.warning} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Puntos</Text>
                  <Text style={styles.infoValue}>+{submission.points}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Envío</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={COLORS.info} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha de Envío</Text>
                  <Text style={styles.infoValue}>
                    {(() => {
                      const date = new Date(submission.submittedAt);
                      const day = date.getDate();
                      const month = date.toLocaleString('es-ES', { month: 'long' });
                      const year = date.getFullYear();
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${day} de ${month} de ${year} a las ${hours}:${minutes}`;
                    })()}
                  </Text>
                </View>
              </View>
              {submission.observation && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="note-text" size={20} color={COLORS.gray} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Observaciones</Text>
                    <Text style={styles.infoValue}>{submission.observation}</Text>
                  </View>
                </View>
              )}
              {submission.evidenceUrl && (
                <View style={styles.evidenceSection}>
                  <Text style={styles.infoLabel}>
                    Evidencia {submission.metadata?.allImages ? `(${submission.metadata.allImages.length} imágenes)` : ''}
                  </Text>
                  {/* Si hay múltiples imágenes en metadata, mostrarlas todas */}
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
                    /* Si solo hay una imagen, mostrarla grande */
                    <Image source={{ uri: submission.evidenceUrl }} style={styles.evidenceImage} resizeMode="cover" />
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
    paddingTop: SPACING.lg,
    maxHeight: '90%',
  },
  webModalContent: {
    width: '90%',
    maxWidth: 600,
    borderRadius: LAYOUT.borderRadius.lg,
    maxHeight: '90vh',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  title: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.dark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.body1,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  backButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    ...LAYOUT.shadowSmall,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  statusBadge: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  badge: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: TYPOGRAPHY.body2,
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: TYPOGRAPHY.body2,
    color: COLORS.dark,
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.light,
    marginVertical: SPACING.lg,
  },
  evidenceSection: {
    marginTop: SPACING.md,
  },
  evidenceImage: {
    width: '100%',
    height: 300,
    borderRadius: LAYOUT.borderRadius.md,
    marginTop: SPACING.md,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  evidenceImageGrid: {
    width: '48%',
    height: 200,
    borderRadius: LAYOUT.borderRadius.md,
  },
});
