/**
 * Servicio de Envío de Correos
 * Maneja el envío de emails de verificación y notificaciones
 */

import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Configurar transporter (Ethereal para desarrollo, SMTP real para producción)
let transporter;

async function createTransporter() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    // Configuración real (Brevo, SendGrid, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Usar Ethereal (correos de prueba) si no hay configuración real
    console.log('⚠️  No hay configuración de email. Usando Ethereal (correos de prueba)...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✅ Ethereal configurado:', testAccount.user);
  }
}

// Inicializar transporter
createTransporter().catch(console.error);

/**
 * Genera un token JWT de verificación de email (válido por 1 hora)
 */
function generateVerificationToken(userId) {
  return jwt.sign(
    { userId, type: 'email_verification' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

/**
 * Envía correo de verificación al usuario (diferente según rol)
 */
async function sendVerificationEmail(user, baseUrl = 'http://localhost:3000') {
  const token = generateVerificationToken(user.id);
  const verificationUrl = `${baseUrl}/api/v1/auth/verify-email?token=${token}`;
  
  // Determinar tipo de mensaje según rol
  const isAdminOrMerchant = user.role === 'SUPPORT_ADMIN' || user.role === 'MERCHANT';
  
  console.log('📧 Enviando email a:', user.email);
  console.log('📧 Rol del usuario:', user.role);
  console.log('📧 Es admin o merchant?:', isAdminOrMerchant);

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Puntos Ciudadanos" <noreply@puntosciudadanos.com>',
    to: user.email,
    subject: isAdminOrMerchant 
      ? '✓ Verificación de cuenta - Puntos Ciudadanos [OFICIAL]'
      : '✓ Verifica tu correo electrónico - Puntos Ciudadanos',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: ${isAdminOrMerchant ? 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'};
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.95;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #2E7D32;
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            font-size: 16px;
            color: #666;
            margin: 16px 0;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .verify-button {
            display: inline-block;
            padding: 16px 40px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            transition: all 0.3s ease;
          }
          .verify-button:hover {
            background-color: #45a049;
            box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
          }
          .info-box {
            background-color: #E8F5E9;
            border-left: 4px solid #4CAF50;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 0;
            color: #2E7D32;
            font-size: 14px;
          }
          .footer {
            background-color: #f9f9f9;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #eeeeee;
          }
          .footer p {
            margin: 8px 0;
            font-size: 14px;
            color: #999;
          }
          .link-alternative {
            margin-top: 24px;
            padding: 16px;
            background-color: #f5f5f5;
            border-radius: 8px;
            word-break: break-all;
          }
          .link-alternative p {
            margin: 8px 0;
            font-size: 13px;
            color: #666;
          }
          .link-alternative a {
            color: #4CAF50;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isAdminOrMerchant ? '🔒 Puntos Ciudadanos' : '✓ Puntos Ciudadanos'}</h1>
            <p>Energía CO2 Neutral</p>
          </div>
          
          <div class="content">
            <h2>Hola, ${user.name}</h2>
            
            ${isAdminOrMerchant ? `
            <p>
              Se ha creado una cuenta ${user.role === 'MERCHANT' ? 'de Comerciante' : 'de Administrador de Soporte'} 
              a tu nombre en el sistema <strong>Puntos Ciudadanos</strong>.
            </p>
            
            <div class="info-box">
              <p>
                <strong>IMPORTANTE:</strong> Este es un rol con acceso privilegiado al sistema. 
                Debes verificar tu correo electrónico para activar tu cuenta.
              </p>
            </div>
            
            <p>
              <strong>Responsabilidades de tu rol:</strong>
            </p>
            <ul style="color: #333; line-height: 1.8;">
              ${user.role === 'MERCHANT' 
                ? `<li>✓ Gestionar beneficios y promociones de tu comercio</li>
                   <li>✓ Validar canjes de puntos de usuarios</li>
                   <li>✓ Mantener actualizado el inventario de beneficios</li>
                   <li>✓ Cumplir con los términos del programa de comercios afiliados</li>`
                : `<li>✓ Aprobar o rechazar misiones completadas por usuarios</li>
                   <li>✓ Gestionar el contenido del sistema</li>
                   <li>✓ Supervisar la integridad del programa</li>
                   <li>✓ Mantener la confidencialidad de datos sensibles</li>`
              }
            </ul>
            
            <div class="info-box" style="background-color: #FFF3E0; border-left-color: #F57C00;">
              <p style="color: #E65100;">
                ⏰ <strong>Este enlace expira en 1 hora</strong>. Después de verificar, 
                deberás cambiar tu contraseña temporal por una segura.
              </p>
            </div>
            ` : `
            <p>
              Gracias por registrarte en <strong>Puntos Ciudadanos</strong>. 
              Estás a un paso de comenzar a ganar puntos y contribuir a la sociedad y al medio ambiente.
            </p>
            
            <div class="info-box">
              <p>
                ⏰ <strong>Este enlace expira en 1 hora</strong>. 
                Por favor verifica tu correo lo antes posible.
              </p>
            </div>
            `}
            
            <div class="button-container">
              <a href="${verificationUrl}" class="verify-button">
                Verificar mi correo
              </a>
            </div>
            
            ${!isAdminOrMerchant ? `
            <p>
              Una vez verificado tu correo, podrás iniciar sesión y comenzar a:
            </p>
            <ul>
              <li>✓ Completar misiones</li>
              <li>✓ Canjear beneficios exclusivos</li>
              <li>✓ Contribuir a una mejor sociedad y medio ambiente</li>
            </ul>
            ` : ''}
            
            <div class="link-alternative">
              <p><strong>¿El botón no funciona?</strong> Copia y pega este enlace en tu navegador:</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            </div>
          </div>
          
          <div class="footer">
            <p>Si no ${isAdminOrMerchant ? 'solicitaste' : 'creaste'} esta cuenta, contacta inmediatamente al administrador del sistema.</p>
            <p style="margin-top: 16px;">
              <strong>Puntos Ciudadanos</strong> - Energía CO2 Neutral<br>
              Sistema de Incentivos Ambientales
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola, ${user.name}!

Gracias por registrarte en Puntos Ciudadanos.

Por favor verifica tu correo electrónico haciendo clic en el siguiente enlace:
${verificationUrl}

Este enlace expira en 1 hora.

Si no creaste esta cuenta, puedes ignorar este correo.

---
Puntos Ciudadanos - Energía CO2 Neutral
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Si usamos Ethereal, mostrar el enlace de vista previa
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('📧 Email de prueba enviado!');
      console.log('🔗 Vista previa:', nodemailer.getTestMessageUrl(info));
    } else {
      console.log('📧 Email enviado a:', user.email);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw new Error('No se pudo enviar el correo de verificación');
  }
}

/**
 * Verifica un token de verificación de email
 */
function verifyEmailToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.type !== 'email_verification') {
      throw new Error('Token inválido');
    }
    
    return decoded.userId;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('El token ha expirado. Por favor solicita un nuevo correo de verificación.');
    }
    throw new Error('Token inválido');
  }
}

export {
  sendVerificationEmail,
  verifyEmailToken,
  generateVerificationToken,
};
