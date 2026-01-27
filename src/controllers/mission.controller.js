import prisma from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/v1/missions
 * Obtener todas las misiones disponibles
 */
export const getAvailableMissions = asyncHandler(async (req, res) => {
  const userId = req.user?.id; // Usuario autenticado (puede ser undefined si no está autenticado)

  const missions = await prisma.mission.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      points: true,
      frequency: true,
      cooldownDays: true,
      evidenceType: true,
      category: true,
      active: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Si hay un usuario autenticado, calcular cooldownUntil para cada misión
  let missionsWithCooldown = missions;
  if (userId) {
    missionsWithCooldown = await Promise.all(
      missions.map(async (mission) => {
        // Buscar la última completación de esta misión por este usuario
        const lastCompletion = await prisma.missionCompletion.findFirst({
          where: {
            userId,
            missionId: mission.id,
          },
          orderBy: {
            completedAt: 'desc',
          },
        });

        let cooldownUntil = null;
        
        // Si la misión es ONCE y ya fue completada, bloquearla permanentemente
        if (lastCompletion && mission.frequency === 'ONCE') {
          cooldownUntil = '9999-12-31T23:59:59.999Z'; // Fecha muy futura = bloqueada permanentemente
        } else if (lastCompletion && mission.cooldownDays > 0) {
          // Para otras frecuencias, calcular la fecha hasta la cual está en cooldown
          const completionDate = new Date(lastCompletion.completedAt);
          const cooldownEndDate = new Date(completionDate);
          cooldownEndDate.setDate(cooldownEndDate.getDate() + mission.cooldownDays);
          
          // Solo incluir cooldownUntil si está en el futuro
          if (cooldownEndDate > new Date()) {
            cooldownUntil = cooldownEndDate.toISOString();
          }
        }

        return {
          ...mission,
          cooldownUntil,
        };
      })
    );
  }

  successResponse(
    res,
    {
      missions: missionsWithCooldown,
      total: missionsWithCooldown.length,
    },
    'Misiones obtenidas exitosamente',
    200
  );
});

/**
 * GET /api/v1/missions/:id
 * Obtener detalles de una misión específica
 */
export const getMissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mission = await prisma.mission.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      points: true,
      frequency: true,
      cooldownDays: true,
      evidenceType: true,
      requirements: true,
      active: true,
      createdAt: true,
    },
  });

  if (!mission) {
    return errorResponse(res, 'Misión no encontrada', 404);
  }

  successResponse(
    res,
    { mission },
    'Misión obtenida exitosamente',
    200
  );
});

/**
 * POST /api/v1/admin/missions
 * Crear una nueva misión (Solo Admin)
 */
export const createMission = asyncHandler(async (req, res) => {
  const { name, description, points, frequency, cooldownDays, evidenceType, expiresAt, category } = req.body;

  // Validar campos obligatorios
  if (!name || !description || !points || !frequency) {
    return errorResponse(res, 'Faltan campos obligatorios: name, description, points, frequency', 400);
  }

  // Validar que los puntos sean positivos
  if (points <= 0) {
    return errorResponse(res, 'Los puntos deben ser un valor positivo', 400);
  }

  // Validar que el nombre no exista
  const existingMission = await prisma.mission.findUnique({
    where: { name },
  });

  if (existingMission) {
    return errorResponse(res, 'Ya existe una misión con ese nombre', 400);
  }

  // Validar frecuencia
  const validFrequencies = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ELECTION_PERIOD'];
  if (!validFrequencies.includes(frequency)) {
    return errorResponse(res, `Frecuencia inválida. Debe ser una de: ${validFrequencies.join(', ')}`, 400);
  }

  // Validar tipo de evidencia
  const validEvidenceTypes = ['PHOTO', 'DOCUMENT', 'CERTIFICATE', 'RECEIPT'];
  if (evidenceType && !validEvidenceTypes.includes(evidenceType)) {
    return errorResponse(res, `Tipo de evidencia inválido. Debe ser una de: ${validEvidenceTypes.join(', ')}`, 400);
  }

  // Validar categoría
  const validCategories = ['VOTING', 'ENVIRONMENT', 'COMMUNITY', 'VOLUNTEERING', 'EDUCATION', 'DONATION', 'REPORTING', 'EVENT', 'OTHER'];
  if (category && !validCategories.includes(category)) {
    return errorResponse(res, `Categoría inválida. Debe ser una de: ${validCategories.join(', ')}`, 400);
  }

  // Mapear frequency a cooldownDays automáticamente si no se proporciona
  let finalCooldownDays = cooldownDays ? parseInt(cooldownDays) : null;
  
  if (finalCooldownDays === null) {
    const cooldownMap = {
      ONCE: 0,
      DAILY: 1,
      WEEKLY: 7,
      MONTHLY: 30,
      QUARTERLY: 90,
      YEARLY: 365,
      ELECTION_PERIOD: 1460, // ~4 años
    };
    finalCooldownDays = cooldownMap[frequency] || 0;
  }

  // Crear misión
  const newMission = await prisma.mission.create({
    data: {
      name,
      description,
      points: parseInt(points),
      frequency,
      cooldownDays: finalCooldownDays,
      evidenceType: evidenceType || 'PHOTO',
      category: category || 'OTHER',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: true,
    },
  });

  // Registrar en AdminLog
  await prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: 'MISSION_CREATED',
      targetId: newMission.id,
      description: `Misión "${newMission.name}" creada`,
      metadata: {
        missionId: newMission.id,
        missionName: newMission.name,
        points: newMission.points,
        frequency: newMission.frequency,
        timestamp: new Date().toISOString(),
      },
    },
  });

  successResponse(
    res,
    { mission: newMission },
    'Misión creada exitosamente',
    201
  );
});

