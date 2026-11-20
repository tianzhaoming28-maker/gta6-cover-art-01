// The cover renderer: draws a complete cover onto any 2D canvas context at
// whatever pixel size the canvas carries, so the editor preview and the
// exported PNG are the same drawing at different resolutions.
//
// A cover state is:
//   { layout, grade, panels: [{ image, panX, panY, zoom }], title,
//     subtitle, kicker, captionAt: 'bottom' | 'top' }
// panX / panY range over -1..1 and shift the photo inside its panel;
// zoom is a multiplier on top of the cover-fit scale (1 = exact fit).

import { panelBounds } from './layouts.js';
import { PANEL_TINTS } from './grade.js';

/** Traces a panel polygon onto the context at pixel size w x h. */
function tracePanel(ctx, points, w, h) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x * w, y * h);
    else ctx.lineTo(x * w, y * h);
  });
  ctx.closePath();
}

/** Draws one panel: the photo cover-fitted into the polygon's bounding box,
 *  or a tinted placeholder scene when the panel has no photo yet. */
function drawPanelPhoto(ctx, w, h, panelDef, slot, grade, index) {
  const bounds = panelBounds(panelDef.points);
  const bw = bounds.width * w;
  const bh = bounds.height * h;
  const bx = bounds.minX * w;
  const by = bounds.minY * h;
  ctx.save();
  tracePanel(ctx, panelDef.points, w, h);
  ctx.clip();
  if (slot && slot.image) {
    const img = slot.image;
    const fit = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
    const scale = fit * (slot.zoom || 1);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const roomX = Math.max(0, (dw - bw) / 2);
    const roomY = Math.max(0, (dh - bh) / 2);
    const dx = bx + (bw - dw) / 2 + (slot.panX || 0) * roomX;
    const dy = by + (bh - dh) / 2 + (slot.panY || 0) * roomY;
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = PANEL_TINTS[index % PANEL_TINTS.length];
    ctx.fillRect(bx, by, bw, bh);
    drawPlaceholderScene(ctx, bx, by, bw, bh, index);
  }
  ctx.restore();
}

/** A simple sun-and-palms placeholder so empty panels still look designed. */
function drawPlaceholderScene(ctx, bx, by, bw, bh, index) {
  const cx = bx + bw * (0.3 + 0.14 * (index % 3));
  const cy = by + bh * 0.42;
  const r = Math.min(bw, bh) * 0.2;
  ctx.fillStyle = 'rgba(255, 190, 90, 0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 6, 20, 0.8)';
  ctx.lineWidth = Math.max(3, r * 0.14);
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.4);
  ctx.quadraticCurveTo(cx + r * 0.12, cy + r * 1.6, cx - r * 0.06, by + bh);
  ctx.stroke();
  for (let frond = 0; frond < 5; frond++) {
    const angle = Math.PI * (0.08 + frond * 0.21);
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.35);
    ctx.quadraticCurveTo(
      cx + Math.cos(angle) * r * 1.5, cy + r * 0.35 - Math.sin(angle) * r * 1.1,
      cx + Math.cos(angle) * r * 2.1, cy + r * 0.75 - Math.sin(angle) * r * 1.2,
    );
    ctx.stroke();
  }
}

/** Lays the grade's wash and a vignette over the whole collage. */
function applyGradeWash(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(0.55, grade.washMid);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Bright separator strokes between panels plus a clean outer frame. */
function strokePanels(ctx, w, h, layout) {
  const unit = Math.min(w, h);
  for (const panelDef of layout.panels) {
    tracePanel(ctx, panelDef.points, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.96)';
    ctx.lineWidth = unit * 0.007;
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.96)';
  ctx.lineWidth = unit * 0.01;
  ctx.strokeRect(0, 0, w, h);
}

/** Fits a font size so `text` spans at most `maxWidth`. */
function fitFontSize(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  const set = () => { ctx.font = `italic 900 ${size}px ${family}`; };
  set();
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size *= 0.94;
    set();
  }
  return size;
}

/** The caption block: three stacked rows — kicker, subtitle bar, and the
 *  big outlined title — measured first, then placed as one stack at the
 *  foot of the cover (or flipped to its head), so the rows never overlap. */
