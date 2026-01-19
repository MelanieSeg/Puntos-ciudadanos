import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { isMerchantOrAdmin } from '../middlewares/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as merchantController from '../controllers/merchant.controller.js';
import prisma from '../config/database.js';
import * as cacheService from '../services/cache.service.js';

const router = Router();

/**
 * GET /api/v1/merchant/associates
 * Obtener lista de comercios asociados
 * Accesible para cualquier usuario autenticado
 */
router.get(
  '/associates',
  authenticate,
  merchantController.getAssociates
);

/**
 * POST /api/v1/merchant/redeem
 * El comercio escanea el QR del cliente y procesa el canje
 * Solo comercios y admins
 */
router.post(
  '/redeem',
  authenticate,
  isMerchantOrAdmin,
  merchantController.redeemQRCode
);

/**
 * POST /api/v1/merchant/redeem/preview
 * El comercio escanea el QR y obtiene detalles ANTES de confirmar el canje
 * Solo comercios y admins
 */
router.post(
  '/redeem/preview',
  authenticate,
  isMerchantOrAdmin,
  merchantController.getRedemptionPreview
);

/**
 * POST /api/v1/merchant/validate-qr
 * Validar QR de beneficio
 */
router.post(
  '/validate-qr',
  authenticate,
  isMerchantOrAdmin,
  merchantController.redeemQRCode
);

/**
 * GET /api/v1/merchant/stats
 * Estadísticas del comercio (QRs validados, etc)
 */
router.get(
  '/stats',
  authenticate,
  isMerchantOrAdmin,
  merchantController.getStats
);

/**
 * GET /api/v1/merchant/history
 * Historial de validaciones del comercio
 */
router.get(
  '/history',
  authenticate,
  isMerchantOrAdmin,
  merchantController.getHistory
);

/**
 * PATCH /api/v1/merchant/benefits/:id/stock
 * Actualizar stock de un beneficio
 * Solo el comercio dueño del beneficio puede actualizarlo
 */
router.patch(
  '/benefits/:id/stock',
  authenticate,
  isMerchantOrAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad inválida',
        });
      }

      // Verificar que el beneficio existe y pertenece al comercio
      const benefit = await prisma.benefit.findUnique({
        where: { id },
      });

      if (!benefit) {
        return res.status(404).json({
          success: false,
          message: 'Beneficio no encontrado',
        });
      }

      if (benefit.merchantId !== req.user.id && req.user.role !== 'MASTER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar este beneficio',
        });
      }

      // Actualizar stock
      const updatedBenefit = await prisma.benefit.update({
        where: { id },
        data: {
          stock: {
            increment: parseInt(amount),
          },
        },
      });

      // Invalidar caché
      await cacheService.delPattern('ALL_BENEFITS');

      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: updatedBenefit,
      });
    } catch (error) {
      console.error('Error actualizando stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar stock',
      });
    }
  }
);

/**
 * GET /api/v1/merchant/benefits
 * Obtener beneficios del comercio con stock y estadísticas
 */
router.get(
  '/benefits',
  authenticate,
  isMerchantOrAdmin,
  merchantController.getMyBenefits
);

export default router;
