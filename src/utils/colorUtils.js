// Este archivo contiene funciones para asegurar la accesibilidad del color (contraste).

/**
 * Parsea un string "rgb(r, g, b)" a un array [r, g, b].
 */
function parseRgb(rgbString) {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

/**
 * Calcula la luminancia relativa de un color, según las directrices WCAG.
 * Los valores r, g, b deben estar entre 0 y 255.
 */
function getLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calcula el ratio de contraste entre dos colores RGB.
 */
function getContrast(rgb1, rgb2) {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Función principal: Dado un color de fondo, decide si el texto debe ser
 * blanco o negro para obtener el máximo contraste posible.
 * @param {string} bgColor - Color de fondo en formato "rgb(r, g, b)".
 * @returns {string} Retorna "#FFFFFF" (blanco) o "#000000" (negro).
 */
export function getHighContrastTextColor(bgColor) {
  const bgColorRgb = parseRgb(bgColor);
  const whiteRgb = [255, 255, 255];
  const blackRgb = [0, 0, 0];

  const contrastWithWhite = getContrast(bgColorRgb, whiteRgb);
  const contrastWithBlack = getContrast(bgColorRgb, blackRgb);

  // Devuelve el color que tenga mayor contraste.
  return contrastWithWhite > contrastWithBlack ? "#FFFFFF" : "#000000";
}