function drawCaption(ctx, w, h, state) {
  const grade = state.grade;
  const atTop = state.captionAt === 'top';
  const unit = Math.min(w, h);
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const kicker = (state.kicker || '').trim().toUpperCase();
  if (!title && !subtitle && !kicker) return;
  ctx.save();
  ctx.textAlign = 'center';

  // Measure every row before placing anything.
  const titleSize = title ? fitFontSize(ctx, title, w * 0.92, unit * 0.155, 'Arial Black, Arial, sans-serif') : 0;
  const titleWidth = title ? ctx.measureText(title).width : 0;
  const subSize = subtitle ? fitFontSize(ctx, subtitle, w * 0.8, unit * 0.045, 'Arial, sans-serif') : 0;
  const subWidth = subtitle ? ctx.measureText(subtitle).width + unit * 0.05 : 0;
  const kickSize = kicker ? fitFontSize(ctx, kicker, w * 0.62, unit * 0.034, 'Arial, sans-serif') : 0;

  const gap = unit * 0.022;
  const titleH = titleSize * 1.02;
  const subH = subSize * 1.5;
  const kickH = kickSize * 1.1;
  const stackH = titleH + (subtitle ? gap + subH : 0) + (kicker ? gap + kickH : 0);
  const margin = unit * 0.05;
  // `top` is the stack's upper edge; rows are laid out downward from it.
  const top = atTop ? margin : h - margin - stackH;

  // Soft scrim behind the lettering so it survives busy photos.
  const scrimH = stackH + margin * 1.6;
  const scrim = ctx.createLinearGradient(0, atTop ? 0 : h - scrimH, 0, atTop ? scrimH : h);
  scrim.addColorStop(0, atTop ? 'rgba(5,2,12,0.55)' : 'rgba(5,2,12,0)');
  scrim.addColorStop(1, atTop ? 'rgba(5,2,12,0)' : 'rgba(5,2,12,0.55)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, atTop ? 0 : h - scrimH, w, scrimH);

  // Reading order is kicker, subtitle, title — bottom-anchored stacks are
  // placed title-first from the foot so the order reads the same.
  const order = atTop ? ['kicker', 'subtitle', 'title'] : ['title', 'subtitle', 'kicker'];
  let y = top;
  for (const row of order) {
    if (row === 'kicker' && kicker) {
      ctx.font = `italic 900 ${kickSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.letterSpacing = `${Math.round(kickSize * 0.32)}px`;
      ctx.fillText(kicker, w / 2, y + kickSize);
      ctx.letterSpacing = '0px';
      y += kickH + gap;
    }
    if (row === 'subtitle' && subtitle) {
      ctx.font = `italic 900 ${subSize}px Arial, sans-serif`;
      ctx.fillStyle = grade.accent;
      ctx.fillRect(w / 2 - subWidth / 2, y, subWidth, subH);
      ctx.fillStyle = '#0b0614';
      ctx.textBaseline = 'middle';
      ctx.fillText(subtitle, w / 2, y + subH * 0.54);
      ctx.textBaseline = 'alphabetic';
      y += subH + gap;
    }
    if (row === 'title' && title) {
      ctx.font = `italic 900 ${titleSize}px Arial Black, Arial, sans-serif`;
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = titleSize * 0.16;
      ctx.shadowOffsetY = titleSize * 0.05;
      ctx.strokeStyle = '#12061f';
      ctx.lineWidth = titleSize * 0.16;
      ctx.strokeText(title, w / 2, y + titleSize * 0.92);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, w / 2, y + titleSize * 0.92);
      // A thin accent rule directly under the title, echoing mastheads.
      ctx.fillStyle = grade.accent;
      ctx.fillRect(w / 2 - titleWidth / 2, y + titleSize * 1.06, titleWidth, titleSize * 0.07);
      y += titleH + gap;
    }
  }
  ctx.restore();
}

/** Draws the whole cover described by `state` onto `ctx` at w x h pixels. */
export function renderCover(ctx, w, h, state) {
  ctx.save();
  ctx.fillStyle = state.grade.skyline;
  ctx.fillRect(0, 0, w, h);
  state.layout.panels.forEach((panelDef, index) => {
    drawPanelPhoto(ctx, w, h, panelDef, state.panels[index], state.grade, index);
  });
  applyGradeWash(ctx, w, h, state.grade);
  strokePanels(ctx, w, h, state.layout);
  drawCaption(ctx, w, h, state);
  ctx.restore();
}

/** Renders a cover state to a fresh offscreen canvas at an exact size. */
export function renderCoverCanvas(w, h, state) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas.getContext('2d'), w, h, state);
  return canvas;
}
