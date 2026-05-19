/* =============================================
   NORSU CAMPUS NAVIGATION SYSTEM — SCRIPT.JS
   Dynamic Start/Destination | Accurate Routes
   Voice Navigation | Modern UI
   ============================================= */

// ───────────── STATE ─────────────
let voiceEnabled = { 1: true, 2: true };
const speechSynth = window.speechSynthesis;
let toastTimer = null;

// ───────────── LOCATION METADATA ─────────────
// Campus 1 viewBox: 0 0 1040 880
// Map analysis: Main Gate bottom-center (~470,855)
// Pathways: main vertical corridor ~x=440-470, north horizontal ~y=175
// West side buildings along x~230-370, East side x~820-1020

const campus1Locations = {
  'main-gate':     { x: 466, y: 852, label: 'Main Gate' },
  'guard-house':   { x: 392, y: 830, label: 'Guard House' },
  'open-field':    { x: 620, y: 760, label: 'Open Field' },
  'cea':           { x: 306, y: 720, label: 'CEA' },
  'mech-eng':      { x: 307, y: 510, label: 'Mech. Eng.' },
  'ccje-lower':    { x: 307, y: 365, label: 'CCJE Lower' },
  'ccje-upper':    { x: 307, y: 185, label: 'CCJE Upper' },
  'canteen':       { x: 462, y: 118, label: 'Canteen' },
  'cit':           { x: 732, y: 118, label: 'CIT' },
  'maritime':      { x: 942, y: 107, label: 'Maritime' },
  'ccje-aviation': { x: 620, y: 387, label: 'Aviation Bldg' },
  'sts':           { x: 934, y: 523, label: 'STS' },
  'aviation-area': { x: 748, y: 563, label: 'Aviation Area' }
};

// Campus 2 viewBox: 0 0 1320 880
// Analysis from map image:
// Gate 1: top-center (~560,42), Gate 2: right-mid (~1190,318)
// Gate 3: bottom-center (~870,858), Gate 4: top-left (~220,42)
// Main corridor: vertical x~800-810 from Gate1 southward
// North horizontal: y~80-100 between gates 1 and 4

const campus2Locations = {
  'gate1':         { x: 560, y: 42,  label: 'Gate 1' },
  'gate2':         { x: 1190, y: 318, label: 'Gate 2' },
  'gate3':         { x: 870, y: 858, label: 'Gate 3' },
  'gate4':         { x: 220, y: 42,  label: 'Gate 4' },
  'cba-cthm':      { x: 230, y: 148, label: 'CBA & CTHM' },
  'info-tech':     { x: 543, y: 130, label: 'Info Tech' },
  'cas':           { x: 840, y: 130, label: 'CAS' },
  'norsu-complex': { x: 395, y: 278, label: 'Sports Complex' },
  'cnpahs':        { x: 310, y: 395, label: 'CNPAHS' },
  'pe-bldg':       { x: 510, y: 398, label: 'P.E. Bldg' },
  'automotive':    { x: 658, y: 398, label: 'Automotive' },
  'admin':         { x: 1145, y: 228, label: 'Admin' },
  'canteen2':      { x: 808, y: 476, label: 'Canteen' },
  'cit2':          { x: 858, y: 530, label: 'CIT' },
  'supply':        { x: 795, y: 534, label: 'Supply Office' },
  'sao':           { x: 808, y: 608, label: 'SAO' },
  'care-center':   { x: 800, y: 686, label: 'Care Center' },
  'cted':          { x: 840, y: 800, label: 'CTED' },
  'law':           { x: 1020, y: 810, label: 'Law' },
  'grad-school':   { x: 1190, y: 510, label: 'Grad School' }
};

// ───────────── PATHWAY NETWORK ─────────────
// Campus 1: Key pathway nodes on the white corridors
// Main vertical spine: x≈440, from y≈852 up to y≈160
// North horizontal: y≈175, from x≈440 to x≈970
// West horizontal stubs at building levels
// Inner courtyard entry: x≈500, y≈400 (inside)

