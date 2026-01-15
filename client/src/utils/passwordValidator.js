/**
 * Utilidades para validación de contraseñas en el frontend
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Valida si una contraseña cumple con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['La contraseña es requerida'] };
  }

  // Longitud mínima
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`
    );
  }

  // Letra mayúscula
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula (A-Z)');
  }

  // Letra minúscula
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula (a-z)');
  }

  // Número
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número (0-9)');
  }

  // Carácter especial
  if (PASSWORD_REQUIREMENTS.requireSpecialChar) {
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    if (!hasSpecialChar) {
      errors.push('Debe contener al menos un símbolo (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Obtiene los requisitos de contraseña en formato texto
 * @returns {Array<string>} Lista de requisitos
 */
export const getPasswordRequirements = () => {
  const requirements = [];

  requirements.push(`Mínimo ${PASSWORD_REQUIREMENTS.minLength} caracteres`);

  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push('Una letra mayúscula (A-Z)');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push('Una letra minúscula (a-z)');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber) {
    requirements.push('Un número (0-9)');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChar) {
    requirements.push(`Un símbolo especial`);
  }

  return requirements;
};

/**
 * Calcula la fortaleza de una contraseña (0-100)
 * @param {string} password
 * @returns {number} Puntuación de 0 a 100
 */
export const getPasswordStrength = (password) => {
  if (!password) return 0;

  let score = 0;
  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    password.length >= 16,
  ];

  score = (checks.filter(Boolean).length / checks.length) * 100;
  return Math.round(score);
};

/**
 * Obtiene el color según la fortaleza de la contraseña
 * @param {number} strength - Fortaleza (0-100)
 * @returns {string} Color
 */
export const getStrengthColor = (strength) => {
  if (strength < 40) return '#f44336'; // Rojo - Débil
  if (strength < 70) return '#ff9800'; // Naranja - Media
  return '#4caf50'; // Verde - Fuerte
};

/**
 * Obtiene el texto según la fortaleza de la contraseña
 * @param {number} strength - Fortaleza (0-100)
 * @returns {string} Texto descriptivo
 */
export const getStrengthText = (strength) => {
  if (strength === 0) return '';
  if (strength < 40) return 'Débil';
  if (strength < 70) return 'Media';
  return 'Fuerte';
};
