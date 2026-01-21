import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createSubmission(data) {
  try {
    const { userId, missionId, evidenceUrl, description, metadata } = data;

    // Validar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Validar que la misión existe y está activa
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      throw new Error('Misión no encontrada');
    }

    if (!mission.active) {
      throw new Error('Misión no disponible');
    }

    // Validar que el usuario no tiene una sumisión PENDIENTE para esta misión
    // (APPROVED está bien porque la lógica de cooldown la maneja)
    const pendingSubmission = await prisma.missionSubmission.findFirst({
      where: {
        userId,
        missionId,
        status: 'PENDING',
      },
    });

    if (pendingSubmission) {
      throw new Error('Ya tienes una sumisión en revisión para esta misión');
    }

    // ========================================
    // LÓGICA DE COOLDOWN - MEJORADA CON MissionCompletion
    // ========================================
    // Determinar el cooldown en días (si no está explícitamente configurado, usar frequency)
    let cooldownDays = mission.cooldownDays;
    
    if (cooldownDays === 0 && mission.frequency) {
      // Convertir frequency en días
      const frequencyMap = {
        'ONCE': 999999, // No puede repetir
        'DAILY': 1,
        'WEEKLY': 7,
        'MONTHLY': 30,
        'QUARTERLY': 90,
        'YEARLY': 365,
        'ELECTION_PERIOD': 1460, // 4 años (ciclo presidencial)
      };
      cooldownDays = frequencyMap[mission.frequency] || 0;
    }

    if (cooldownDays > 0) {
      // Buscar la última completación de esta misión por este usuario
      const lastCompletion = await prisma.missionCompletion.findFirst({
        where: {
          userId,
          missionId,
        },
        orderBy: {
          completedAt: 'desc',
        },
      });

      if (lastCompletion) {
        // Calcular cuántos días han pasado desde la última completación
        const now = new Date();
        const lastCompletionDate = new Date(lastCompletion.completedAt);
        const daysPassed = Math.floor(
          (now.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Si no han pasado suficientes días, bloquear el envío
        if (daysPassed < cooldownDays) {
          const daysRemaining = cooldownDays - daysPassed;
          throw new Error(
            `Debes esperar ${daysRemaining} día(s) más antes de enviar esta misión nuevamente`
          );
        }
      }
    }

    // Crear la sumisión con estado PENDING
    const submission = await prisma.missionSubmission.create({
      data: {
        userId,
        missionId,
        evidenceUrl,
        observation: description, // Guardar la descripción del usuario
        status: 'PENDING', // Estado inicial es PENDING (esperando aprobación)
        metadata: metadata || null, // Guardar metadata con URLs adicionales si existen
      },
      include: {
        mission: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: submission.id,
      userId: submission.userId,
      missionId: submission.missionId,
      evidenceUrl: submission.evidenceUrl,
      status: submission.status,
      mission: {
        id: submission.mission.id,
        name: submission.mission.name,
        points: submission.mission.points,
      },
      user: submission.user,
      createdAt: submission.createdAt,
    };
  } catch (error) {
    console.error('Error al crear sumisión de misión:', error);
    throw error;
  }
}

/**
 * Obtener todas las sumisiones de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Array de sumisiones del usuario
 */
export async function getUserSubmissions(userId) {
  try {
    const submissions = await prisma.missionSubmission.findMany({
      where: { userId },
      include: {
        mission: {
          select: {
            id: true,
            name: true,
            points: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return submissions;
  } catch (error) {
    console.error('Error al obtener sumisiones del usuario:', error);
    throw error;
  }
}

/**
 * Obtener sumisiones pendientes de aprobación (para administradores)
 * @returns {Promise<Array>} Array de sumisiones pendientes
 */
export async function getPendingSubmissions() {
  try {
    const submissions = await prisma.missionSubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mission: {
          select: {
            id: true,
            name: true,
            points: true,
            evidenceType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return submissions;
  } catch (error) {
    console.error('Error al obtener sumisiones pendientes:', error);
    throw error;
  }
}

/**
 * Aprobar una sumisión de misión (administrador)
 * Asigna puntos al usuario y registra el aprobador
 * @param {string} submissionId - ID de la sumisión
 * @param {string} adminId - ID del administrador que aprueba
 * @param {string} observation - Observación opcional del administrador
 * @returns {Promise<Object>} Objeto de la sumisión aprobada
 */
export async function approveSubmission(submissionId, adminId, observation = null) {
  try {
    // Obtener la sumisión con sus datos
    const submission = await prisma.missionSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: true,
        mission: true,
      },
    });

    if (!submission) {
      throw new Error('Sumisión no encontrada');
    }

    if (submission.status !== 'PENDING') {
      throw new Error('Solo se pueden aprobar sumisiones pendientes');
    }

    // Obtener la billetera del usuario
    const wallet = await prisma.wallet.findUnique({
      where: { userId: submission.userId },
    });

    if (!wallet) {
      throw new Error('Billetera del usuario no encontrada');
    }

    // Realizar la aprobación en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar la sumisión
      const updatedSubmission = await tx.missionSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'APPROVED',
          validatedById: adminId,
          validatedAt: new Date(),
          observation,
        },
      });

      // Registrar la completación de la misión (para validar cooldown)
      const missionCompletion = await tx.missionCompletion.create({
        data: {
          userId: submission.userId,
          missionId: submission.missionId,
          completedAt: new Date(),
        },
      });

      // Agregar puntos a la billetera
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: submission.mission.points,
          },
        },
      });

      // Registrar la transacción de puntos
      const transaction = await tx.pointTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EARNED',
          amount: submission.mission.points,
          description: `Misión aprobada: ${submission.mission.name}`,
        },
      });

      // Registrar en el log administrativo
      await tx.adminLog.create({
        data: {
          adminId,
          action: 'APPROVE_MISSION',
          targetId: submissionId,
          description: `Misión aprobada para usuario ${submission.user.name}`,
          metadata: {
            submissionId,
            userId: submission.userId,
            missionId: submission.missionId,
            pointsAwarded: submission.mission.points,
            completionId: missionCompletion.id,
          },
        },
      });

      return {
        submission: updatedSubmission,
        completion: missionCompletion,
        wallet: updatedWallet,
        transaction,
      };
    });

    return {
      id: result.submission.id,
      status: result.submission.status,
      validatedAt: result.submission.validatedAt,
      pointsAwarded: submission.mission.points,
      userNewBalance: result.wallet.balance,
      message: `Misión aprobada. ${submission.mission.points} puntos asignados a ${submission.user.name}`,
    };
  } catch (error) {
    console.error('Error al aprobar sumisión:', error);
    throw error;
  }
}