const C1_SPINE_X = 440;   // main vertical pathway x
const C1_NORTH_Y = 175;   // top horizontal corridor y
const C1_WEST_OUT_X = 390; // west-side stub to buildings

// Campus 2: Key pathway nodes
// North corridor: y≈80 (top road between Gate 4 and Gate 1)
// Vertical main spine going south: x≈800 from Gate1
// East spine: x≈1190 (Gate 2 side road)

const C2_NORTH_Y  = 80;   // top road y
const C2_SPINE_X  = 800;  // main south corridor x
const C2_EAST_X   = 1190; // east road x
const C2_MID_Y    = 200;  // first major east-west junction y
const C2_SOUTH_Y  = 805;  // near Gate 3 road y

// ───────────── ROUTE GENERATION ─────────────
// Generates path string by routing through pathway nodes.
// Uses an A*-like grid with predefined waypoints.

function buildC1Path(startId, destId) {
  if (startId === destId) return { path: '', steps: alreadyHereSteps(campus1Locations[startId]) };

  const s = campus1Locations[startId];
  const d = campus1Locations[destId];

  // Define each location's pathway entry point on the main spine
  // (where to "plug in" to the main corridor)
  const c1Entry = {
    'main-gate':     { x: C1_SPINE_X, y: 852 },
    'guard-house':   { x: C1_SPINE_X, y: 840 },
    'open-field':    { x: C1_SPINE_X, y: 700 },
    'cea':           { x: C1_SPINE_X, y: 720 },
    'mech-eng':      { x: C1_SPINE_X, y: 510 },
    'ccje-lower':    { x: C1_SPINE_X, y: 365 },
    'ccje-upper':    { x: C1_SPINE_X, y: 185 },
    'canteen':       { x: C1_SPINE_X, y: C1_NORTH_Y },
    'cit':           { x: 730,        y: C1_NORTH_Y },
    'maritime':      { x: 940,        y: C1_NORTH_Y },
    'ccje-aviation': { x: 500,        y: 400 },
    'sts':           { x: 870,        y: 600 },
    'aviation-area': { x: 620,        y: 560 }
  };

  const se = c1Entry[startId];
  const de = c1Entry[destId];

  // Left-side buildings connect via a west stub at their level
  const westBuildings = new Set(['guard-house','cea','mech-eng','ccje-lower','ccje-upper']);
  const northBuildings = new Set(['canteen','cit','maritime']);
  const centerBuildings = new Set(['ccje-aviation','sts','aviation-area','open-field']);

  let pts = [{ x: s.x, y: s.y }];

  // Get to spine
  if (westBuildings.has(startId)) {
    pts.push({ x: C1_WEST_OUT_X, y: s.y });
    pts.push({ x: C1_SPINE_X, y: s.y });
  } else if (northBuildings.has(startId)) {
    pts.push({ x: se.x, y: C1_NORTH_Y });
    pts.push({ x: C1_SPINE_X, y: C1_NORTH_Y });
  } else if (centerBuildings.has(startId)) {
    pts.push({ x: se.x, y: se.y });
    pts.push({ x: C1_SPINE_X, y: se.y });
  } else {
    // main-gate or already on spine
    pts.push({ x: C1_SPINE_X, y: s.y });
  }

  // Navigate spine to destination level
  const spineNow = pts[pts.length - 1];

  if (northBuildings.has(destId)) {
    // Go to top of spine then east
    if (spineNow.y !== C1_NORTH_Y) {
      pts.push({ x: C1_SPINE_X, y: C1_NORTH_Y });
    }
    pts.push({ x: de.x, y: C1_NORTH_Y });
    pts.push({ x: d.x, y: d.y });
  } else if (westBuildings.has(destId)) {
    // Go along spine to dest level then west
    if (spineNow.y !== de.y) {
      pts.push({ x: C1_SPINE_X, y: de.y });
    }
    pts.push({ x: C1_WEST_OUT_X, y: de.y });
    pts.push({ x: d.x, y: d.y });
  } else if (centerBuildings.has(destId)) {
    if (spineNow.y !== de.y) {
      pts.push({ x: C1_SPINE_X, y: de.y });
    }
    pts.push({ x: de.x, y: de.y });
    pts.push({ x: d.x, y: d.y });
  } else {
    // Destination is on or near the spine
    if (spineNow.y !== d.y) {
      pts.push({ x: C1_SPINE_X, y: d.y });
    }
    pts.push({ x: d.x, y: d.y });
  }

  const path = ptsToPath(pts);
  const steps = buildSteps(startId, destId, campus1Locations, pts);
  return { path, steps };
}

