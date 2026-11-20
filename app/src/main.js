// Cover Studio editor: wires the page controls to the cover renderer.
// Photos never leave the machine — uploads are read as object URLs and the
// two bundled samples load from ./samples/. The preview canvas and the
// exported PNG share one renderer (./render.js), so what you see is the
// file you get.
import { LAYOUTS, layoutById, pointInPanel } from './layouts.js';
import { GRADES, gradeById } from './grade.js';
import { renderCover, renderCoverCanvas } from './render.js';
import { runShot } from './shots.js';

export const EXPORT_SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const els = {
  canvas: document.getElementById('stage'),
  fileInput: document.getElementById('file-input'),
  tray: document.getElementById('photo-tray'),
  layoutList: document.getElementById('layout-list'),
  gradeList: document.getElementById('grade-list'),
  sizeSelect: document.getElementById('size-select'),
  title: document.getElementById('title-input'),
  subtitle: document.getElementById('subtitle-input'),
  kicker: document.getElementById('kicker-input'),
  captionAt: document.getElementById('caption-pos'),
  panelList: document.getElementById('panel-list'),
  zoom: document.getElementById('zoom-range'),
  status: document.getElementById('status'),
};

const state = {
  layoutId: 'poster-five',
  gradeId: 'vice-sunset',
  sizeKey: '1080x1080',
  slots: [],
  selectedPanel: 0,
  title: 'Neon Getaway',
  subtitle: 'Vice Heat',
  kicker: 'Cover Studio Original',
  captionAt: 'bottom',
};

/** The photo library: every photo the user added, in arrival order. */
const library = [];

/** The render state the renderer consumes, rebuilt from the editor state. */
function currentCoverState() {
  return {
    layout: layoutById(state.layoutId),
    grade: gradeById(state.gradeId),
    panels: state.slots,
    title: state.title,
    subtitle: state.subtitle,
    kicker: state.kicker,
    captionAt: state.captionAt,
  };
}

