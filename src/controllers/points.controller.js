import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as pointsService from '../services/points.service.js';
import * as cacheService from '../services/cache.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/v1/points/transactions
 * Obtener historial de transacciones del usuario autenticado
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;

  const transactions = await pointsService.getUserTransactions(userId, limit, offset);

  successResponse(
    res,
    transactions,
    'Transacciones obtenidas exitosamente',
    200
  );
});

/**
 * POST /api/v1/points/add
 * Agregar puntos a un usuario (Solo Admin)
 */
export const addPoints = asyncHandler(async (req, res) => {
  const { userId, points, description } = req.body;
  const adminId = req.user.id;

  const result = await pointsService.addPoints(
    userId,
    points,
    description,
    adminId
  );

  successResponse(
    res,
    {
      balance: result.wallet.balance,
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        amount: result.transaction.amount,
        description: result.transaction.description,
        previousBalance: result.transaction.metadata?.saldoAnterior || null,
        newBalance: result.transaction.metadata?.saldoNuevo || null,
        createdAt: result.transaction.createdAt
      }
    },
    'Puntos agregados exitosamente',
    201
  );
});

/**
 * POST /api/v1/points/redeem
 * Canjear beneficio (Usuario autenticado)
 */
export const redeemBenefit = asyncHandler(async (req, res) => {
  const { benefitId } = req.body;
  const userId = req.user.id;

  // Verificar si el sistema está en modo mantenimiento
  const systemConfig = await prisma.systemConfig.findFirst();
  if (systemConfig?.maintenanceMode) {
    return res.status(503).json({
      success: false,
      message: 'El sistema está en mantenimiento. No se pueden canjear beneficios en este momento. Por favor, intenta más tarde.',
    });
  }

  // Obtener el beneficio para verificar cooldown
  const benefit = await prisma.benefit.findUnique({
    where: { id: benefitId },
    select: { cooldownDays: true, title: true, id: true },
  });

  console.log('[Cooldown Debug] Beneficio cargado:', JSON.stringify(benefit, null, 2));

  if (!benefit) {
    return res.status(404).json({
      success: false,
      message: 'Beneficio no encontrado',
    });
  }

  console.log('[Cooldown Debug] cooldownDays valor:', benefit.cooldownDays, 'tipo:', typeof benefit.cooldownDays);
  console.log('[Cooldown Debug] Condición (cooldownDays > 0):', benefit.cooldownDays > 0);

  // Verificar cooldown si está configurado
  if (benefit.cooldownDays > 0) {
    console.log('[Cooldown Check] Beneficio:', benefit.title, 'CooldownDays:', benefit.cooldownDays);
    console.log('[Cooldown Check] Buscando redenciones para userId:', userId, 'benefitId:', benefitId);
    
    const lastRedemption = await prisma.benefitRedemption.findFirst({
      where: {
        userId,
        benefitId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    console.log('[Cooldown Check] Última redención encontrada:', lastRedemption);

    if (lastRedemption) {
      const daysSinceLastRedemption = Math.floor(
        (Date.now() - lastRedemption.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log('[Cooldown Check] Días desde última redención:', daysSinceLastRedemption);
      console.log('[Cooldown Check] Cooldown requerido:', benefit.cooldownDays);

      if (daysSinceLastRedemption < benefit.cooldownDays) {
        const daysRemaining = benefit.cooldownDays - daysSinceLastRedemption;
        console.log('[Cooldown Check] ❌ BLOQUEADO - Faltan', daysRemaining, 'días');
        return res.status(409).json({
          success: false,
          message: `Debes esperar ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} antes de canjear este beneficio nuevamente`,
          cooldownActive: true,
          daysRemaining,
        });
      }
      console.log('[Cooldown Check] ✅ PERMITIDO - Cooldown expirado');
    } else {
      console.log('[Cooldown Check] ✅ PERMITIDO - Primera redención');
    }
  }

  const result = await pointsService.redeemBenefit(userId, benefitId);

  // Limpiar caché de beneficios cuando se canjea (el stock cambia)
  cacheService.del(cacheService.CACHE_KEYS.ALL_BENEFITS);
  cacheService.del(`${cacheService.CACHE_KEYS.ALL_BENEFITS}_active`);
  console.log('[Redeem] Caché de beneficios limpiado después de canje exitoso');

  successResponse(
    res,
    {
      message: 'Beneficio canjeado exitosamente',
      balance: result.wallet.balance,
      benefit: {
        id: result.benefit.id,
        name: result.benefit.title,
        pointsCost: result.benefit.pointsCost,
        remainingStock: result.benefit.stock
      },
      redemption: {
        id: result.redemption.id,
        qrCode: result.redemption.qrCode,
        status: result.redemption.status,
        expiresAt: result.redemption.expiresAt,
      },
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        amount: result.transaction.amount,
        description: result.transaction.description,
        createdAt: result.transaction.createdAt
      },
      instructions: 'Muestra el código QR al comercio para canjear tu beneficio'
    },
    'Beneficio canjeado exitosamente. Muestra el QR al comercio',
    200
  );
});