function buildC2Path(startId, destId) {
  if (startId === destId) return { path: '', steps: alreadyHereSteps(campus2Locations[startId]) };

  const s = campus2Locations[startId];
  const d = campus2Locations[destId];

  // Pathway entry nodes for each location
  const c2Entry = {
    'gate1':         { x: 560,        y: C2_NORTH_Y },
    'gate2':         { x: C2_EAST_X,  y: 318 },
    'gate3':         { x: 870,        y: C2_SOUTH_Y },
    'gate4':         { x: 220,        y: C2_NORTH_Y },
    'cba-cthm':      { x: 230,        y: C2_NORTH_Y },
    'info-tech':     { x: 543,        y: C2_NORTH_Y },
    'cas':           { x: 840,        y: C2_NORTH_Y },
    'norsu-complex': { x: 395,        y: C2_MID_Y },
    'cnpahs':        { x: 310,        y: 398 },
    'pe-bldg':       { x: 510,        y: 398 },
    'automotive':    { x: 658,        y: 398 },
    'admin':         { x: C2_EAST_X,  y: 228 },
    'canteen2':      { x: C2_SPINE_X, y: 476 },
    'cit2':          { x: C2_SPINE_X, y: 530 },
    'supply':        { x: C2_SPINE_X, y: 534 },
    'sao':           { x: C2_SPINE_X, y: 608 },
    'care-center':   { x: C2_SPINE_X, y: 686 },
    'cted':          { x: C2_SPINE_X, y: C2_SOUTH_Y },
    'law':           { x: 1020,       y: C2_SOUTH_Y },
    'grad-school':   { x: C2_EAST_X,  y: 510 }
  };

  const se = c2Entry[startId];
  const de = c2Entry[destId];

  const northGroup  = new Set(['gate1','gate2','gate4','cba-cthm','info-tech','cas','admin']);
  const southGroup  = new Set(['gate3','cted','law']);
  const spineGroup  = new Set(['canteen2','cit2','supply','sao','care-center']);
  const westGroup   = new Set(['norsu-complex','cnpahs','pe-bldg','automotive']);
  const eastGroup   = new Set(['gate2','admin','grad-school']);

  let pts = [{ x: s.x, y: s.y }];

  // Helper: get onto a highway node
  function enterMainNet(id, loc) {
    const e = c2Entry[id];
    if (northGroup.has(id)) {
      if (loc.y !== C2_NORTH_Y) pts.push({ x: loc.x, y: C2_NORTH_Y });
    } else if (southGroup.has(id)) {
      pts.push({ x: e.x, y: C2_SOUTH_Y });
    } else if (spineGroup.has(id)) {
      pts.push({ x: C2_SPINE_X, y: loc.y });
    } else if (westGroup.has(id)) {
      pts.push({ x: e.x, y: e.y });
      // connect westGroup to main axis
      pts.push({ x: C2_SPINE_X, y: e.y });
    } else if (eastGroup.has(id)) {
      pts.push({ x: C2_EAST_X, y: e.y });
    }
  }

  // Enter network from start
  const se_final = { x: se.x, y: se.y };
  if (northGroup.has(startId)) {
    pts.push({ x: s.x, y: C2_NORTH_Y });
  } else if (southGroup.has(startId)) {
    pts.push({ x: se.x, y: C2_SOUTH_Y });
  } else if (spineGroup.has(startId)) {
    pts.push({ x: C2_SPINE_X, y: s.y });
  } else if (westGroup.has(startId)) {
    pts.push({ x: se.x, y: se.y });
    pts.push({ x: C2_SPINE_X, y: se.y });
  } else if (eastGroup.has(startId)) {
    pts.push({ x: C2_EAST_X, y: se.y });
  }

  const cur = pts[pts.length - 1];

  // Route to destination
  if (northGroup.has(destId)) {
    // Go to north corridor
    if (!northGroup.has(startId)) {
      // Need to get to Gate1 junction first
      if (spineGroup.has(startId) || westGroup.has(startId)) {
        pts.push({ x: C2_SPINE_X, y: C2_MID_Y });
        pts.push({ x: 560, y: C2_MID_Y });
        pts.push({ x: 560, y: C2_NORTH_Y });
      } else if (southGroup.has(startId)) {
        pts.push({ x: C2_SPINE_X, y: C2_MID_Y });
        pts.push({ x: 560, y: C2_MID_Y });
        pts.push({ x: 560, y: C2_NORTH_Y });
      }
    }
    pts.push({ x: de.x, y: C2_NORTH_Y });
    pts.push({ x: d.x, y: d.y });
  } else if (eastGroup.has(destId)) {
    if (!eastGroup.has(startId)) {
      pts.push({ x: C2_EAST_X, y: cur.y > C2_NORTH_Y ? cur.y : C2_NORTH_Y });
    }
    pts.push({ x: C2_EAST_X, y: de.y });
    pts.push({ x: d.x, y: d.y });
  } else if (southGroup.has(destId)) {
    if (!southGroup.has(startId)) {
      pts.push({ x: C2_SPINE_X, y: cur.y < C2_SOUTH_Y ? C2_SOUTH_Y : cur.y });
    }
    pts.push({ x: de.x, y: C2_SOUTH_Y });
    pts.push({ x: d.x, y: d.y });
  } else if (spineGroup.has(destId)) {
    pts.push({ x: C2_SPINE_X, y: de.y });
    pts.push({ x: d.x, y: d.y });
  } else if (westGroup.has(destId)) {
    // Go through Gate1 y-level to west area
    pts.push({ x: C2_SPINE_X, y: C2_MID_Y });
    pts.push({ x: de.x, y: C2_MID_Y });
    pts.push({ x: de.x, y: de.y });
    pts.push({ x: d.x, y: d.y });
  }

  // Deduplicate consecutive identical points
  const clean = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i], q = clean[clean.length - 1];
    if (Math.abs(p.x - q.x) > 2 || Math.abs(p.y - q.y) > 2) {
      clean.push(p);
    }
  }

  const path = ptsToPath(clean);
  const steps = buildSteps(startId, destId, campus2Locations, clean);
  return { path, steps };
}

