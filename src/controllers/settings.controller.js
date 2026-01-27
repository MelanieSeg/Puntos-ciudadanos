import prisma from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

/**
 * GET /admin/settings
 * Obtiene la configuración del sistema (singleton)
 * Si no existe, crea la fila por defecto
 */
export const getSettings = asyncHandler(async (req, res) => {
  let config = await prisma.systemConfig.findFirst();
  
  if (!config) {
    // Crear configuración por defecto si no existe
    config = await prisma.systemConfig.create({
      data: {
        id: 1,
        maintenanceMode: false,
        homeBannerMessage: null,
      },
    });
  }
  
  successResponse(res, { settings: config }, 'Configuración obtenida exitosamente');
});

/**
 * GET /config (público)
 * Obtiene configuración pública del sistema sin autenticación
 * Para mostrar mensajes de bienvenida y verificar modo mantenimiento
 */
export const getPublicConfig = asyncHandler(async (req, res) => {
  let config = await prisma.systemConfig.findFirst({
    select: {
      maintenanceMode: true,
      homeBannerMessage: true,
    },
  });
  
  if (!config) {
    config = { maintenanceMode: false, homeBannerMessage: null };
  }
  
  successResponse(res, { config }, 'Configuración pública obtenida');
});

/**
 * PATCH /admin/settings
 * Actualiza la configuración del sistema
 * Validaciones:
 * - maintenanceMode: debe ser boolean
 * - homeBannerMessage: string opcional
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const { maintenanceMode, homeBannerMessage } = req.body;
  
  const updateData = {};
  
  // Validación maintenanceMode
  if (maintenanceMode !== undefined) {
    if (typeof maintenanceMode !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'maintenanceMode debe ser un valor booleano',
      });
    }
    updateData.maintenanceMode = maintenanceMode;
  }
  
  // Validación homeBannerMessage
  if (homeBannerMessage !== undefined) {
    if (homeBannerMessage !== null && typeof homeBannerMessage !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'homeBannerMessage debe ser un texto o null',
      });
    }
    updateData.homeBannerMessage = homeBannerMessage;
  }
  
  // Actualizar usando upsert para asegurar que siempre exista la fila con id=1
  const config = await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: updateData,
    create: {
      id: 1,
      maintenanceMode: maintenanceMode ?? false,
      homeBannerMessage: homeBannerMessage ?? null,
    },
  });
  
  // Registrar la acción en AdminLog
  await prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: 'UPDATE_SYSTEM_CONFIG',
      targetId: '1',
      description: `Actualizó configuración del sistema`,
      metadata: {
        changes: updateData,
      },
    },
  });
  
  successResponse(res, { settings: config }, 'Configuración actualizada exitosamente');
});
