// Colour grades: each preset pairs a canvas filter applied to the photos
// themselves with a translucent wash laid over the finished collage, a
// vignette strength, and the accent colour the caption bar wears. The wash
// is what unifies photos from different cameras into one poster.

export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02)',
    washTop: 'rgba(64, 16, 92, 0.20)',
    washMid: 'rgba(255, 94, 58, 0.10)',
    washBottom: 'rgba(214, 32, 110, 0.42)',
    vignette: 0.34,
    accent: '#ff2e88',
    skyline: '#2a0a3e',
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.18) brightness(0.94) hue-rotate(-8deg)',
    washTop: 'rgba(6, 8, 44, 0.38)',
    washMid: 'rgba(0, 60, 90, 0.12)',
    washBottom: 'rgba(120, 0, 140, 0.40)',
    vignette: 0.5,
    accent: '#22d8f2',
    skyline: '#05081f',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    filter: 'saturate(1.22) contrast(1.04) brightness(1.07) sepia(0.22)',
    washTop: 'rgba(120, 60, 0, 0.10)',
    washMid: 'rgba(255, 170, 60, 0.12)',
    washBottom: 'rgba(190, 70, 20, 0.34)',
    vignette: 0.26,
    accent: '#ffb02e',
    skyline: '#3d1c04',
  },
  {
    id: 'noir-rain',
    name: 'Noir Rain',
    filter: 'saturate(0.38) contrast(1.24) brightness(0.96)',
    washTop: 'rgba(8, 10, 16, 0.30)',
    washMid: 'rgba(30, 40, 60, 0.14)',
    washBottom: 'rgba(4, 6, 10, 0.52)',
    vignette: 0.58,
    accent: '#c8d4e2',
    skyline: '#0a0d13',
  },
  {
    id: 'clean-pop',
    name: 'Clean Pop',
    filter: 'saturate(1.18) contrast(1.06) brightness(1.05)',
    washTop: 'rgba(0, 40, 80, 0.06)',
    washMid: 'rgba(255, 255, 255, 0.02)',
    washBottom: 'rgba(0, 90, 140, 0.20)',
    vignette: 0.18,
    accent: '#0e9be8',
    skyline: '#0b2c47',
  },
];

/** Looks up a grade by id, falling back to the first grade. */
export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}

/** Placeholder hues for empty panels, one per panel index, so an empty
 *  collage still reads as a designed poster rather than grey boxes. */
export const PANEL_TINTS = ['#7a2d63', '#28418c', '#a34d1d', '#1d6a6e', '#5c2d80', '#8c2844'];