function ptsToPath(pts) {
  if (!pts || pts.length < 2) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

function alreadyHereSteps(loc) {
  return [`You are already at ${loc.label}. You have arrived!`];
}

function buildSteps(startId, destId, locs, pts) {
  const sName = locs[startId].label;
  const dName = locs[destId].label;
  const steps = [];

  steps.push(`Start at ${sName}.`);

  // Analyze turns from path
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], cur = pts[i], next = pts[i + 1];
    const dxIn  = cur.x - prev.x,  dyIn  = cur.y - prev.y;
    const dxOut = next.x - cur.x,  dyOut = next.y - cur.y;

    const dir = getTurnDirection(dxIn, dyIn, dxOut, dyOut);
    const heading = getCardinal(dxOut, dyOut);

    if (dir === 'straight') {
      steps.push(`Continue ${heading}.`);
    } else {
      steps.push(`Turn ${dir} and head ${heading}.`);
    }
  }

  steps.push(`You have arrived at ${dName}.`);
  return steps;
}

function getTurnDirection(dxIn, dyIn, dxOut, dyOut) {
  const cross = dxIn * dyOut - dyIn * dxOut;
  const dot   = dxIn * dxOut + dyIn * dyOut;
  if (Math.abs(cross) < 10) return 'straight';
  // In screen coords: positive Y is down
  if (cross > 0) return 'right';
  return 'left';
}

