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

    // Generar clave de caché basada en los parámetros y rol
    const cacheKey = category 
      ? `${cacheService.CACHE_KEYS.ALL_BENEFITS}_${category}_${active}_${userRole}`
      : `${cacheService.CACHE_KEYS.ALL_BENEFITS}_${active}_${userRole}`;

    // Intentar obtener del caché
    const cachedBenefits = cacheService.get(cacheKey);
    if (cachedBenefits) {
      return res.json({
        success: true,
        data: cachedBenefits,
        total: cachedBenefits.length,
        cached: true,
      });
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

    // Guardar en caché por 10 minutos
    cacheService.set(cacheKey, benefits, 600);

    res.json({
      success: true,
      data: benefits,
      total: benefits.length,
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

    const benefit = await prisma.benefit.findUnique({
      where: { id },
    });

    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Beneficio no encontrado',
      });
    }

    res.json({
      success: true,
      data: benefit,
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
