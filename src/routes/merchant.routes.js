import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { isMerchantOrAdmin } from '../middlewares/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as merchantController from '../controllers/merchant.controller.js';
import prisma from '../config/database.js';

const router = Router();

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
  async (req, res) => {
    try {
      // Contar QRs validados por este comercio
      const validatedCount = await prisma.benefitRedemption.count({
        where: {
          scannedByMerchantId: req.user.id,
          status: 'REDEEMED'
        }
      });

      // Obtener detalles de los canjes
      const redemptions = await prisma.benefitRedemption.findMany({
        where: {
          scannedByMerchantId: req.user.id,
          status: 'REDEEMED'
        },
        include: {
          benefit: {
            select: {
              pointsCost: true
            }
          }
        }
      });

      const totalPuntos = redemptions.reduce((sum, r) => sum + r.benefit.pointsCost, 0);

      res.json({
        success: true,
        message: 'Estadísticas del comercio',
        data: {
          comercio: req.user.name,
          qrsValidados: validatedCount,
          totalPuntosCanjeados: totalPuntos
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener estadísticas' 
      });
    }
  }
);

/**
 * GET /api/v1/merchant/history
 * Historial de validaciones del comercio
 */
router.get(
  '/history',
  authenticate,
  isMerchantOrAdmin,
  async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;

      // Convertir limit y offset a números
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const redemptions = await prisma.benefitRedemption.findMany({
        where: {
          scannedByMerchantId: req.user.id,
          status: 'REDEEMED'
        },
        include: {
          benefit: {
            select: {
              title: true,
              pointsCost: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          redeemedAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      const total = await prisma.benefitRedemption.count({
        where: {
          scannedByMerchantId: req.user.id,
          status: 'REDEEMED'
        }
      });

      res.json({
        success: true,
        message: 'Historial de validaciones',
        data: {
          redemptions,
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener historial' 
      });
    }
  }
);

export default router;
