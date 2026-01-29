import prisma from '../config/database.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * GET /api/v1/admin/audit-logs
 * Obtener logs de auditoría con información del administrador
 * Solo MASTER_ADMIN
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, adminId, startDate, endDate } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Construcción de filtros dinámicos
  const where = {};

  if (action) {
    where.action = action;
  }

  if (adminId) {
    where.adminId = adminId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Consulta con paginación
  const [logs, totalCount] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.adminLog.count({ where }),
  ]);

  return successResponse(res, {
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Cambiar el estado de un usuario (suspender/activar)
 * Solo MASTER_ADMIN
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  console.log('🔍 updateUserStatus - Datos recibidos:', { 
    userId: id, 
    status, 
    statusType: typeof status,
    reason,
    body: req.body 
  });

  // Validaciones
  if (!status) {
    throw new ValidationError('El campo status es requerido');
  }

  const validStatuses = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`);
  }

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Prevenir que un admin se suspenda a sí mismo
  if (req.user.id === id && status === 'SUSPENDED') {
    throw new ValidationError('No puedes suspenderte a ti mismo');
  }

  // Actualizar estado
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  // Registrar acción en AdminLog
  await prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: `USER_STATUS_CHANGED`,
      targetId: id,
      description: `Estado de usuario cambiado a ${status}`,
      metadata: {
        previousStatus: user.status,
        newStatus: status,
        reason: reason || 'No especificado',
        targetUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    },
  });

  return successResponse(res, {
    message: `Usuario ${status === 'SUSPENDED' ? 'suspendido' : 'actualizado'} exitosamente`,
    user: updatedUser,
  });
});
