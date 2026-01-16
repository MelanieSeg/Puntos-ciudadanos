import prisma from '../config/database.js';
import { AppError, NotFoundError, ValidationError, ConcurrencyError, ForbiddenError } from '../utils/errors.js';
import * as cacheService from './cache.service.js';

/**
 * Obtener transacciones de un usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Cantidad de resultados
 * @param {number} offset - Salto de resultados
 * @returns {Promise<Array>}
 */
export const getUserTransactions = async (userId, limit = 10, offset = 0) => {
  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Obtener transacciones del usuario ordenadas por fecha descendente
  const transactions = await prisma.pointTransaction.findMany({
    where: {
      wallet: {
        userId: userId,
      },
    },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      createdAt: true,
      metadata: true,
      benefitId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return transactions;
};

/**
 * Agregar puntos a un usuario
 * @param {string} userId - ID del usuario receptor
 * @param {number} points - Cantidad de puntos a agregar
 * @param {string} description - Descripción de la transacción
 * @param {string} adminId - ID del usuario que realiza la acción
 * @returns {Promise<{wallet, transaction}>}
 */
export const addPoints = async (userId, points, description, adminId) => {
  // Validaciones
  if (points <= 0) {
    throw new ValidationError('La cantidad de puntos debe ser mayor a 0');
  }

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Si el usuario no tiene wallet, crear uno
  let wallet = user.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: userId,
        balance: 0,
      },
    });
  }

  const saldoAnterior = wallet.balance;
  const saldoNuevo = saldoAnterior + points;

  // Realizar transacción atómica
  const result = await prisma.$transaction(async (tx) => {
    // Actualizar wallet con control de concurrencia usando updateMany
    const updatedCount = await tx.wallet.updateMany({
      where: {
        id: wallet.id,
        version: wallet.version, // Optimistic locking
      },
      data: {
        balance: saldoNuevo,
        version: { increment: 1 },
      },
    });

    // Si no se actualizó ningún registro, significa que la versión cambió
    if (updatedCount.count === 0) {
      throw new ConcurrencyError('El wallet fue modificado por otro proceso');
    }

    // Obtener el wallet actualizado
    const updatedWallet = await tx.wallet.findUnique({
      where: { id: wallet.id },
    });

    // Crear registro de transacción
    const transaction = await tx.pointTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'EARNED',
        amount: points,
        description: description,
        metadata: {
          saldoAnterior,
          saldoNuevo,
          asignadoPor: adminId,
        },
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  return result;
};

/**
 * Canjear beneficio por puntos
 * CONTROL DE STOCK ATÓMICO CON OPTIMISTIC CONCURRENCY
 * @param {string} userId - ID del usuario que canjea
 * @param {string} benefitId - ID del beneficio a canjear
 * @returns {Promise<{wallet, benefit, transaction}>}
 */
export const redeemBenefit = async (userId, benefitId) => {
  // 1. Obtener usuario con su wallet
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (!user.wallet) {
    throw new ValidationError('No tienes una billetera activa');
  }

  // 2. Obtener beneficio CON SU VERSIÓN ACTUAL
  const benefit = await prisma.benefit.findUnique({
    where: { id: benefitId },
  });

  if (!benefit) {
    throw new NotFoundError('Beneficio no encontrado');
  }

  if (!benefit.active) {
    throw new ValidationError('Este beneficio no está disponible');
  }

  if (benefit.stock <= 0) {
    throw new ValidationError('Este beneficio está agotado');
  }

  // 3. Validar saldo suficiente
  const wallet = user.wallet;
  if (wallet.balance < benefit.pointsCost) {
    throw new ValidationError(
      `Saldo insuficiente. Necesitas ${benefit.pointsCost} puntos, tienes ${wallet.balance}`
    );
  }

  const saldoAnterior = wallet.balance;
  const saldoNuevo = saldoAnterior - benefit.pointsCost;

  // 4. TRANSACCIÓN ATÓMICA con control de concurrencia
  try {
    const result = await prisma.$transaction(async (tx) => {
      // A) Decrementar stock del beneficio con OPTIMISTIC LOCKING
      const updatedBenefit = await tx.benefit.updateMany({
        where: {
          id: benefitId,
          version: benefit.version,
          stock: { gt: 0 },
          active: true,
        },
        data: {
          stock: { decrement: 1 },
          version: { increment: 1 },
        },
      });

      // Si updateMany retorna count: 0 significa que:
      // - La versión cambió (otro usuario lo modificó)
      // - O el stock llegó a 0
      // - O fue desactivado
      if (updatedBenefit.count === 0) {
        throw new AppError(
          'El beneficio fue agotado por otro usuario. Intenta con otro.',
          409 // Conflict
        );
      }

      // B) Actualizar wallet del usuario con su propia versión
      const walletUpdateCount = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version,
        },
        data: {
          balance: saldoNuevo,
          version: { increment: 1 },
        },
      });

      // Si no se actualizó, significa que la versión del wallet cambió
      if (walletUpdateCount.count === 0) {
        throw new ConcurrencyError('Tu saldo fue modificado. Intenta nuevamente.');
      }

      // Obtener wallet actualizado
      const updatedWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      // C) Crear canje de beneficio con QR único
      const qrCode = `QR-${userId.substring(0, 8)}-${benefitId.substring(0, 8)}-${Date.now()}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
      
      const redemption = await tx.benefitRedemption.create({
        data: {
          userId,
          benefitId: benefit.id,
          qrCode,
          expiresAt,
          status: 'PENDING',
        },
      });

      // D) Crear transacción de canje para auditoría
      const transaction = await tx.pointTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'SPENT',
          amount: benefit.pointsCost,
          description: `Canje: ${benefit.title}`,
          benefitId: benefit.id,
          metadata: {
            saldoAnterior,
            saldoNuevo,
            benefitTitle: benefit.title,
            benefitCategory: benefit.category,
            redemptionId: redemption.id,
            qrCode: qrCode,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });

      // E) Obtener beneficio actualizado para la respuesta
      const finalBenefit = await tx.benefit.findUnique({
        where: { id: benefitId },
      });

      return {
        wallet: updatedWallet,
        benefit: finalBenefit,
        transaction,
        redemption, // Incluir el canje con el QR
      };
    });

    return result;
  } catch (error) {
    // Manejo específico de errores de concurrencia
    if (error.code === 'P2025') {
      // Prisma: Record to update not found (versión desactualizada)
      throw new AppError(
        'El beneficio fue modificado por otro usuario. Intenta nuevamente.',
        409
      );
    }

    // Re-lanzar otros errores
    throw error;
  }
};

/**
 * Validar y procesar escaneo de QR por comerciante
 * @param {string} qrCode - Código QR a validar
 * @param {string} merchantId - ID del comerciante que escanea
 * @returns {Promise<{redemption, user, benefit, pointsCharged}>}
 */
export const redeemQRCode = async (qrCode, merchantId) => {
  // 1. Validar que el comerciante existe y es MERCHANT o MASTER_ADMIN
  const merchant = await prisma.user.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    throw new NotFoundError('Comerciante no encontrado');
  }

  if (merchant.role !== 'MERCHANT' && merchant.role !== 'MASTER_ADMIN') {
    throw new ValidationError('Solo comerciantes pueden validar QR');
  }

  // 2. Buscar el canje pendiente con este QR - INCLUIR BENEFIT PARA VALIDACIÓN
  const redemption = await prisma.benefitRedemption.findUnique({
    where: { qrCode },
    include: {
      user: true,
      benefit: true, // ✅ Incluir benefit para validar propiedad
    },
  });

  if (!redemption) {
    throw new NotFoundError('Código QR no válido o no encontrado');
  }

  // 3. 🔒 VALIDACIÓN CRUCIAL DE SEGURIDAD - Verificar propiedad del beneficio
  const benefit = redemption.benefit;
  
  // Solo permitir el canje si:
  // - El beneficio pertenece al comercio que escanea (benefit.merchantId === merchantId)
  // - O el usuario que escanea es MASTER_ADMIN (soporte técnico)
  if (benefit.merchantId !== merchantId && merchant.role !== 'MASTER_ADMIN') {
    throw new ForbiddenError(
      'Este beneficio no pertenece a su comercio y no puede ser canjeado aquí'
    );
  }

  // 4. Validar estado del canje
  if (redemption.status !== 'PENDING') {
    throw new ValidationError(
      `Este QR ya fue procesado. Estado: ${redemption.status}`
    );
  }

  // 5. Validar que no haya expirado
  if (new Date() > redemption.expiresAt) {
    throw new ValidationError('Este QR ha expirado');
  }

  // 6. Validar que el beneficio todavía existe y está activo
  if (!benefit.active) {
    throw new ValidationError('Este beneficio no está disponible');
  }

  // 7. Actualizar el estado del canje a REDEEMED
  const updatedRedemption = await prisma.benefitRedemption.update({
    where: { id: redemption.id },
    data: {
      status: 'REDEEMED',
      scannedByMerchantId: merchantId,
      scannedAt: new Date(),
      redeemedAt: new Date(),
    },
    include: {
      user: true,
      benefit: true,
    },
  });

  // Limpiar caché de beneficios (el stock o estado puede haber cambiado)
  cacheService.del(cacheService.CACHE_KEYS.ALL_BENEFITS);
  cacheService.del(`${cacheService.CACHE_KEYS.ALL_BENEFITS}_active`);
  console.log('[QRScan] Caché de beneficios limpiado después de escaneo de QR');

  return {
    redemption: updatedRedemption,
    user: updatedRedemption.user,
    benefit: updatedRedemption.benefit,
    pointsCharged: benefit.pointsCost,
  };
};

/**
 * Obtener historial de canjes del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>}
 */
export const getUserRedemptions = async (userId) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    return [];
  }

  const transactions = await prisma.pointTransaction.findMany({
    where: {
      walletId: wallet.id,
      type: 'SPENT',
    },
    include: {
      benefit: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return transactions;
};

/**
 * Validar QR de canje (usado por el merchant)
 * @param {string} transactionId - ID de la transacción (cupón)
 * @param {string} merchantId - ID del comercio que valida
 * @returns {Promise<{transaction, user, benefit}>}
 */
export const validateRedemption = async (transactionId, merchantId) => {
  const transaction = await prisma.pointTransaction.findUnique({
    where: { id: transactionId },
    include: {
      wallet: {
        include: {
          user: true,
        },
      },
      benefit: true,
    },
  });

  if (!transaction) {
    throw new NotFoundError('Cupón no válido o no existe');
  }

  if (transaction.type !== 'SPENT') {
    throw new ValidationError('Este QR no corresponde a un canje de beneficio');
  }

  const metadata = transaction.metadata || {};
  if (metadata.status === 'CLAIMED') {
    const claimedDate = new Date(metadata.claimedAt).toLocaleDateString('es-CL');
    throw new AppError(`Este cupón ya fue usado el ${claimedDate}`, 409);
  }

  // Obtener información del merchant
  const merchant = await prisma.user.findUnique({
    where: { id: merchantId },
    select: { name: true },
  });

  // Marcar como validado
  const updated = await prisma.pointTransaction.update({
    where: { id: transactionId },
    data: {
      metadata: {
        ...metadata,
        status: 'CLAIMED',
        claimedAt: new Date().toISOString(),
        validatedBy: merchantId,
        validatedByName: merchant?.name || 'Comercio',
      },
    },
  });

  return {
    transaction: updated,
    user: transaction.wallet.user,
    benefit: transaction.benefit,
  };
};

/**
 * Obtener detalles de un canje de QR sin procesarlo (para vista previa)
 * @param {string} qrCode - Código QR a validar
 * @param {string} merchantId - ID del comerciante que escanea
 * @returns {Promise<{redemption, user, benefit}>}
 */
export const getRedemptionDetails = async (qrCode, merchantId) => {
  // 1. Validar que el comerciante existe y es MERCHANT o MASTER_ADMIN
  const merchant = await prisma.user.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    throw new NotFoundError('Comerciante no encontrado');
  }

  if (merchant.role !== 'MERCHANT' && merchant.role !== 'MASTER_ADMIN') {
    throw new ValidationError('Solo comerciantes pueden validar QR');
  }

  // 2. Buscar el canje pendiente con este QR
  const redemption = await prisma.benefitRedemption.findUnique({
    where: { qrCode },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      benefit: true,
    },
  });

  if (!redemption) {
    throw new NotFoundError('Código QR no válido o no encontrado');
  }

  // 3. Validar propiedad del beneficio
  const benefit = redemption.benefit;
  if (benefit.merchantId !== merchantId && merchant.role !== 'MASTER_ADMIN') {
    throw new ForbiddenError(
      'Este beneficio no pertenece a su comercio'
    );
  }

  // 4. Validar estado del canje
  if (redemption.status !== 'PENDING') {
    throw new ValidationError(
      `Este QR ya fue procesado. Estado: ${redemption.status}`
    );
  }

  // 5. Validar que no haya expirado
  if (new Date() > redemption.expiresAt) {
    throw new ValidationError('Este QR ha expirado');
  }

  // 6. Validar que el beneficio todavía existe y está activo
  if (!benefit.active) {
    throw new ValidationError('Este beneficio no está disponible');
  }

  // 7. Devolver los datos para la vista previa
  return {
    redemption,
    user: redemption.user,
    benefit: redemption.benefit,
  };
};