/**
 * GET /api/v1/admin/missions
 * Listar todas las misiones para el administrador (incluye borrado lógico para auditoría)
 */
export const getAllMissionsAdmin = asyncHandler(async (req, res) => {
  const { status, includeInactive } = req.query;

  const whereClause = {};
  
  // Filtrar por estado si se proporciona
  if (status === 'active') {
    whereClause.active = true;
  } else if (status === 'inactive') {
    whereClause.active = false;
  }
  // Si no se especifica, se muestran todas (incluidas las inactivas)

  const missions = await prisma.mission.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          submissions: true,
          completions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedMissions = missions.map(mission => ({
    id: mission.id,
    name: mission.name,
    description: mission.description,
    points: mission.points,
    frequency: mission.frequency,
    cooldownDays: mission.cooldownDays,
    evidenceType: mission.evidenceType,
    category: mission.category,
    active: mission.active,
    expiresAt: mission.expiresAt,
    requirements: mission.requirements,
    totalSubmissions: mission._count.submissions,
    totalCompletions: mission._count.completions,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
  }));

  successResponse(
    res,
    {
      missions: formattedMissions,
      total: formattedMissions.length,
    },
    'Misiones obtenidas exitosamente',
    200
  );
});

/**
 * PUT /api/v1/admin/missions/:id
 * Actualizar una misión completa
 */
export const updateMission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, points, frequency, evidenceType, category, expiresAt } = req.body;

  // Verificar que la misión existe
  const mission = await prisma.mission.findUnique({
    where: { id },
  });

  if (!mission) {
    return errorResponse(res, 'Misión no encontrada', 404);
  }

  // Validaciones básicas
  if (name && name.trim().length === 0) {
    return errorResponse(res, 'El nombre no puede estar vacío', 400);
  }
  if (points && (points <= 0 || !Number.isInteger(points))) {
    return errorResponse(res, 'Los puntos deben ser un número entero positivo', 400);
  }
  if (expiresAt && new Date(expiresAt) <= new Date()) {
    return errorResponse(res, 'La fecha de expiración debe ser futura', 400);
  }

  // Preparar datos de actualización (solo los campos proporcionados)
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (points !== undefined) updateData.points = points;
  if (frequency !== undefined) updateData.frequency = frequency;
  if (evidenceType !== undefined) updateData.evidenceType = evidenceType;
  if (category !== undefined) updateData.category = category;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

  // Actualizar cooldownDays según frecuencia
  if (frequency) {
    const cooldownMap = {
      DAILY: 1,
      WEEKLY: 7,
      MONTHLY: 30,
      QUARTERLY: 90,
      YEARLY: 365,
      ELECTION_PERIOD: 1460, // ~4 años
    };
    updateData.cooldownDays = cooldownMap[frequency] || 0;
  }

  // Actualizar misión
  const updatedMission = await prisma.mission.update({
    where: { id },
    data: updateData,
  });

  // Registrar en AdminLog
  await prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: 'MISSION_UPDATED',
      targetId: updatedMission.id,
      description: `Misión "${updatedMission.name}" actualizada`,
      metadata: {
        missionId: updatedMission.id,
        missionName: updatedMission.name,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      },
    },
  });

  successResponse(
    res,
    { mission: updatedMission },
    'Misión actualizada exitosamente',
    200
  );
});

/**
 * PATCH /api/v1/admin/missions/:id/status
 * Cambiar el estado de una misión (activa/inactiva)
 */
export const updateMissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  // Validar que active sea booleano
  if (typeof active !== 'boolean') {
    return errorResponse(res, 'El campo "active" debe ser true o false', 400);
  }

  // Verificar que la misión existe
  const mission = await prisma.mission.findUnique({
    where: { id },
  });

  if (!mission) {
    return errorResponse(res, 'Misión no encontrada', 404);
  }

  // Actualizar estado
  const updatedMission = await prisma.mission.update({
    where: { id },
    data: { active },
  });

  // Registrar en AdminLog
  await prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: 'MISSION_STATUS_UPDATED',
      targetId: updatedMission.id,
      description: `Misión "${updatedMission.name}" ${active ? 'activada' : 'desactivada'}`,
      metadata: {
        missionId: updatedMission.id,
        missionName: updatedMission.name,
        newStatus: active ? 'ACTIVE' : 'INACTIVE',
        timestamp: new Date().toISOString(),
      },
    },
  });

  successResponse(
    res,
    { mission: updatedMission },
    `Misión ${active ? 'activada' : 'desactivada'} exitosamente`,
    200
  );
});

/**
 * DELETE /api/v1/admin/missions/:id
 * Borrado lógico de una misión (cambia active a false)
 */
export const deleteMission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar que la misión existe
  const mission = await prisma.mission.findUnique({
    where: { id },
  });

  if (!mission) {
    return errorResponse(res, 'Misión no encontrada', 404);
  }

  if (!mission.active) {
    return errorResponse(res, 'La misión ya está desactivada', 400);
  }

  // Borrado lógico: cambiar active a false
  const deletedMission = await prisma.mission.update({
    where: { id },
    data: { 
      active: false,
    },
  });

  // Registrar en AdminLog
  await prisma.adminLog.create({
    data: {
      adminId: req.user.id,
      action: 'MISSION_DELETED',
      targetId: deletedMission.id,
      description: `Misión "${deletedMission.name}" eliminada (borrado lógico)`,
      metadata: {
        missionId: deletedMission.id,
        missionName: deletedMission.name,
        timestamp: new Date().toISOString(),
      },
    },
  });

  successResponse(
    res,
    { mission: deletedMission },
    'Misión eliminada exitosamente',
    200
  );
});
