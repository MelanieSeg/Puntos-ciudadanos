import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/response.js';
import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateSecurePassword, validatePassword } from '../utils/password.js';
import * as cacheService from '../services/cache.service.js';
import upload from '../middlewares/upload.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import { sendVerificationEmail } from '../services/email.service.js';
import config from '../config/index.js';
import { getGlobalStats } from '../controllers/stats.controller.js';
import { getAuditLogs, updateUserStatus } from '../controllers/audit.controller.js';

const router = express.Router();

/**
 * GET /api/v1/admin/stats
 * Obtener estadísticas globales del sistema
 * Solo ADMIN
 */
router.get('/stats', authenticate, authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'), getGlobalStats);

/**
 * GET /api/v1/admin/audit-logs
 * Obtener logs de auditoría con información del administrador
 * Solo MASTER_ADMIN
 */
router.get('/audit-logs', authenticate, authorize('MASTER_ADMIN'), getAuditLogs);

/**
 * PATCH /api/v1/admin/users/:id/status
 * Cambiar el estado de un usuario (suspender/activar)
 * Solo MASTER_ADMIN
 */
router.patch('/users/:id/status', authenticate, authorize('MASTER_ADMIN'), updateUserStatus);

/**
 * Helper: Subir imagen a Cloudinary desde buffer
 */
const uploadToCloudinary = (buffer, folder = 'benefits') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

/**
 * POST /api/v1/admin/benefits
 * Crear nuevo beneficio y asignarlo a un comercio
 * Solo ADMIN
 * Acepta multipart/form-data con imagen opcional
 */
router.post(
  '/benefits',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  upload.single('image'), // Middleware de multer para procesar la imagen
  asyncHandler(async (req, res) => {
    const { title, description, pointsCost, stock, category, merchantId } = req.body;

    // Debug: verificar si llega la imagen
    console.log('📦 req.file:', req.file ? 'Sí hay archivo' : 'No hay archivo');
    console.log('📝 req.body:', Object.keys(req.body));

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

    // Subir imagen a Cloudinary si se proporcionó
    let imageUrl = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'puntos-ciudadanos/benefits');
        imageUrl = result.secure_url;
        console.log('✅ Imagen subida a Cloudinary:', imageUrl);
      } catch (error) {
        console.error('❌ Error subiendo imagen a Cloudinary:', error);
        return errorResponse(res, 'Error al subir la imagen', 500);
      }
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
        imageUrl,
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
    cacheService.delPattern('all_benefits');

    // Registrar acción en AdminLog
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'BENEFIT_CREATED',
        targetId: benefit.id,
        description: `Beneficio "${benefit.title}" creado para ${benefit.merchant.name}`,
        metadata: {
          benefitId: benefit.id,
          benefitTitle: benefit.title,
          pointsCost: benefit.pointsCost,
          stock: benefit.stock,
          merchantId: benefit.merchantId,
          merchantName: benefit.merchant.name,
          category: benefit.category,
          hasImage: !!imageUrl,
          timestamp: new Date().toISOString(),
        },
      },
    });

    successResponse(
      res,
      benefit,
      'Beneficio creado exitosamente',
      201
    );
  })
);

/**
 * DELETE /api/v1/admin/benefits/:id
 * Eliminar un beneficio
 * Solo ADMIN
 */
router.delete(
  '/benefits/:id',
  authenticate,
  authorize('MASTER_ADMIN', 'SUPPORT_ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que el beneficio existe
    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!benefit) {
      return errorResponse(res, 'Beneficio no encontrado', 404);
    }

    // Eliminar el beneficio
    await prisma.benefit.delete({
      where: { id },
    });

    // Invalidar caché
    cacheService.delPattern('all_benefits');

    // Registrar acción en AdminLog
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'BENEFIT_DELETED',
        targetId: id,
        description: `Beneficio "${benefit.title}" eliminado de ${benefit.merchant.name}`,
        metadata: {
          benefitId: benefit.id,
          benefitTitle: benefit.title,
          pointsCost: benefit.pointsCost,
          stock: benefit.stock,
          merchantId: benefit.merchantId,
          merchantName: benefit.merchant.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    successResponse(
      res,
      null,
      'Beneficio eliminado exitosamente'
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

    // Registrar acción en AdminLog para auditoría
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'SUBMISSION_APPROVED',
        targetId: submissionId,
        description: `Misión "${submission.mission.name}" aprobada para ${submission.user.name} (${submission.user.email})`,
        metadata: {
          submissionId: submission.id,
          userId: submission.userId,
          userName: submission.user.name,
          userEmail: submission.user.email,
          missionId: submission.missionId,
          missionName: submission.mission.name,
          pointsAwarded: submission.mission.points,
          notes: notes || null,
          timestamp: new Date().toISOString(),
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
      include: {
        user: true,
        mission: true,
      },
    });

    // Registrar acción en AdminLog para auditoría
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'SUBMISSION_REJECTED',
        targetId: submissionId,
        description: `Misión "${updatedSubmission.mission.name}" rechazada para ${updatedSubmission.user.name} (${updatedSubmission.user.email})`,
        metadata: {
          submissionId: updatedSubmission.id,
          userId: updatedSubmission.userId,
          userName: updatedSubmission.user.name,
          userEmail: updatedSubmission.user.email,
          missionId: updatedSubmission.missionId,
          missionName: updatedSubmission.mission.name,
          reason: reason,
          timestamp: new Date().toISOString(),
        },
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

    // Enviar correo de verificación
    try {
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${config.port}`;
      await sendVerificationEmail(newAdmin, baseUrl);
    } catch (emailError) {
      console.error('Error al enviar email de verificación a admin:', emailError);
    }

    // Registrar acción en AdminLog
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'USER_CREATED',
        targetId: newAdmin.id,
        description: `Administrador de soporte "${newAdmin.name}" creado`,
        metadata: {
          userId: newAdmin.id,
          userName: newAdmin.name,
          userEmail: newAdmin.email,
          userRole: 'SUPPORT_ADMIN',
          timestamp: new Date().toISOString(),
        },
      },
    });

    successResponse(
      res,
      { admin: newAdmin, temporaryPassword },
      'Administrador de soporte creado exitosamente. Se ha enviado un email de verificación.',
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

    // Enviar correo de verificación
    try {
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${config.port}`;
      await sendVerificationEmail(newMerchant, baseUrl);
    } catch (emailError) {
      console.error('Error al enviar email de verificación a comerciante:', emailError);
    }

    // Registrar acción en AdminLog
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: 'USER_CREATED',
        targetId: newMerchant.id,
        description: `Comerciante "${newMerchant.name}" creado`,
        metadata: {
          userId: newMerchant.id,
          userName: newMerchant.name,
          userEmail: newMerchant.email,
          userRole: 'MERCHANT',
          timestamp: new Date().toISOString(),
        },
      },
    });

    successResponse(
      res,
      { merchant: newMerchant, temporaryPassword },
      'Cuenta de comercio creada exitosamente. Se ha enviado un email de verificación.',
      201
    );
  })
);

export default router;