/**
 * Rechazar una sumisión de misión (administrador)
 * @param {string} submissionId - ID de la sumisión
 * @param {string} adminId - ID del administrador que rechaza
 * @param {string} reason - Motivo del rechazo
 * @returns {Promise<Object>} Objeto de la sumisión rechazada
 */
export async function rejectSubmission(submissionId, adminId, reason) {
  try {
    const submission = await prisma.missionSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: true,
        mission: true,
      },
    });

    if (!submission) {
      throw new Error('Sumisión no encontrada');
    }

    if (submission.status !== 'PENDING') {
      throw new Error('Solo se pueden rechazar sumisiones pendientes');
    }

    // Actualizar la sumisión
    const updatedSubmission = await prisma.missionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        validatedById: adminId,
        validatedAt: new Date(),
        observation: reason,
      },
    });

    // Registrar en el log administrativo
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'REJECT_MISSION',
        targetId: submissionId,
        description: `Misión rechazada para usuario ${submission.user.name}`,
        metadata: {
          submissionId,
          userId: submission.userId,
          missionId: submission.missionId,
          reason,
        },
      },
    });

    return {
      id: updatedSubmission.id,
      status: updatedSubmission.status,
      observation: updatedSubmission.observation,
      message: `Sumisión rechazada. Motivo: ${reason}`,
    };
  } catch (error) {
    console.error('Error al rechazar sumisión:', error);
    throw error;
  }
}

/**
 * Obtener detalles de una sumisión específica
 * @param {string} submissionId - ID de la sumisión
 * @returns {Promise<Object>} Detalles de la sumisión
 */
export async function getSubmissionById(submissionId) {
  try {
    const submission = await prisma.missionSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mission: {
          select: {
            id: true,
            name: true,
            description: true,
            points: true,
            evidenceType: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Sumisión no encontrada');
    }

    return submission;
  } catch (error) {
    console.error('Error al obtener sumisión:', error);
    throw error;
  }
}