function getCardinal(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'east' : 'west';
  }
  return dy > 0 ? 'south' : 'north';
}

function buildVoice(startId, destId, steps, locs) {
  const s = locs[startId].label;
  const d = locs[destId].label;
  if (startId === destId) return `You are already at ${s}.`;
  const middle = steps.slice(1, -1).join(' ');
  return `Starting from ${s}. ${middle} You have arrived at ${d}.`;
}

// ───────────── PAGE NAVIGATION ─────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'exit'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

function goTo(pageId) {
  const current = document.querySelector('.page.active');
  if (current) {
    current.classList.add('exit');
    setTimeout(() => {
      current.classList.remove('active', 'exit');
      showPage(pageId);
    }, 340);
  } else {
    showPage(pageId);
  }
  stopSpeech();
}

function openCampus(campusId) {
  const pageId = campusId === 'campus1' ? 'page-map-campus1' : 'page-map-campus2';
  goTo(pageId);
  const num = campusId === 'campus1' ? 1 : 2;
  setTimeout(() => initMap(num), 420);
}

// ───────────── MAP INIT ─────────────
function initMap(num) {
  const loader = document.getElementById(`map-load-${num}`);
  const img    = document.getElementById(`campus${num}-img`);
  if (!img) return;

  const hide = () => loader && loader.classList.add('hidden');
  if (img.complete) hide();
  else { img.onload = hide; img.onerror = hide; }

  // Set default dest different from start
  const destSel = document.getElementById(`dest-select-${num}`);
  if (destSel) destSel.selectedIndex = num === 1 ? 3 : 4; // cea or cba-cthm

  // Don't auto-draw; wait for user to click Navigate
}

// ───────────── NAVIGATE (user action) ─────────────
function navigate(num) {
  const startSel = document.getElementById(`start-select-${num}`);
  const destSel  = document.getElementById(`dest-select-${num}`);
  if (!startSel || !destSel) return;

  const startId = startSel.value;
  const destId  = destSel.value;

  if (startId === destId) {
    showToast('Select different start & destination!');
    return;
  }

  const result = num === 1
    ? buildC1Path(startId, destId)
    : buildC2Path(startId, destId);

  const locs = num === 1 ? campus1Locations : campus2Locations;
  drawRoute(num, result.path, locs[startId], locs[destId]);
  showDirections(num, result.steps);

  if (voiceEnabled[num]) {
    const vText = buildVoice(startId, destId, result.steps, locs);
    speak(vText);
  }

  showToast(`Route: ${locs[startId].label} → ${locs[destId].label}`);
}

// ───────────── SWAP LOCATIONS ─────────────
function swapLocations(num) {
  const startSel = document.getElementById(`start-select-${num}`);
  const destSel  = document.getElementById(`dest-select-${num}`);
  if (!startSel || !destSel) return;

  const tmp = startSel.value;
  startSel.value = destSel.value;
  destSel.value  = tmp;
}

