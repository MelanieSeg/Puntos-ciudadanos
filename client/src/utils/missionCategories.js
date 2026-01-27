/**
 * missionCategories.js - Mapeo de categorías de misiones a íconos
 * Proporciona iconos consistentes basados en la categoría de la misión
 */

/**
 * Obtiene el ícono correspondiente a una categoría de misión
 * @param {string} category - Categoría de la misión (VOTING, ENVIRONMENT, etc.)
 * @returns {string} - Nombre del ícono de MaterialCommunityIcons
 */
export const getCategoryIcon = (category) => {
  const iconMap = {
    VOTING: 'vote',
    ENVIRONMENT: 'tree',
    COMMUNITY: 'account-group',
    VOLUNTEERING: 'account-heart',
    EDUCATION: 'school',
    DONATION: 'hand-heart',
    REPORTING: 'alert-circle',
    EVENT: 'calendar-star',
    OTHER: 'target',
  };

  return iconMap[category] || 'target';
};

/**
 * Obtiene el color asociado a una categoría de misión
 * @param {string} category - Categoría de la misión
 * @returns {string} - Color hexadecimal
 */
export const getCategoryColor = (category) => {
  const colorMap = {
    VOTING: '#6C63FF',     // Púrpura
    ENVIRONMENT: '#4CAF50', // Verde
    COMMUNITY: '#FF9800',   // Naranja
    VOLUNTEERING: '#E91E63', // Rosa
    EDUCATION: '#2196F3',   // Azul
    DONATION: '#F44336',    // Rojo
    REPORTING: '#FFC107',   // Amarillo/ámbar
    EVENT: '#9C27B0',       // Morado
    OTHER: '#607D8B',       // Gris azulado
  };

  return colorMap[category] || '#607D8B';
};

/**
 * Obtiene el nombre legible de una categoría
 * @param {string} category - Categoría de la misión
 * @returns {string} - Nombre en español
 */
export const getCategoryLabel = (category) => {
  const labelMap = {
    VOTING: 'Votación',
    ENVIRONMENT: 'Medio Ambiente',
    COMMUNITY: 'Comunidad',
    VOLUNTEERING: 'Voluntariado',
    EDUCATION: 'Educación',
    DONATION: 'Donación',
    REPORTING: 'Reporte',
    EVENT: 'Evento',
    OTHER: 'Otro',
  };

  return labelMap[category] || 'Otro';
};

/**
 * Lista de todas las categorías disponibles para selección
 */
export const MISSION_CATEGORIES = [
  { value: 'VOTING', label: 'Votación' },
  { value: 'ENVIRONMENT', label: 'Medio Ambiente' },
  { value: 'COMMUNITY', label: 'Comunidad' },
  { value: 'VOLUNTEERING', label: 'Voluntariado' },
  { value: 'EDUCATION', label: 'Educación' },
  { value: 'DONATION', label: 'Donación' },
  { value: 'REPORTING', label: 'Reporte' },
  { value: 'EVENT', label: 'Evento' },
  { value: 'OTHER', label: 'Otro' },
];

/**
 * Obtiene la traducción al español de una frecuencia
 * @param {string} frequency - Frecuencia en inglés (DAILY, WEEKLY, etc.)
 * @returns {string} - Nombre en español
 */
export const getFrequencyLabel = (frequency) => {
  const frequencyMap = {
    ONCE: 'Una sola vez',
    DAILY: 'Diaria',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensual',
    QUARTERLY: 'Trimestral',
    YEARLY: 'Anual',
    ELECTION_PERIOD: 'Período Electoral',
  };

  return frequencyMap[frequency] || frequency;
};