/** Keeps one slot per layout panel, preserving assignments by index. */
function syncSlots() {
  const count = layoutById(state.layoutId).panels.length;
  while (state.slots.length < count) {
    state.slots.push({ image: null, panX: 0, panY: 0, zoom: 1 });
  }
  state.slots.length = count;
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

/** Repaints the preview at the chosen aspect, capped for responsiveness. */
function redraw() {
  syncSlots();
  const [fullW, fullH] = EXPORT_SIZES[state.sizeKey];
  const scale = Math.min(1, 880 / Math.max(fullW, fullH));
  els.canvas.width = Math.round(fullW * scale);
  els.canvas.height = Math.round(fullH * scale);
  renderCover(els.canvas.getContext('2d'), els.canvas.width, els.canvas.height, currentCoverState());
  renderPanelList();
  markSelectedControls();
}

function setStatus(message) {
  els.status.textContent = message;
}

/** Loads an image from any URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Adds an image to the library and offers it in the tray. */
function addToLibrary(img, name) {
  const entry = { img, name };
  library.push(entry);
  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = 'thumb';
  thumb.title = `Put “${name}” in the selected panel`;
  const pic = document.createElement('img');
  pic.src = img.src;
  pic.alt = name;
  const label = document.createElement('span');
  label.textContent = name;
  thumb.append(pic, label);
  thumb.addEventListener('click', () => {
    const placed = state.selectedPanel;
    assignPhoto(placed, entry);
    // Advance to the next panel so placing several photos is one click each.
    const count = layoutById(state.layoutId).panels.length;
    const nextEmpty = state.slots.findIndex((slot, index) => index > placed && !slot.image);
    state.selectedPanel = nextEmpty >= 0 ? nextEmpty : (placed + 1) % count;
    els.zoom.value = String(state.slots[state.selectedPanel]?.zoom ?? 1);
    setStatus(`${name} → panel ${placed + 1}. Panel ${state.selectedPanel + 1} is selected next.`);
    redraw();
  });
  els.tray.append(thumb);
  return entry;
}

/** Puts a library photo into a panel slot, resetting its framing. */
function assignPhoto(panelIndex, entry) {
  syncSlots();
  state.slots[panelIndex] = { image: entry.img, panX: 0, panY: 0, zoom: 1 };
}

/** Fills empty panels, in order, with the newest library photos. */
function fillEmptyPanels() {
  syncSlots();
  let cursor = 0;
  state.slots.forEach((slot, index) => {
    if (!slot.image && library[cursor]) {
      assignPhoto(index, library[cursor]);
      cursor++;
    }
  });
}

async function handleFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith('image/'));
  if (!files.length) return;
  for (const file of files) {
    const img = await loadImage(URL.createObjectURL(file));
    addToLibrary(img, file.name.replace(/\.[^.]+$/, ''));
  }
  fillEmptyPanels();
  setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} added — every panel is filled. Drag a photo on the cover to reframe it.`);
  redraw();
}

async function loadSample(name) {
  const img = await loadImage(`./samples/${name}.jpg`);
  return addToLibrary(img, name);
}

/** Builds the layout picker buttons. */
function buildLayoutPicker() {
  for (const layout of LAYOUTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.layoutId = layout.id;
    button.innerHTML = `<strong></strong><small></small>`;
    button.querySelector('strong').textContent = layout.name;
    button.querySelector('small').textContent = layout.blurb;
    button.addEventListener('click', () => {
      state.layoutId = layout.id;
      state.selectedPanel = 0;
      fillEmptyPanels();
      redraw();
    });
    els.layoutList.append(button);
  }
}

/** Builds the grade picker buttons with a live colour swatch. */
function buildGradePicker() {
  for (const grade of GRADES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice grade-choice';
    button.dataset.gradeId = grade.id;
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = `linear-gradient(180deg, ${grade.washTop}, ${grade.washBottom})`;
    const name = document.createElement('strong');
    name.textContent = grade.name;
    button.append(swatch, name);
    button.addEventListener('click', () => {
      state.gradeId = grade.id;
      redraw();
    });
    els.gradeList.append(button);
  }
}

/** Lists the panels; clicking one selects it for framing and assignment. */
function renderPanelList() {
  els.panelList.replaceChildren();
  layoutById(state.layoutId).panels.forEach((panelDef, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'panel-item' + (index === state.selectedPanel ? ' selected' : '');
    item.textContent = `${index + 1}. ${panelDef.label}${state.slots[index]?.image ? ' — photo set' : ' — empty'}`;
    item.addEventListener('click', () => {
      state.selectedPanel = index;
      els.zoom.value = String(state.slots[index]?.zoom ?? 1);
      redraw();
    });
    els.panelList.append(item);
  });
}

/** Highlights the active layout and grade buttons. */
function markSelectedControls() {
  els.layoutList.querySelectorAll('[data-layout-id]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.layoutId === state.layoutId);
  });
  els.gradeList.querySelectorAll('[data-grade-id]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.gradeId === state.gradeId);
  });
}

/** Pointer work on the canvas: click selects a panel, drag reframes it. */
function wireCanvasPointer() {
  let drag = null;
  const toNormalised = (event) => {
    const rect = els.canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
  };
  els.canvas.addEventListener('pointerdown', (event) => {
    const [x, y] = toNormalised(event);
    const layout = layoutById(state.layoutId);
    const hit = layout.panels.findIndex((panelDef) => pointInPanel(panelDef.points, x, y));
    if (hit >= 0) state.selectedPanel = hit;
    drag = { x: event.clientX, y: event.clientY };
    els.canvas.setPointerCapture(event.pointerId);
    redraw();
  });
  els.canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const slot = state.slots[state.selectedPanel];
    if (!slot || !slot.image) return;
    const rect = els.canvas.getBoundingClientRect();
    slot.panX = clampPan(slot.panX - ((event.clientX - drag.x) / rect.width) * 2.4);
    slot.panY = clampPan(slot.panY - ((event.clientY - drag.y) / rect.height) * 2.4);
    drag = { x: event.clientX, y: event.clientY };
    redraw();
  });
  const endDrag = () => { drag = null; };
  els.canvas.addEventListener('pointerup', endDrag);
  els.canvas.addEventListener('pointercancel', endDrag);
}

function clampPan(value) {
  return Math.max(-1, Math.min(1, value));
}

/** Exports the cover at the full chosen size as a PNG download. */
function exportPng() {
  const [w, h] = EXPORT_SIZES[state.sizeKey];
  const canvas = renderCoverCanvas(w, h, currentCoverState());
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cover-${state.sizeKey}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    setStatus(`Saved cover-${state.sizeKey}.png — ready to post.`);
  }, 'image/png');
}

function wireControls() {
  els.fileInput.addEventListener('change', () => handleFiles(els.fileInput.files ?? []));
  document.getElementById('sample-pier').addEventListener('click', async () => { await loadSample('pier'); fillEmptyPanels(); redraw(); });
  document.getElementById('sample-boulevard').addEventListener('click', async () => { await loadSample('boulevard'); fillEmptyPanels(); redraw(); });
  document.getElementById('fill-all').addEventListener('click', () => {
    const newest = library[library.length - 1];
    if (!newest) { setStatus('Add a photo first, then fill every panel with it.'); return; }
    state.slots.forEach((_, index) => assignPhoto(index, newest));
    setStatus(`Every panel now shows ${newest.name}.`);
    redraw();
  });
  document.getElementById('distribute').addEventListener('click', () => {
    if (!library.length) { setStatus('Add photos first, then spread them across the panels.'); return; }
    state.slots.forEach((_, index) => assignPhoto(index, library[index % library.length]));
    setStatus('Photos spread across the panels in order.');
    redraw();
  });
  els.sizeSelect.addEventListener('change', () => { state.sizeKey = els.sizeSelect.value; redraw(); });
  els.title.addEventListener('input', () => { state.title = els.title.value; redraw(); });
  els.subtitle.addEventListener('input', () => { state.subtitle = els.subtitle.value; redraw(); });
  els.kicker.addEventListener('input', () => { state.kicker = els.kicker.value; redraw(); });
  els.captionAt.addEventListener('change', () => { state.captionAt = els.captionAt.value; redraw(); });
  els.zoom.addEventListener('input', () => {
    const slot = state.slots[state.selectedPanel];
    if (slot) slot.zoom = Number(els.zoom.value);
    redraw();
  });
  document.getElementById('export-btn').addEventListener('click', exportPng);

  const stageWrap = document.getElementById('stage-wrap');
  stageWrap.addEventListener('dragover', (event) => { event.preventDefault(); stageWrap.classList.add('dragging'); });
  stageWrap.addEventListener('dragleave', () => stageWrap.classList.remove('dragging'));
  stageWrap.addEventListener('drop', (event) => {
    event.preventDefault();
    stageWrap.classList.remove('dragging');
    handleFiles(event.dataTransfer.files);
  });
}

/** Applies a screenshot scene: samples into panels, fixed words and size. */
async function applyShotScene(scene) {
  if (scene.layoutId) state.layoutId = scene.layoutId;
  if (scene.gradeId) state.gradeId = scene.gradeId;
  if (scene.title !== undefined) { state.title = scene.title; els.title.value = scene.title; }
  if (scene.subtitle !== undefined) { state.subtitle = scene.subtitle; els.subtitle.value = scene.subtitle; }
  if (scene.kicker !== undefined) { state.kicker = scene.kicker; els.kicker.value = scene.kicker; }
  if (scene.captionAt) { state.captionAt = scene.captionAt; els.captionAt.value = scene.captionAt; }
  const key = `${scene.size[0]}x${scene.size[1]}`;
  if (EXPORT_SIZES[key]) { state.sizeKey = key; els.sizeSelect.value = key; }
  const entries = [];
  for (const name of scene.photoNames) entries.push(await loadSample(name));
  syncSlots();
  state.slots.forEach((_, index) => {
    if (entries.length) assignPhoto(index, entries[index % entries.length]);
  });
  redraw();
  if (document.body.classList.contains('shot-cover')) {
    // In cover mode the canvas is the export itself, at full resolution.
    const [w, h] = EXPORT_SIZES[state.sizeKey];
    els.canvas.width = w;
    els.canvas.height = h;
    renderCover(els.canvas.getContext('2d'), w, h, currentCoverState());
  }
}

buildLayoutPicker();
buildGradePicker();
wireControls();
wireCanvasPointer();
syncSlots();
redraw();

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query, applyShotScene);
} else {
  setStatus('Add your photos, pick a layout and a grade, then export. Two sample scenes are built in.');
}
