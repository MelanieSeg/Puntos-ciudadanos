/**
 * stats.controller.js - Controlador de estadísticas administrativas
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import prisma from '../config/database.js';
import { get as getCachedData, set as setCachedData } from '../services/cache.service.js';

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Obtener estadísticas globales del sistema
 * @access  Private (MASTER_ADMIN, SUPPORT_ADMIN)
 */
export const getGlobalStats = asyncHandler(async (req, res) => {
  const cacheKey = 'admin:global-stats';
  
  // Intentar obtener desde caché (5 minutos)
  const cachedStats = await getCachedData(cacheKey);
  if (cachedStats) {
    return successResponse(res, cachedStats, 'Estadísticas obtenidas (cache)');
  }

  // Calcular fecha de inicio de la semana (últimos 7 días)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Ejecutar todas las consultas en paralelo
  const [
    usuariosActivos,
    comerciosTotales,
    puntosCirculacion,
    transaccionesTotales,
    misionesCompletadasSemana,
    beneficiosCanjeadosSemana,
    nuevosUsuariosSemana,
    usuariosActivosHoy,
    misionesPendientes,
    comerciosActivosSemana,
  ] = await Promise.all([
    // Usuarios activos (ciudadanos)
    prisma.user.count({
      where: {
        role: 'USER',
        status: 'ACTIVE',
      },
    }),

    // Comercios totales
    prisma.user.count({
      where: {
        role: 'MERCHANT',
      },
    }),

    // Puntos en circulación (suma de todos los balances)
    prisma.wallet.aggregate({
      _sum: {
        balance: true,
      },
    }),

    // Transacciones totales
    prisma.pointTransaction.count(),

    // Misiones completadas esta semana (aprobadas)
    prisma.missionSubmission.count({
      where: {
        status: 'APPROVED',
        validatedAt: {
          gte: weekAgo,
        },
      },
    }),

    // Beneficios canjeados esta semana
    prisma.benefitRedemption.count({
      where: {
        status: 'REDEEMED',
        redeemedAt: {
          gte: weekAgo,
        },
      },
    }),

    // Nuevos usuarios esta semana
    prisma.user.count({
      where: {
        role: 'USER',
        createdAt: {
          gte: weekAgo,
        },
      },
    }),

    // Usuarios activos hoy (con actividad reciente)
    prisma.user.count({
      where: {
        role: 'USER',
        status: 'ACTIVE',
        lastLoginAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),

    // Misiones pendientes de aprobación
    prisma.missionSubmission.count({
      where: {
        status: 'PENDING',
      },
    }),

    // Comercios con actividad esta semana (canjes escaneados)
    prisma.user.count({
      where: {
        role: 'MERCHANT',
        merchantScans: {
          some: {
            scannedAt: {
              gte: weekAgo,
            },
          },
        },
      },
    }),
  ]);

  // Obtener beneficio más popular (por canjes)
  const beneficioMasPopular = await prisma.benefitRedemption.groupBy({
    by: ['benefitId'],
    where: {
      status: 'REDEEMED',
      redeemedAt: {
        gte: weekAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 1,
  });

  // Obtener comercio top (por canjes escaneados)
  const comercioTop = await prisma.user.findMany({
    where: {
      role: 'MERCHANT',
      merchantScans: {
        some: {
          scannedAt: {
            gte: weekAgo,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          merchantScans: {
            where: {
              scannedAt: {
                gte: weekAgo,
              },
            },
          },
        },
      },
    },
    orderBy: {
      merchantScans: {
        _count: 'desc',
      },
    },
    take: 1,
  });

  // Obtener nombres de beneficio y comercio más populares
  let beneficioPopularNombre = 'N/A';
  let comercioTopNombre = 'N/A';

  if (beneficioMasPopular.length > 0) {
    const benefit = await prisma.benefit.findUnique({
      where: { id: beneficioMasPopular[0].benefitId },
      select: { title: true },
    });
    beneficioPopularNombre = benefit?.title || 'N/A';
  }

  if (comercioTop.length > 0) {
    comercioTopNombre = comercioTop[0].name || 'N/A';
  }

  // Calcular puntos gastados esta semana
  const puntosGastadosSemana = await prisma.pointTransaction.aggregate({
    where: {
      type: 'SPENT',
      createdAt: {
        gte: weekAgo,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Calcular tasa de retención (usuarios activos / total usuarios)
  const totalUsuarios = await prisma.user.count({
    where: { role: 'USER' },
  });
  const tasaRetencion = totalUsuarios > 0 
    ? Math.round((usuariosActivos / totalUsuarios) * 100) 
    : 0;

  // Calcular tasa de aprobación de misiones
  const misionesTotales = await prisma.missionSubmission.count();
  const misionesAprobadas = await prisma.missionSubmission.count({
    where: { status: 'APPROVED' },
  });
  const tasaAprobacion = misionesTotales > 0 
    ? Math.round((misionesAprobadas / misionesTotales) * 100) 
    : 0;

  const stats = {
    resumenGeneral: {
      usuariosActivos,
      comerciosTotales,
      puntosCirculacion: puntosCirculacion._sum.balance || 0,
      transaccionesTotales,
    },
    actividadUsuarios: {
      nuevosEstaSemana: nuevosUsuariosSemana,
      activosHoy: usuariosActivosHoy,
      tasaRetencion,
    },
    misiones: {
      completadasEstaSemana: misionesCompletadasSemana,
      pendientesAprobacion: misionesPendientes,
      tasaAprobacion,
    },
    beneficios: {
      canjeadosEstaSemana: beneficiosCanjeadosSemana,
      puntosGastados: puntosGastadosSemana._sum.amount || 0,
      beneficioMasPopular: beneficioPopularNombre,
    },
    comercios: {
      comerciosRegistrados: comerciosTotales,
      conCanjesEstaSemana: comerciosActivosSemana,
      comercioTop: comercioTopNombre,
    },
  };

  // Guardar en caché por 2 minutos (120 segundos) para datos más actualizados
  await setCachedData(cacheKey, stats, 120);

  successResponse(res, stats, 'Estadísticas globales obtenidas');
});
