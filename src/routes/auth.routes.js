import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  verifyEmail,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validatePasswordChangeScope } from '../middlewares/roleCheck.js';
import { validate } from '../validators/schemas.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/schemas.js';

const router = express.Router();

// Rate limiter específico para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Rate limiter más permisivo para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora
  message: 'Demasiados intentos de registro. Intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  login
);

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verificar correo electrónico mediante token
 * @access  Public
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener datos del usuario autenticado
 * @access  Private
 */
router.get('/me', authenticate, validatePasswordChangeScope, getMe);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  validatePasswordChangeScope,
  validate(updateProfileSchema),
  updateProfile
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;
