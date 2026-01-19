import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as pointsService from '../services/points.service.js';
import prisma from '../config/database.js';

/**
 * POST /api/v1/merchant/redeem
 * Validar y procesar escaneo de QR para canje de beneficio
 * Solo accesible para comerciantes (MERCHANT role)
 */
export const redeemQRCode = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  const merchantId = req.user.id;

  if (!qrCode || typeof qrCode !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Código QR inválido o no proporcionado'
    });
  }

  // Procesar el escaneo del QR
  const result = await pointsService.redeemQRCode(qrCode, merchantId);

  successResponse(
    res,
    {
      redemption: {
        id: result.redemption.id,
        qrCode: result.redemption.qrCode,
        status: result.redemption.status,
        scannedAt: result.redemption.scannedAt,
      },
      benefit: {
        id: result.benefit.id,
        title: result.benefit.title,
        description: result.benefit.description,
        pointsCost: result.benefit.pointsCost,
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      pointsCharged: result.pointsCharged,
    },
    'QR validado y canje procesado exitosamente',
    200
  );
});

/**
 * GET /api/v1/merchant/associates
 * Obtener lista de comercios asociados
 */
export const getAssociates = asyncHandler(async (req, res) => {
  const merchants = await prisma.user.findMany({
    where: {
      role: 'MERCHANT',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const data = merchants.map((m) => ({
    id: m.id,
    name: m.name,
    category: 'Comercio Asociado',
  }));

  successResponse(res, data, 'Comercios asociados obtenidos');
});

/**
 * POST /api/v1/merchant/redeem/preview
 * Obtiene los detalles de un QR para mostrar una vista previa antes de canjear.
 */
export const getRedemptionPreview = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  const merchantId = req.user.id;

  if (!qrCode || typeof qrCode !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Código QR inválido o no proporcionado',
    });
  }

  const result = await pointsService.getRedemptionDetails(qrCode, merchantId);

  successResponse(
    res,
    {
      benefit: {
        id: result.benefit.id,
        title: result.benefit.title,
        description: result.benefit.description,
        pointsCost: result.benefit.pointsCost,
      },
      user: {
        id: result.user.id,
        name: result.user.name,
      },
    },
    'Detalles del cupón obtenidos para vista previa',
    200
  );
});
