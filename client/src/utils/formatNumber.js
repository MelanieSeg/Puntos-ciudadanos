/**
 * formatNumber.js - Utilidades para formatear números
 */

/**
 * Formatea números grandes en formato legible
 * @param {number} num - Número a formatear
 * @returns {string} - Número formateado
 * 
 * Ejemplos:
 * 1234 → "1,234"
 * 50000 → "50K"
 * 1500000 → "1.5M"
 * 2500000000 → "2.5B"
 */
export function formatLargeNumber(num) {
  if (num === null || num === undefined) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  return num.toString();
}

/**
 * Formatea números con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string} - Número formateado con comas
 * 
 * Ejemplo: 1234567 → "1,234,567"
 */
export function formatNumberWithCommas(num) {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formatea porcentajes
 * @param {number} value - Valor numérico (0-100)
 * @returns {string} - Porcentaje formateado
 * 
 * Ejemplo: 87.5 → "87.5%"
 */
export function formatPercentage(value) {
  if (value === null || value === undefined) return '0%';
  return `${value}%`;
}