// ───────────── RESET ROUTE ─────────────
function resetRoute(num) {
  // Clear path
  const routePath   = document.getElementById(`route-path-${num}`);
  const routeShadow = document.getElementById(`route-shadow-${num}`);
  const destMarker  = document.getElementById(`dest-marker-${num}`);
  const startMarker = document.getElementById(`start-marker-${num}`);
  const destRing    = document.getElementById(`dest-ring-${num}`);
  const startRing   = document.getElementById(`start-ring-${num}`);
  const startLabel  = document.getElementById(`start-label-${num}`);
  const destLabel   = document.getElementById(`dest-label-${num}`);

  [routePath, routeShadow].forEach(el => el && el.setAttribute('d', ''));
  [destMarker, startMarker, destRing, startRing].forEach(el => {
    if (el) { el.setAttribute('cx', -99); el.setAttribute('cy', -99); }
  });
  [startLabel, destLabel].forEach(el => {
    if (el) { el.setAttribute('x', -99); el.setAttribute('y', -99); el.textContent = ''; }
  });

  // Reset dropdowns
  const startSel = document.getElementById(`start-select-${num}`);
  const destSel  = document.getElementById(`dest-select-${num}`);
  if (startSel) startSel.selectedIndex = 0;
  if (destSel)  destSel.selectedIndex  = num === 1 ? 3 : 4;

  // Clear directions
  const stepsEl = document.getElementById(`dir-steps-${num}`);
  if (stepsEl) {
    stepsEl.innerHTML = '<div class="dir-placeholder">Select a start point and destination, then tap NAVIGATE</div>';
  }
  const distEl = document.getElementById(`dir-dist-${num}`);
  if (distEl) distEl.textContent = '';

  stopSpeech();
  showToast('Route cleared');
}

// ───────────── DRAW ROUTE ─────────────
function drawRoute(num, pathStr, startLoc, destLoc) {
  const routePath   = document.getElementById(`route-path-${num}`);
  const routeShadow = document.getElementById(`route-shadow-${num}`);
  const destMarker  = document.getElementById(`dest-marker-${num}`);
  const startMarker = document.getElementById(`start-marker-${num}`);
  const destRing    = document.getElementById(`dest-ring-${num}`);
  const startRing   = document.getElementById(`start-ring-${num}`);
  const startLabel  = document.getElementById(`start-label-${num}`);
  const destLabel   = document.getElementById(`dest-label-${num}`);

  if (!routePath) return;

  // Reset animation
  routePath.style.animation = 'none';
  routePath.getBoundingClientRect();
  routePath.style.animation = '';

  routePath.setAttribute('d', pathStr);
  if (routeShadow) routeShadow.setAttribute('d', pathStr);

  // Start marker
  if (startMarker && startLoc) {
    startMarker.setAttribute('cx', startLoc.x);
    startMarker.setAttribute('cy', startLoc.y);
  }
  if (startRing && startLoc) {
    startRing.setAttribute('cx', startLoc.x);
    startRing.setAttribute('cy', startLoc.y);
  }
  if (startLabel && startLoc) {
    startLabel.setAttribute('x', startLoc.x);
    startLabel.setAttribute('y', startLoc.y - 16);
    startLabel.textContent = startLoc.label;
  }

  // Destination marker
  if (destMarker && destLoc && pathStr) {
    destMarker.setAttribute('cx', destLoc.x);
    destMarker.setAttribute('cy', destLoc.y);
  } else if (destMarker) {
    destMarker.setAttribute('cx', -99);
    destMarker.setAttribute('cy', -99);
  }
  if (destRing && destLoc && pathStr) {
    destRing.setAttribute('cx', destLoc.x);
    destRing.setAttribute('cy', destLoc.y);
  } else if (destRing) {
    destRing.setAttribute('cx', -99);
    destRing.setAttribute('cy', -99);
  }
  if (destLabel && destLoc && pathStr) {
    destLabel.setAttribute('x', destLoc.x);
    destLabel.setAttribute('y', destLoc.y - 18);
    destLabel.textContent = destLoc.label;
  }

  // Estimate distance
  const distEl = document.getElementById(`dir-dist-${num}`);
  if (distEl && pathStr) {
    const approxPx = estimatePathLength(pathStr);
    // 1px ≈ 0.5 meters (rough campus scale)
    const meters = Math.round(approxPx * 0.5);
    const mins   = Math.max(1, Math.round(meters / 80)); // 80m/min walking
    distEl.textContent = `~${meters}m · ${mins} min walk`;
  }
}

