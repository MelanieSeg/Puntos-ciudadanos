import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as pointsService from '../services/points.service.js';
import prisma from '../config/database.js';
import * as cacheService from '../services/cache.service.js';

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
 * GET /api/v1/merchant/stats
 * Estadísticas del comercio (QRs validados, etc)
 */
export const getStats = asyncHandler(async (req, res) => {
  // Contar QRs validados por este comercio
  const validatedCount = await prisma.benefitRedemption.count({
    where: {
      scannedByMerchantId: req.user.id,
      status: 'REDEEMED'
    }
  });

  // Obtener detalles de los canjes para sumar puntos
  const redemptions = await prisma.benefitRedemption.findMany({
    where: {
      scannedByMerchantId: req.user.id,
      status: 'REDEEMED'
    },
    include: {
      benefit: {
        select: { pointsCost: true }
      }
    }
  });

  const totalPuntos = redemptions.reduce((sum, r) => sum + (r.benefit?.pointsCost || 0), 0);

  // 1. Obtener Actividad Reciente (Últimos 5 canjes)
  const recentRedemptions = await prisma.benefitRedemption.findMany({
    where: {
      scannedByMerchantId: req.user.id,
      status: 'REDEEMED'
    },
    take: 5,
    orderBy: { redeemedAt: 'desc' },
    include: {
      user: { select: { name: true } },
      benefit: { select: { title: true } }
    }
  });

  const recentActivity = recentRedemptions.map(r => ({
    id: r.id,
    cliente: r.user?.name || 'Usuario',
    producto: r.benefit?.title || 'Beneficio',
    hora: new Date(r.redeemedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  }));

  // 2. Obtener Top Beneficios (Agrupados por cantidad)
  const topBenefitsGroup = await prisma.benefitRedemption.groupBy({
    by: ['benefitId'],
    where: {
      scannedByMerchantId: req.user.id,
      status: 'REDEEMED'
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 3
  });

  const topBenefits = await Promise.all(topBenefitsGroup.map(async (group) => {
    if (!group.benefitId) return null;
    const benefit = await prisma.benefit.findUnique({
      where: { id: group.benefitId },
      select: { title: true }
    });
    return {
      id: group.benefitId,
      name: benefit?.title || 'Desconocido',
      count: group._count.id,
      trend: 'up'
    };
  }));

  successResponse(res, {
    comercio: req.user.name,
    qrsValidados: validatedCount,
    totalPuntosCanjeados: totalPuntos,
    recentActivity,
    topBenefits: topBenefits.filter(Boolean) // Filtrar nulos
  }, 'Estadísticas del comercio');
});

/**
 * GET /api/v1/merchant/history
 * Historial de validaciones del comercio
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  // Validación robusta para evitar NaN si el cliente móvil envía "undefined" o strings vacíos
  let limitNum = parseInt(limit, 10);
  let offsetNum = parseInt(offset, 10);
  if (isNaN(limitNum) || limitNum <= 0) limitNum = 20;
  if (isNaN(offsetNum) || offsetNum < 0) offsetNum = 0;

  const redemptions = await prisma.benefitRedemption.findMany({
    where: {
      scannedByMerchantId: req.user.id,
      status: 'REDEEMED'
    },
    include: {
      benefit: { select: { title: true, pointsCost: true } },
      user: { select: { id: true, email: true, name: true } }
    },
    orderBy: { redeemedAt: 'desc' },
    take: limitNum,
    skip: offsetNum
  });

  const total = await prisma.benefitRedemption.count({
    where: {
      scannedByMerchantId: req.user.id,
      status: 'REDEEMED'
    }
  });

  successResponse(res, {
    redemptions,
    total,
    limit: limitNum,
    offset: offsetNum
  }, 'Historial de validaciones');
});

/**
 * GET /api/v1/merchant/benefits
 * Obtener beneficios del comercio
 */
export const getMyBenefits = asyncHandler(async (req, res) => {
  const benefits = await prisma.benefit.findMany({
    where: { merchantId: req.user.id },
    include: {
      _count: {
        select: {
          redemptions: { where: { status: 'REDEEMED' } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedBenefits = benefits.map(benefit => ({
    id: benefit.id,
    name: benefit.title,
    description: benefit.description,
    pointsCost: benefit.pointsCost,
    stock: benefit.stock,
    isActive: benefit.active,
    category: benefit.category || 'PRODUCT',
    redeemedCount: benefit._count.redemptions,
    createdAt: benefit.createdAt,
    updatedAt: benefit.updatedAt
  }));

  successResponse(res, formattedBenefits, 'Beneficios del comercio');
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
      merchantProfile: true,
    },
  });

  const data = merchants.map((m) => ({
    id: m.id,
    name: m.merchantProfile?.storeName || m.name,
    category: 'Comercio Asociado',
    merchantProfile: m.merchantProfile,
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
