import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middlewares/auth.js';
import * as cacheService from '../services/cache.service.js';

const router = Router();

/**
 * GET /api/v1/benefits
 * Listar beneficios disponibles
 * CON CACHÉ: 10 minutos para reducir carga en BD
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, active = 'true' } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Generar clave de caché basada en los parámetros, rol y userId (para evitar fuga de datos de cooldown)
    const cacheKey = category 
      ? `${cacheService.CACHE_KEYS.ALL_BENEFITS}_${category}_${active}_${userRole}_${userId}`
      : `${cacheService.CACHE_KEYS.ALL_BENEFITS}_${active}_${userRole}_${userId}`;

    // Intentar obtener del caché (solo si no es USER, ya que USER tiene datos personalizados)
    let cachedBenefits = null;
    if (userRole !== 'USER') {
      cachedBenefits = cacheService.get(cacheKey);
      if (cachedBenefits) {
        return res.json({
          success: true,
          data: cachedBenefits,
          total: cachedBenefits.length,
          cached: true,
        });
      }
    }

    // Si no está en caché, consultar BD
    const where = {
      active: active === 'true',
    };

    // FILTRADO INTELIGENTE: Usuarios solo ven beneficios con stock disponible
    if (userRole === 'USER') {
      where.stock = { gt: 0 };
      where.active = true;
    }

    if (category) {
      where.category = category;
    }

    const benefits = await prisma.benefit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        pointsCost: true,
        stock: true,
        category: true,
        active: true,
        imageUrl: true,
        cooldownDays: true,
        createdAt: true,
        merchant: {
          select: {
            id: true,
            name: true,
            merchantProfile: {
              select: {
                storeName: true,
                address: true,
              },
            },
          },
        },
      },
    });

    // Calcular cooldownUntil para cada beneficio (solo para usuarios)
    let benefitsWithCooldown = benefits;
    if (userRole === 'USER') {
      const userId = req.user.id;
      
      // Obtener todas las últimas redenciones del usuario para estos beneficios
      const benefitIds = benefits.map(b => b.id);
      const lastRedemptions = await prisma.benefitRedemption.findMany({
        where: {
          userId,
          benefitId: { in: benefitIds },
        },
        orderBy: {
          createdAt: 'desc',
        },
        distinct: ['benefitId'],
        select: {
          benefitId: true,
          createdAt: true,
        },
      });

      // Crear mapa de redenciones
      const redemptionMap = new Map(
        lastRedemptions.map(r => [r.benefitId, r.createdAt])
      );

      // Calcular cooldownUntil para cada beneficio
      benefitsWithCooldown = benefits.map(benefit => {
        let cooldownUntil = null;

        if (benefit.cooldownDays > 0) {
          const lastRedemption = redemptionMap.get(benefit.id);
          if (lastRedemption) {
            const cooldownEndDate = new Date(lastRedemption);
            cooldownEndDate.setDate(cooldownEndDate.getDate() + benefit.cooldownDays);

            if (cooldownEndDate > new Date()) {
              cooldownUntil = cooldownEndDate.toISOString();
            }
          }
        }

        return {
          ...benefit,
          cooldownUntil,
        };
      });
    }

    // Guardar en caché por 10 minutos
    cacheService.set(cacheKey, benefitsWithCooldown, 600);

    res.json({
      success: true,
      data: benefitsWithCooldown,
      total: benefitsWithCooldown.length,
      cached: false,
    });
  } catch (error) {
    console.error('Error listando beneficios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener beneficios',
    });
  }
});

/**
 * GET /api/v1/benefits/:id
 * Obtener detalle de un beneficio
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            merchantProfile: {
              select: {
                storeName: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Beneficio no encontrado',
      });
    }

    // Calcular cooldownUntil para usuarios
    let cooldownUntil = null;
    if (userRole === 'USER' && benefit.cooldownDays > 0) {
      const lastRedemption = await prisma.benefitRedemption.findFirst({
        where: {
          userId,
          benefitId: id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      });

      if (lastRedemption) {
        const cooldownEndDate = new Date(lastRedemption.createdAt);
        cooldownEndDate.setDate(cooldownEndDate.getDate() + benefit.cooldownDays);

        if (cooldownEndDate > new Date()) {
          cooldownUntil = cooldownEndDate.toISOString();
        }
      }
    }

    res.json({
      success: true,
      data: {
        ...benefit,
        cooldownUntil,
      },
    });
  } catch (error) {
    console.error('Error obteniendo beneficio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener beneficio',
    });
  }
});

export default router;