function estimatePathLength(pathStr) {
  const pairs = pathStr.match(/[ML](\d+\.?\d*),(\d+\.?\d*)/g);
  if (!pairs || pairs.length < 2) return 0;
  const coords = pairs.map(p => {
    const m = p.match(/([ML])(\d+\.?\d*),(\d+\.?\d*)/);
    return { x: parseFloat(m[2]), y: parseFloat(m[3]) };
  });
  let len = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i-1].x;
    const dy = coords[i].y - coords[i-1].y;
    len += Math.sqrt(dx*dx + dy*dy);
  }
  return len;
}

// ───────────── SHOW DIRECTIONS ─────────────
function showDirections(num, steps) {
  const container = document.getElementById(`dir-steps-${num}`);
  if (!container) return;
  container.innerHTML = '';
  steps.forEach((step, i) => {
    const isLast = i === steps.length - 1;
    const el = document.createElement('div');
    el.className = 'dir-step';
    el.innerHTML = `
      <div class="dir-step-num ${isLast ? 'arrived' : ''}">${isLast ? '✓' : i + 1}</div>
      <div>${step}</div>
    `;
    container.appendChild(el);
  });
}

// ───────────── VOICE ─────────────
function toggleVoice(num) {
  voiceEnabled[num] = !voiceEnabled[num];
  updateVoiceButton(num);
  const state = voiceEnabled[num] ? 'on' : 'off';
  showToast(`Voice guidance ${state}`);
  if (!voiceEnabled[num]) stopSpeech();
}

function updateVoiceButton(num) {
  const btn = document.getElementById(`voice-btn-${num}`);
  if (!btn) return;
  const enabled = voiceEnabled[num];
  btn.classList.toggle('muted', !enabled);
  btn.title = enabled ? 'Voice guidance enabled' : 'Voice guidance disabled';
  btn.setAttribute('aria-pressed', String(enabled));
  btn.setAttribute('aria-label', btn.title);

  const icon = btn.querySelector('svg');
  if (icon) {
    icon.style.opacity = enabled ? '1' : '0.4';
    icon.style.filter = enabled ? 'none' : 'grayscale(1)';
  }
}

function speak(text) {
  if (!speechSynth) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate  = 0.92;
  utterance.pitch = 1.0;
  utterance.lang  = 'en-PH';
  // Prefer a natural voice if available
  const voices = speechSynth.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
  );
  if (preferred) utterance.voice = preferred;
  speechSynth.speak(utterance);
}

function stopSpeech() {
  if (speechSynth && speechSynth.speaking) speechSynth.cancel();
}

// ───────────── TOAST ─────────────
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ───────────── KEYBOARD SUPPORT ─────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    stopSpeech();
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    if (activePage.id.startsWith('page-map')) goTo('page-campus');
    else if (activePage.id === 'page-campus') goTo('page-welcome');
  }
  // Enter to navigate
  if (e.key === 'Enter') {
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'page-map-campus1') navigate(1);
    if (activePage && activePage.id === 'page-map-campus2') navigate(2);
  }
});

// ───────────── TOUCH PINCH ZOOM ─────────────
(function () {
  let lastDist = 0, scale = 1;
  function dist(t) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  }
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) lastDist = dist(e.touches);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 2) return;
    const d = dist(e.touches);
    if (lastDist > 0) {
      const factor = d / lastDist;
      scale = Math.min(Math.max(scale * factor, 0.6), 4);
      [1, 2].forEach(n => {
        const wrap = document.getElementById(`map-wrap-${n}`);
        if (wrap) {
          const img = wrap.querySelector('.campus-map-img');
          if (img) img.style.transform = `scale(${scale})`;
        }
      });
    }
    lastDist = d;
  }, { passive: true });
})();

// Initialize voice buttons so the UI matches the default enabled state.
updateVoiceButton(1);
updateVoiceButton(2);
