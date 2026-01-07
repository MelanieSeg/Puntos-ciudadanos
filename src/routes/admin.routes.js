import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/response.js';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateSecurePassword, validatePassword } from '../utils/password.js';
import * as cacheService from '../services/cache.service.js';

const router = express.Router();

/**
 * POST /api/v1/admin/benefits
 * Crear nuevo beneficio y asignarlo a un comercio
 * Solo ADMIN
 */
router.post(
  '/benefits',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  asyncHandler(async (req, res) => {
    const { title, description, pointsCost, stock, category, merchantId, imageUrl } = req.body;

    // Validaciones
    if (!title || !description || !pointsCost || !stock || !merchantId) {
      return errorResponse(res, 'Faltan campos requeridos', 400);
    }

    if (pointsCost < 0 || stock < 0) {
      return errorResponse(res, 'Los puntos y stock deben ser valores positivos', 400);
    }

    // Verificar que el merchantId corresponde a un usuario MERCHANT
    const merchant = await prisma.user.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return errorResponse(res, 'Comercio no encontrado', 404);
    }

    if (merchant.role !== 'MERCHANT') {
      return errorResponse(res, 'El usuario seleccionado no es un comercio', 400);
    }

    // Crear el beneficio
    const benefit = await prisma.benefit.create({
      data: {
        title,
        description,
        pointsCost: parseInt(pointsCost),
        stock: parseInt(stock),
        category: category || 'PRODUCT',
        merchantId,
        imageUrl: imageUrl || null,
        active: true,
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Invalidar caché de beneficios
    cacheService.delPattern('ALL_BENEFITS');

    successResponse(
      res,
      benefit,
      'Beneficio creado exitosamente',
      201
    );
  })
);

/**
 * GET /api/v1/admin/submissions
 * Obtener envíos pendientes de aprobación
 * Query params: status (PENDING, APPROVED, REJECTED)
 */
router.get(
  '/submissions',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  asyncHandler(async (req, res) => {
    const { status = 'PENDING', limit = 20, offset = 0 } = req.query;

    // Validar estado
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Estado inválido', 400);
    }

    // Convertir limit y offset a números
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    const submissions = await prisma.missionSubmission.findMany({
      where: {
        status: status,
      },
      select: {
        id: true,
        missionId: true,
        userId: true,
        evidenceUrl: true,
        observation: true,
        status: true,
        createdAt: true,
        validatedAt: true,
        mission: {
          select: {
            id: true,
            name: true,
            points: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum,
      skip: offsetNum,
    });

    successResponse(
      res,
      {
        submissions,
        total: submissions.length,
        status: status,
      },
      'Envíos obtenidos exitosamente',
      200
    );
  })
);

/**
 * POST /api/v1/admin/submissions/:submissionId/approve
 * Aprobar un envío y otorgar puntos al usuario
 */
router.post(
  '/submissions/:submissionId/approve',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { notes } = req.body;

    // Obtener el envío
    const submission = await prisma.missionSubmission.findUnique({
      where: { id: submissionId },
      include: {
        mission: true,
        user: true,
      },
    });

    if (!submission) {
      return errorResponse(res, 'Envío no encontrado', 404);
    }

    if (submission.status !== 'PENDING') {
      return errorResponse(res, 'Este envío ya fue procesado', 400);
    }

    // Actualizar estado del envío
    const updatedSubmission = await prisma.missionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        validatedAt: new Date(),
        validatedById: req.user.id,
        observation: notes || null,
      },
    });

    // Crear MissionCompletion
    await prisma.missionCompletion.create({
      data: {
        userId: submission.userId,
        missionId: submission.missionId,
        completedAt: new Date(),
      },
    });

    // Obtener el wallet del usuario
    const userWallet = await prisma.wallet.findUnique({
      where: { userId: submission.userId },
    });

    if (!userWallet) {
      return errorResponse(res, 'Wallet del usuario no encontrado', 404);
    }

    // Actualizar puntos del usuario en su wallet
    await prisma.wallet.update({
      where: { userId: submission.userId },
      data: {
        balance: {
          increment: submission.mission.points,
        },
      },
    });

    // Crear transacción en el historial
    await prisma.pointTransaction.create({
      data: {
        walletId: userWallet.id,
        type: 'EARNED',
        amount: submission.mission.points,
        description: `Misión aprobada: ${submission.mission.name}`,
        metadata: {
          submissionId: submission.id,
          missionId: submission.missionId,
          missionName: submission.mission.name,
          submittedAt: submission.createdAt.toISOString(),
          approvedAt: updatedSubmission.validatedAt.toISOString(),
          approvedBy: req.user.id,
        },
      },
    });

    // Limpiar caché de misiones del usuario (cooldown actualizado)
    const missionCacheKey = `${cacheService.CACHE_KEYS.AVAILABLE_MISSIONS}_${submission.userId}`;
    cacheService.del(missionCacheKey);
    console.log(`[Admin] Caché de misiones limpiado para usuario ${submission.userId}`);

    successResponse(
      res,
      { submission: updatedSubmission },
      'Envío aprobado y puntos otorgados',
      200
    );
  })
);

