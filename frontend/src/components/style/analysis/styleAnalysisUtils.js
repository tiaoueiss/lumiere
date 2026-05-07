const FALLBACK_HEX = '#E8DCC8';

export function normalizeHex(hex, fallback = FALLBACK_HEX) {
  return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : fallback;
}

export function getLuminance(hex) {
  const safeHex = normalizeHex(hex);
  const r = parseInt(safeHex.slice(1, 3), 16) / 255;
  const g = parseInt(safeHex.slice(3, 5), 16) / 255;
  const b = parseInt(safeHex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function formatLabel(value) {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
