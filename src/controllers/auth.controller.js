import bcrypt from 'bcrypt';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { 
  ValidationError, 
  UnauthorizedError, 
  ConflictError,
  ForbiddenError 
} from '../utils/errors.js';
import { generateToken, createTokenPayload } from '../utils/jwt.js';
import { validatePassword } from '../utils/password.js';
import prisma from '../config/database.js';
import config from '../config/index.js';
import { sendVerificationEmail, verifyEmailToken } from '../services/email.service.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 * @validation Zod schema (registerSchema) valida name, email, password
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // NOTA DE SEGURIDAD: Los datos ya fueron validados por el middleware validate(registerSchema)
  // en auth.routes.js antes de llegar aquí. No es necesario validar nuevamente.

  // Validar fortaleza de contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.errors.join('. '));
  }

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('El email ya está registrado');
  }

  // Hashear contraseña
  const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);

  // Crear usuario con wallet
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
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
      wallet: {
        select: {
          id: true,
          balance: true,
        },
      },
    },
  });

  // Enviar correo de verificación
  try {
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${config.port}`;
    await sendVerificationEmail(user, baseUrl);
  } catch (emailError) {
    console.error('Error al enviar email de verificación:', emailError);
    // No fallar el registro si el email falla, pero advertir
  }

  // Generar token (pero el usuario no podrá hacer login hasta verificar)
  const token = generateToken(createTokenPayload(user));

  successResponse(
    res,
    {
      user,
      token,
      message: 'Por favor verifica tu correo electrónico para activar tu cuenta',
    },
    'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.',
    201
  );
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 * @validation Zod schema (loginSchema) valida email y password
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // NOTA DE SEGURIDAD: Los datos ya fueron validados por el middleware validate(loginSchema)

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      wallet: {
        select: {
          id: true,
          balance: true,
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Verificar estado del usuario
  if (user.status === 'SUSPENDED') {
    throw new ForbiddenError('Tu cuenta ha sido suspendida. Contacta al administrador.');
  }

  if (user.status === 'DELETED') {
    throw new ForbiddenError('Esta cuenta ha sido eliminada');
  }

  if (user.status === 'INACTIVE') {
    throw new ForbiddenError('Tu cuenta está inactiva. Contacta al administrador.');
  }

  // Verificar que el email esté verificado (ANTES de verificar contraseña)
  if (!user.emailVerified) {
    throw new ForbiddenError(
      'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
    );
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // ========================================
  // SEGURIDAD DE ADMINISTRADORES
  // Verificar si el usuario es admin y debe cambiar contraseña inicial
  // ========================================
  if (
    (user.role === 'MASTER_ADMIN' || user.role === 'SUPPORT_ADMIN') &&
    user.mustChangePassword
  ) {
    // No generar token de sesión completo, pero sí un token limitado
    // para que el usuario pueda acceder solo a la ruta de cambio de contraseña
    const limitedToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      scope: 'CHANGE_PASSWORD_REQUIRED', // Scope limitado
    });

    // Remover passwordHash del objeto user
    const { passwordHash, ...userWithoutPassword } = user;

    // Retornar respuesta indicando que debe cambiar contraseña
    return successResponse(
      res,
      {
        user: userWithoutPassword,
        token: limitedToken,
        requirePasswordChange: true,
        message:
          'Debe cambiar su contraseña inicial por razones de seguridad',
      },
      'Cambio de contraseña requerido',
      200
    );
  }

  // Remover passwordHash del objeto user
  const { passwordHash, ...userWithoutPassword } = user;

  // Actualizar último login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generar token completo para usuarios normales o admins con contraseña ya cambiada
  const token = generateToken(createTokenPayload(user));

  successResponse(res, {
    user: userWithoutPassword,
    token,
  }, 'Inicio de sesión exitoso');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener usuario autenticado
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      wallet: {
        select: {
          id: true,
          balance: true,
          // version: Campo interno, no exponer al frontend
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado');
  }

  successResponse(res, user, 'Datos del usuario obtenidos');
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, email } = req.body;

  // Si se intenta actualizar el email, verificar que no exista
  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('El email ya está en uso');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
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

  successResponse(res, updatedUser, 'Perfil actualizado exitosamente');
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Validar fortaleza de la nueva contraseña
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.errors.join('. '));
  }

  // Obtener usuario con contraseña
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Contraseña actual incorrecta');
  }

  // Hashear nueva contraseña
  const newPasswordHash = await bcrypt.hash(newPassword, config.bcrypt.rounds);

  // Actualizar contraseña y marcar que ya fue cambiada (para admins)
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      mustChangePassword: false, // Marcar que la contraseña inicial ha sido cambiada
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
    },
  });

  // Registrar en el log administrativo (si el usuario es admin)
  if (updatedUser.role === 'MASTER_ADMIN' || updatedUser.role === 'SUPPORT_ADMIN') {
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: 'CHANGE_PASSWORD',
        targetId: userId,
        description: 'Cambio de contraseña inicial realizado',
        metadata: {
          timestamp: new Date(),
        },
      },
    });
  }

  successResponse(res, updatedUser, 'Contraseña actualizada exitosamente');
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión (invalida token en frontend)
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // En JWT stateless, el logout se maneja en el cliente eliminando el token
  // Aquí podríamos agregar el token a una blacklist si implementamos esa feature
  
  successResponse(res, null, 'Sesión cerrada exitosamente');
});

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verificar email del usuario mediante token
 * @access  Public
 * @query   token - JWT de verificación
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ValidationError('Token de verificación requerido');
  }

  // Verificar y decodificar el token
  const userId = verifyEmailToken(token);

  // Buscar el usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado');
  }

  // Verificar si ya está verificado
  if (user.emailVerified) {
    // Redirigir con mensaje de éxito (ya estaba verificado)
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email ya verificado - Puntos Ciudadanos</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 48px 32px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          .icon {
            font-size: 64px;
            margin-bottom: 24px;
          }
          h1 {
            color: #4CAF50;
            font-size: 28px;
            margin-bottom: 16px;
          }
          p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Tu email ya estaba verificado</h1>
          <p>Tu cuenta ya está activa. Puedes iniciar sesión cuando quieras.</p>
          <a href="http://localhost:8081" class="button">Ir a la aplicación</a>
        </div>
      </body>
      </html>
    `);
  }

  // Actualizar el estado de verificación
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  // Determinar si es admin o comerciante
  const isAdminOrMerchant = user.role === 'SUPPORT_ADMIN' || user.role === 'MERCHANT';
  const roleLabel = user.role === 'MERCHANT' ? 'Comerciante' : 
                    user.role === 'SUPPORT_ADMIN' ? 'Administrador de Soporte' : 'Usuario';

  // Responder con página HTML de éxito (diferente según rol)
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verificado - Puntos Ciudadanos</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: ${isAdminOrMerchant ? 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'};
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 48px 32px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .icon {
          font-size: 64px;
          margin-bottom: 24px;
          animation: bounce 1s ease-in-out;
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        h1 {
          color: #2E7D32;
          font-size: 28px;
          margin-bottom: 16px;
        }
        p {
          color: #666;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .success-box {
          background-color: #E8F5E9;
          border-left: 4px solid #4CAF50;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
          text-align: left;
        }
        .success-box p {
          margin: 8px 0;
          color: #2E7D32;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        .button:hover {
          background-color: #45a049;
          box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${isAdminOrMerchant ? '✓' : '🎉'}</div>
        <h1>${isAdminOrMerchant ? 'Cuenta Verificada' : '¡Email Verificado Exitosamente!'}</h1>
        <p>${isAdminOrMerchant ? `Tu cuenta de ${roleLabel} ha sido verificada correctamente.` : 'Tu cuenta ha sido activada correctamente.'}</p>
        
        ${isAdminOrMerchant ? `
        <div class="success-box" style="background-color: #FFF3E0; border-left-color: #F57C00;">
          <p style="color: #E65100; font-weight: bold;">⚠️ ACCIÓN REQUERIDA</p>
          <p style="color: #E65100;">Debes iniciar sesión y cambiar tu contraseña temporal antes de acceder al sistema.</p>
        </div>
        <div class="success-box">
          <p>✓ Tu cuenta tiene acceso privilegiado</p>
          <p>✓ Deberás crear una contraseña segura</p>
          <p>✓ Lee y cumple tus responsabilidades como ${roleLabel}</p>
        </div>
        ` : `
        <div class="success-box">
          <p>✓ Ahora puedes iniciar sesión</p>
          <p>✓ Completar misiones ecológicas</p>
          <p>✓ Canjear beneficios exclusivos</p>
        </div>
        `}
        
        <p>${isAdminOrMerchant ? 'Inicia sesión para continuar con el cambio de contraseña.' : 'Gracias por unirte a <strong>Puntos Ciudadanos</strong>.'}</p>
        <a href="http://localhost:8081" class="button">${isAdminOrMerchant ? 'Iniciar Sesión y Cambiar Contraseña' : 'Iniciar Sesión'}</a>
      </div>
    </body>
    </html>
  `);
});