/**
 * POST /api/v1/admin/submissions/:submissionId/reject
 * Rechazar un envío
 */
router.post(
  '/submissions/:submissionId/reject',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return errorResponse(res, 'Debe proporcionar una razón del rechazo', 400);
    }

    // Obtener el envío
    const submission = await prisma.missionSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return errorResponse(res, 'Envío no encontrado', 404);
    }

    if (submission.status !== 'PENDING') {
      return errorResponse(res, 'Este envío ya fue procesado', 400);
    }

    // Actualizar estado del envío
    const updatedSubmission = await prisma.missionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        validatedAt: new Date(),
        validatedById: req.user.id,
        observation: reason,
      },
    });

    successResponse(
      res,
      { submission: updatedSubmission },
      'Envío rechazado',
      200
    );
  })
);

/**
 * GET /api/v1/admin/users
 * Obtener lista de usuarios con filtros
 * Query params: role (USER, MERCHANT, MASTER_ADMIN), status (ACTIVE, INACTIVE, BANNED)
 */
router.get(
  '/users',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  asyncHandler(async (req, res) => {
    const { role, status, limit = 20, offset = 0 } = req.query;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;

    // Convertir limit y offset a números
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true, // Agregar último login para admins
        wallet: {
          select: {
            balance: true,
          },
        },
        _count: {
          select: {
            missionSubmissions: true,
            missionCompletions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum,
      skip: offsetNum,
    });

    successResponse(
      res,
      {
        users,
        total: users.length,
      },
      'Usuarios obtenidos exitosamente',
      200
    );
  })
);

/**
 * PATCH /api/v1/admin/users/:userId/status
 * Cambiar estado de un usuario (activar/desactivar/banear)
 */
router.patch(
  '/users/:userId/status',
  authenticate,
  authorize('MASTER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    // Validar estado
    const validStatuses = ['ACTIVE', 'INACTIVE', 'BANNED'];
    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, 'Estado inválido. Debe ser ACTIVE, INACTIVE o BANNED', 400);
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Prevenir que el admin se desactive a sí mismo
    if (user.id === req.user.id && status !== 'ACTIVE') {
      return errorResponse(res, 'No puedes desactivar tu propia cuenta', 400);
    }

    // Actualizar estado
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    successResponse(
      res,
      { user: updatedUser },
      `Usuario ${status === 'ACTIVE' ? 'activado' : status === 'INACTIVE' ? 'desactivado' : 'baneado'} exitosamente`,
      200
    );
  })
);

/**
 * POST /api/v1/admin/support-admins
 * Crear un administrador de soporte (solo MASTER_ADMIN puede crear)
 */
router.post(
  '/support-admins',
  authenticate,
  authorize('MASTER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    // Validaciones
    if (!name || !email) {
      return errorResponse(res, 'Nombre y email son obligatorios', 400);
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse(res, 'Este email ya está registrado', 400);
    }

    // Generar contraseña temporal segura (12 caracteres con mayúsculas, minúsculas, números y símbolos)
    const temporaryPassword = generateSecurePassword(12);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Crear usuario con rol SUPPORT_ADMIN
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'SUPPORT_ADMIN',
        status: 'ACTIVE',
        mustChangePassword: true, // Forzar cambio de contraseña
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    successResponse(
      res,
      { admin: newAdmin, temporaryPassword },
      'Administrador de soporte creado exitosamente',
      201
    );
  })
);

/**
 * POST /api/v1/admin/merchants
 * Crear una cuenta de comercio (MASTER_ADMIN y SUPPORT_ADMIN pueden crear)
 */
router.post(
  '/merchants',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;

    // Validaciones
    if (!name || !email) {
      return errorResponse(res, 'Nombre y email son obligatorios', 400);
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse(res, 'Este email ya está registrado', 400);
    }

    // Generar contraseña temporal segura (12 caracteres con mayúsculas, minúsculas, números y símbolos)
    const temporaryPassword = generateSecurePassword(12);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Crear usuario con rol MERCHANT
    const newMerchant = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'MERCHANT',
        status: 'ACTIVE',
        mustChangePassword: true, // Forzar cambio de contraseña
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    successResponse(
      res,
      { merchant: newMerchant, temporaryPassword },
      'Cuenta de comercio creada exitosamente',
      201
    );
  })
);

export default router;
