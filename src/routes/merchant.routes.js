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
