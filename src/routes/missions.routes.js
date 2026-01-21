import { Router } from 'express';
import { Readable } from 'stream';
import prisma from '../config/database.js';
import { authenticate } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import cloudinary from '../config/cloudinary.js';
import * as missionService from '../services/mission.service.js';
import * as cacheService from '../services/cache.service.js';

const router = Router();

/**
 * Helper: Subir imagen a Cloudinary desde buffer
 */
const uploadToCloudinary = (buffer, folder = 'puntos-ciudadanos/missions') => {
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
 * GET /api/v1/missions
 * Listar misiones disponibles para el usuario autenticado
 */
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('[GET /missions] Usuario:', req.user.id);
    
    // Generar clave de caché basada en userId (cada usuario puede tener diferentes cooldowns)
    const cacheKey = `${cacheService.CACHE_KEYS.AVAILABLE_MISSIONS}_${req.user.id}`;
    
    // Verificar si los datos están en caché
    const cachedMissions = cacheService.get(cacheKey);
    if (cachedMissions) {
      console.log('[GET /missions] Cache HIT para usuario:', req.user.id);
      return res.json({
        ...cachedMissions,
        cached: true,
      });
    }
    
    console.log('[GET /missions] Cache MISS para usuario:', req.user.id);
    
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
        active: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Para cada misión, verificar si el usuario está en cooldown
    const missionsWithCooldown = await Promise.all(
      missions.map(async (mission) => {
        // Buscar la última completación de esta misión por este usuario
        const lastCompletion = await prisma.missionCompletion.findFirst({
          where: {
            userId: req.user.id,
            missionId: mission.id,
          },
          orderBy: {
            completedAt: 'desc',
          },
        });

        let cooldownUntil = null;
        if (lastCompletion && mission.cooldownDays > 0) {
          // Calcular cuándo termina el cooldown
          const cooldownEnd = new Date(lastCompletion.completedAt);
          cooldownEnd.setDate(cooldownEnd.getDate() + mission.cooldownDays);
          
          // Solo enviar cooldownUntil si aún está en cooldown
          if (cooldownEnd > new Date()) {
            cooldownUntil = cooldownEnd;
          }
        }

        return {
          ...mission,
          cooldownUntil,
        };
      })
    );

    console.log('[GET /missions] Misiones encontradas:', missionsWithCooldown.length);

    const response = {
      success: true,
      message: 'Misiones obtenidas exitosamente',
      missions: missionsWithCooldown,
      total: missionsWithCooldown.length,
      cached: false,
    };
    
    // Guardar en caché por 600 segundos (10 minutos)
    cacheService.set(cacheKey, response, 600);

    res.json(response);
  } catch (error) {
    console.error('[GET /missions] Error listando misiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener misiones',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/missions/:id
 * Obtener detalles de una misión específica
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'Misión no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Misión obtenida exitosamente',
      mission,
    });
  } catch (error) {
    console.error('Error obteniendo misión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener misión',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/missions/:missionId/submit
 * Enviar evidencia de completación de misión con imágenes (1-4 archivos)
 */
router.post('/:missionId/submit', authenticate, upload.array('evidence', 4), async (req, res) => {
  try {
    const { missionId } = req.params;
    const { description } = req.body;
    const userId = req.user.id;

    // Validar que se subieron imágenes
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes adjuntar al menos una imagen como evidencia',
      });
    }

    // Subir todas las imágenes a Cloudinary
    const evidenceUrls = [];
    try {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'puntos-ciudadanos/missions');
        evidenceUrls.push(result.secure_url);
      }
    } catch (uploadError) {
      console.error('Error subiendo imágenes a Cloudinary:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar las imágenes. Por favor, intenta de nuevo.',
      });
    }
    
    // Validar que al menos una imagen se subió correctamente
    if (evidenceUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo procesar ninguna imagen. Por favor, verifica que las fotos sean válidas e intenta de nuevo.',
      });
    }

    // Validar que la misión existe
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Misión no encontrada',
      });
    }

    // Usar la primera imagen como evidenceUrl principal
    const primaryEvidenceUrl = evidenceUrls[0];
    
    if (!primaryEvidenceUrl || typeof primaryEvidenceUrl !== 'string' || primaryEvidenceUrl.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Error: No se pudo obtener una URL válida de la imagen principal. Por favor, intenta subir las fotos nuevamente.',
      });
    }

    // Guardar todas las URLs en metadata si hay más de una
    const metadata = evidenceUrls.length > 1 ? {
      allImages: evidenceUrls,
      imageCount: evidenceUrls.length
    } : null;

    // Usar el servicio de misiones para crear la sumisión
    const submission = await missionService.createSubmission({
      userId,
      missionId,
      evidenceUrl: primaryEvidenceUrl,
      description: description || null,
      metadata, // Guardar las URLs adicionales si existen
    });

    res.status(201).json({
      success: true,
      message: 'Evidencia enviada exitosamente',
      data: {
        ...submission,
        evidenceUrls, // Devolver todas las URLs para confirmación
      },
    });
  } catch (error) {
    console.error('Error enviando evidencia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al enviar evidencia',
    });
  }
});

export default router;

