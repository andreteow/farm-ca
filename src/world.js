// The first map: "Sunnyside Farm". An original three-lane layout.
// North (-z) is the farmhouse where the Hands start; south (+z) is the back pasture where the Herd starts.
import { mat, add, group, rboxGeo, sphereLoGeo as sphereGeo, cylGeo, coneGeo, canvasTexture, texMat, bakeTree, loadTexture } from './gfx.js';
import { rand } from './util.js';

const T = window.THREE;

const C = {
  barn: 0xd9463e, trim: 0xfff4e0, roof: 0x6f4a3c, stone: 0xbdb7aa, stoneCap: 0xdad5c8,
  hedgeA: 0x4f9f42, hedgeB: 0x66b84e, wood: 0xb98452, woodDark: 0x8f6238, hay: 0xf2cc5c, hayBand: 0xc9953a,
  crate: 0xcf9f5f, soil: 0x7a553c, cabbage: 0x9bdb72, pumpkin: 0xf08a24, tomato: 0xe5412d, carrot: 0xff9a3c,
  leaf: 0x58b03c, coop: 0xf6e7bd, coopRoof: 0xc55a43, house: 0xfff1d6, houseRoof: 0x5f8ec4, glass: 0xc8efe6,
  tractor: 0xe2443a, tyre: 0x34363c, hub: 0xffd24a, trunk: 0x8a5a36, treeA: 0x4fa846, treeB: 0x6cc257,
  water: 0x64c8f2, metal: 0x9aa3ad,
};

export function buildWorld(scene) {
  const boxes = [];
  const root = group(scene);
  const bushes = [];
  const animated = [];

  const solid = (x1, y1, z1, x2, y2, z2) => { const b = { x1, y1, z1, x2, y2, z2 }; boxes.push(b); return b; };
  // long walls are always modelled lengthwise and then turned, so wall patterns run the right way up
  const block = (x1, z1, x2, z2, h, color, r = 0.1, y = 0) => {
    solid(x1, y, z1, x2, y + h, z2);
    const w = x2 - x1, d = z2 - z1;
    if (d > w) return add(root, rboxGeo(d, h, w, r), color, (x1 + x2) / 2, y + h / 2, (z1 + z2) / 2, { r: [0, Math.PI / 2, 0] });
    return add(root, rboxGeo(w, h, d, r), color, (x1 + x2) / 2, y + h / 2, (z1 + z2) / 2);
  };
  // barn wall: red boards outside, pale timber lining inside
  const barnWall = (x1, z1, x2, z2, h, y = 0) => {
    block(x1, z1, x2, z2, h, texMat('planks'), 0.06, y);
    const w = x2 - x1, d = z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    if (d > w) add(root, rboxGeo(d, h, 0.08, 0.03), texMat('wood'), cx < -26 ? x2 + 0.02 : x1 - 0.02, y + h / 2, cz, { r: [0, Math.PI / 2, 0], cast: false });
    else add(root, rboxGeo(w, h, 0.08, 0.03), texMat('wood'), cx, y + h / 2, cz < -13 ? z2 + 0.02 : z1 - 0.02, { cast: false });
  };
  const deco = (w, h, d, color, x, y, z, r = 0.06, o) => add(root, rboxGeo(w, h, d, r), color, x, y, z, o);

  // ---------- walls ----------
  function stone(x1, z1, x2, z2, h = 2.8) {
    block(x1, z1, x2, z2, h, texMat('stone'), 0.14);
    deco(x2 - x1 + 0.24, 0.26, z2 - z1 + 0.24, C.stoneCap, (x1 + x2) / 2, h + 0.06, (z1 + z2) / 2, 0.1);
  }
  function hedge(x1, z1, x2, z2, h = 3) {
    solid(x1, 0, z1, x2, h, z2);
    const alongX = x2 - x1 >= z2 - z1;
    const len = alongX ? x2 - x1 : z2 - z1, thick = alongX ? z2 - z1 : x2 - x1;
    const n = Math.max(1, Math.round(len / 1.25));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = alongX ? x1 + len * t : (x1 + x2) / 2, z = alongX ? (z1 + z2) / 2 : z1 + len * t;
      const rr = thick * rand(0.72, 0.9);
      bushes.push({ x: x + rand(-0.1, 0.1), y: h * 0.48, z: z + rand(-0.1, 0.1), sx: alongX ? 0.95 : rr, sy: h * rand(0.5, 0.58), sz: alongX ? rr : 0.95, c: i % 2 ? C.hedgeA : C.hedgeB });
    }
  }
  function fence(x1, z1, x2, z2) {
    solid(x1, 0, z1, x2, 1.1, z2);
    const alongX = x2 - x1 >= z2 - z1;
    const len = alongX ? x2 - x1 : z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    for (const y of [0.45, 0.9]) deco(alongX ? len : 0.1, 0.14, alongX ? 0.1 : len, C.trim, cx, y, cz, 0.04);
    const n = Math.round(len / 1.75);
    for (let i = 0; i <= n; i++) {
      const t = i / n - 0.5;
      deco(0.2, 1.2, 0.2, C.trim, alongX ? cx + t * len : cx, 0.6, alongX ? cz : cz + t * len, 0.06);
    }
  }

  // ---------- props ----------
  function hay(x, z, turned = false, levels = 1) {
    const w = turned ? 1.0 : 1.6, d = turned ? 1.6 : 1.0;
    solid(x - w / 2, 0, z - d / 2, x + w / 2, 0.9 * levels, z + d / 2);
    for (let i = 0; i < levels; i++) {
      const y = 0.45 + i * 0.9;
      deco(w, 0.9, d, texMat('hay'), x, y, z, 0.16);
      for (const s of [-0.28, 0.28]) deco(turned ? w + 0.03 : 0.08, 0.93, turned ? 0.08 : d + 0.03, C.hayBand, turned ? x : x + s * w, y, turned ? z + s * d : z, 0.03);
    }
  }
  function crate(x, z, size = 1.2, levels = 1) {
    solid(x - size / 2, 0, z - size / 2, x + size / 2, size * levels, z + size / 2);
    for (let i = 0; i < levels; i++) {
      const y = size / 2 + i * size;
      deco(size, size, size, texMat('crate'), x, y, z, 0.07);
      deco(size + 0.04, 0.14, size + 0.04, C.woodDark, x, y + size / 2 - 0.1, z, 0.04);
      deco(size + 0.04, 0.14, size + 0.04, C.woodDark, x, y - size / 2 + 0.1, z, 0.04);
    }
  }
  function tree(x, z, s = 1, collide = true) {
    if (collide) solid(x - 0.4, 0, z - 0.4, x + 0.4, 5, z + 0.4);
    add(root, cylGeo(0.26 * s, 0.38 * s, 2.6 * s, 10), C.trunk, x, 1.3 * s, z);
    add(root, sphereGeo(), C.treeA, x, 3.5 * s, z, { s: [2.0 * s, 1.7 * s, 2.0 * s] });
    add(root, sphereGeo(), C.treeB, x + 0.9 * s, 4.3 * s, z + 0.3 * s, { s: 1.3 * s });
    add(root, sphereGeo(), C.treeB, x - 0.8 * s, 4.5 * s, z - 0.5 * s, { s: 1.15 * s });
  }
  function planter(x1, z1, x2, z2, crop) {
    block(x1, z1, x2, z2, 0.5, C.wood, 0.08);
    deco(x2 - x1 - 0.24, 0.1, z2 - z1 - 0.24, C.soil, (x1 + x2) / 2, 0.5, (z1 + z2) / 2, 0.04, { cast: false });
    const n = Math.floor((x2 - x1) / 0.8);
    for (let i = 0; i < n; i++) {
      const x = x1 + 0.5 + i * ((x2 - x1 - 1) / Math.max(1, n - 1)), z = (z1 + z2) / 2 + rand(-0.15, 0.15);
      if (crop === 'cabbage') add(root, sphereGeo(), C.cabbage, x, 0.68, z, { s: [0.3, 0.24, 0.3] });
      else if (crop === 'tomato') {
        add(root, cylGeo(0.03, 0.03, 0.9, 6), C.leaf, x, 0.95, z);
        add(root, sphereGeo(), C.leaf, x, 1.1, z, { s: [0.26, 0.32, 0.26] });
        add(root, sphereGeo(), C.tomato, x + 0.16, 1.0, z + 0.1, { s: 0.1 });
        add(root, sphereGeo(), C.tomato, x - 0.14, 1.2, z - 0.08, { s: 0.09 });
      } else add(root, coneGeo(0.16, 0.5, 7), C.leaf, x, 0.8, z);
    }
  }
  function pumpkin(x, z, s = 0.4) {
    add(root, sphereGeo(), C.pumpkin, x, s * 0.72, z, { s: [s, s * 0.74, s] });
    add(root, cylGeo(0.04, 0.06, 0.16, 6), C.leaf, x, s * 1.45, z);
  }
  function tractor(x, z) {
    solid(x - 1.7, 0, z - 0.95, x + 1.7, 1.75, z + 0.95);
    solid(x + 0.2, 1.75, z - 0.7, x + 1.5, 2.6, z + 0.7);
    deco(1.9, 0.85, 1.1, C.tractor, x - 0.7, 1.15, z, 0.2);
    deco(1.3, 1.5, 1.4, C.tractor, x + 0.85, 1.75, z, 0.2);
    deco(1.34, 0.6, 1.2, 0x2f3b4a, x + 0.85, 2.0, z, 0.1);
    deco(1.5, 0.12, 1.6, C.hub, x + 0.85, 2.58, z, 0.05);
    for (const s of [-1, 1]) {
      add(root, cylGeo(0.85, 0.85, 0.42, 20), C.tyre, x + 0.85, 0.85, z + s * 0.85, { r: [Math.PI / 2, 0, 0] });
      add(root, cylGeo(0.36, 0.36, 0.46, 14), C.hub, x + 0.85, 0.85, z + s * 0.85, { r: [Math.PI / 2, 0, 0] });
      add(root, cylGeo(0.46, 0.46, 0.3, 16), C.tyre, x - 1.15, 0.46, z + s * 0.72, { r: [Math.PI / 2, 0, 0] });
      add(root, cylGeo(0.2, 0.2, 0.34, 12), C.hub, x - 1.15, 0.46, z + s * 0.72, { r: [Math.PI / 2, 0, 0] });
      add(root, sphereGeo(), 0xfff7c9, x - 1.66, 1.2, z + s * 0.34, { s: 0.11 });
    }
    add(root, cylGeo(0.06, 0.06, 0.9, 8), C.metal, x - 1.0, 2.0, z + 0.3);
  }
  function well(x, z) {
    solid(x - 1, 0, z - 1, x + 1, 1.1, z + 1);
    add(root, cylGeo(1.05, 1.15, 1.1, 20), C.stone, x, 0.55, z);
    add(root, cylGeo(0.82, 0.82, 0.06, 20), 0x3a7fb5, x, 1.09, z, { cast: false });
    for (const s of [-1, 1]) deco(0.16, 1.9, 0.16, C.wood, x + s * 0.92, 1.9, z, 0.05);
    add(root, coneGeo(1.5, 0.9, 4), C.coopRoof, x, 3.25, z, { r: [0, Math.PI / 4, 0] });
    add(root, cylGeo(0.05, 0.05, 1.9, 6), C.woodDark, x, 2.7, z, { r: [0, 0, Math.PI / 2] });
    add(root, cylGeo(0.16, 0.13, 0.26, 10), C.wood, x + 0.2, 1.75, z);
  }
  function scarecrow(x, z) {
    solid(x - 0.25, 0, z - 0.25, x + 0.25, 2.2, z + 0.25);
    deco(0.12, 2.3, 0.12, C.woodDark, x, 1.15, z, 0.04);
    deco(1.7, 0.1, 0.1, C.woodDark, x, 1.65, z, 0.04);
    deco(0.62, 0.7, 0.3, 0x4f79c7, x, 1.5, z, 0.12);
    add(root, sphereGeo(), 0xe9cf9a, x, 2.15, z, { s: 0.27 });
    add(root, cylGeo(0.5, 0.5, 0.04, 16), C.hay, x, 2.36, z);
    add(root, coneGeo(0.24, 0.3, 12), C.hay, x, 2.5, z);
    for (const s of [-1, 1]) add(root, coneGeo(0.1, 0.3, 6), C.hay, x + s * 0.92, 1.65, z, { r: [0, 0, s * Math.PI / 2] });
  }
  function gableRoof(x1, x2, z1, z2, yB, yR, color, endColor, inset = 0.7) {
    const zm = (z1 + z2) / 2;
    const slopes = new T.BufferGeometry();
    slopes.setAttribute('position', new T.Float32BufferAttribute([
      x1, yB, z2, x2, yB, z2, x2, yR, zm, x1, yB, z2, x2, yR, zm, x1, yR, zm,
      x2, yB, z1, x1, yB, z1, x1, yR, zm, x2, yB, z1, x1, yR, zm, x2, yR, zm,
    ], 3));
    slopes.computeVertexNormals();
    const run = Math.hypot(zm - z1, yR - yB);
    slopes.setAttribute('uv', new T.Float32BufferAttribute([x1, 0, x2, 0, x2, run, x1, 0, x2, run, x1, run, x2, 0, x1, 0, x1, run, x2, 0, x1, run, x2, run], 2));
    add(root, slopes, color === 'shingle' ? texMat('shingle') : mat(color, { side: T.DoubleSide }));
    if (endColor !== undefined) {
      const ends = new T.BufferGeometry();
      const i1 = x1 + inset, i2 = x2 - inset;
      ends.setAttribute('position', new T.Float32BufferAttribute([
        i1, yB, z1, i1, yB, z2, i1, yR, zm, i2, yB, z2, i2, yB, z1, i2, yR, zm,
      ], 3));
      ends.computeVertexNormals();
      add(root, ends, mat(endColor, { side: T.DoubleSide }));
    }
  }
  function sign(x, z, letter, color) {
    deco(0.14, 3.4, 0.14, C.woodDark, x, 1.7, z, 0.05);
    const tex = canvasTexture(128, 128, (g) => {
      g.fillStyle = color; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
      g.lineWidth = 8; g.strokeStyle = '#fff8e6'; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke();
      g.fillStyle = '#fff8e6'; g.font = '900 84px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, 64, 70);
    });
    const m = new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide });
    const disc = new T.Mesh(new T.CircleGeometry(0.62, 28), m);
    disc.position.set(x, 3.3, z);
    root.add(disc);
    animated.push((t) => { disc.rotation.y = t * 0.8; });
  }

  // ---------- boundary ----------
  hedge(-41, -41, 41, -40, 3.4); hedge(-41, 40, 41, 41, 3.4); hedge(-41, -40, -40, 40, 3.4); hedge(40, -40, 41, 40, 3.4);

  // ---------- Site A: the Barn ----------
  const H = 4.5;
  barnWall(-34, -6.5, -28, -6, H); barnWall(-24, -6.5, -18, -6, H); barnWall(-28, -6.5, -24, -6, 1.5, 3);
  barnWall(-34, -20, -24, -19.5, H); barnWall(-21, -20, -18, -19.5, H); barnWall(-24, -20, -21, -19.5, 1.5, 3);
  barnWall(-34, -19.5, -33.5, -6.5, H);
  barnWall(-18.5, -19.5, -18, -15, H); barnWall(-18.5, -11, -18, -6.5, H); barnWall(-18.5, -15, -18, -11, 1.5, 3);
  gableRoof(-34.5, -17.5, -20.5, -5.5, H - 0.2, 8.2, 0xdcae72);
  gableRoof(-34.7, -17.3, -20.7, -5.3, H - 0.05, 8.4, 'shingle', C.barn);
  for (const [x, z] of [[-34, -6.25], [-18, -6.25], [-34, -19.75], [-18, -19.75]]) deco(0.62, H + 0.1, 0.62, C.trim, x, H / 2, z, 0.08);
  for (const x of [-28.1, -23.9]) deco(0.3, 3, 0.62, C.trim, x, 1.5, -6.25, 0.06);
  deco(4.5, 0.3, 0.62, C.trim, -26, 3.1, -6.25, 0.06);
  for (const z of [-15.1, -10.9]) deco(0.62, 3, 0.3, C.trim, -18.25, 1.5, z, 0.06);
  deco(0.62, 0.3, 4.5, C.trim, -18.25, 3.1, -13, 0.06);
  for (const x of [-24.1, -20.9]) deco(0.3, 3, 0.62, C.trim, x, 1.5, -19.75, 0.06);
  deco(3.5, 0.3, 0.62, C.trim, -22.5, 3.1, -19.75, 0.06);
  hay(-30, -14, false, 2); hay(-22, -12.5, true, 2); crate(-29, -9, 1.2, 1); hay(-26.5, -17.8, false, 1); crate(-20, -17.5, 1.2, 2);
  sign(-22.4, -4.6, 'A', '#e2443a');
  // silo beside the barn
  solid(-39, 0, -18, -35.6, 8, -14.6);
  add(root, cylGeo(1.7, 1.7, 7.5, 22), 0xdfe4ea, -37.3, 3.75, -16.3);
  add(root, sphereGeo(), C.barn, -37.3, 7.5, -16.3, { s: [1.72, 1.1, 1.72] });

  // ---------- Site B: the Veggie Garden ----------
  stone(12, -24, 13, -18); stone(12, -15, 13, -9);
  hedge(13, -24, 20, -23, 2.8); hedge(24, -24, 40, -23, 2.8);
  planter(16, -9, 22, -7.6, 'cabbage'); planter(16, -13, 22, -11.6, 'tomato'); planter(26, -8.6, 32, -7.2, 'carrot'); planter(26, -12.4, 30, -11, 'cabbage');
  scarecrow(24, -10.2);
  crate(21, -17, 1.3, 2); crate(22.4, -17, 1.2, 1);
  // greenhouse
  solid(29, 0, -21, 36, 3.2, -14);
  deco(7, 0.9, 7, C.trim, 32.5, 0.45, -17.5, 0.1);
  add(root, rboxGeo(6.8, 2.2, 6.8, 0.1), mat(C.glass, { transparent: true, opacity: 0.5 }), 32.5, 2.0, -17.5, { cast: false });
  for (const [x, z] of [[29.1, -20.9], [35.9, -20.9], [29.1, -14.1], [35.9, -14.1], [32.5, -14.1], [32.5, -20.9]]) deco(0.2, 3.2, 0.2, C.trim, x, 1.6, z, 0.05);
  deco(7.1, 0.2, 7.1, C.trim, 32.5, 3.15, -17.5, 0.06);
  for (let i = 0; i < 5; i++) add(root, sphereGeo(), i % 2 ? C.leaf : C.cabbage, 30.2 + i * 1.15, 1.35, -17.5 + (i % 2 ? 1.2 : -1.2), { s: [0.5, 0.7, 0.5], cast: false });
  // tool shed
  block(15, -22, 19, -19, 2.7, texMat('wood'), 0.1);
  deco(4.5, 0.2, 3.6, C.coopRoof, 17, 2.85, -20.5, 0.08, { r: [0.12, 0, 0] });
  deco(1.0, 1.9, 0.1, C.woodDark, 17, 0.95, -18.97, 0.04);
  for (const [x, z, s] of [[33.5, -10, 0.5], [34.6, -8.8, 0.38], [32.8, -5.4, 0.44], [14.6, -5, 0.4], [36.5, -11.6, 0.34]]) pumpkin(x, z, s);
  sign(22.6, -4.4, 'B', '#3f8fd9');

  // ---------- farmhouse and the Hands' start ----------
  block(-9, -40, 9, -35, 5, C.house, 0.12);
  gableRoof(-9.8, 9.8, -41, -34.2, 4.95, 8.2, C.houseRoof, C.house, 0.8);
  deco(18.6, 0.18, 2.4, C.houseRoof, 0, 3.1, -33.9, 0.06);
  for (const x of [-8.8, -3, 3, 8.8]) deco(0.2, 3.1, 0.2, C.trim, x, 1.55, -32.9, 0.06);
  deco(1.3, 2.3, 0.12, 0x9b5a3c, 0, 1.15, -34.95, 0.04);
  for (const x of [-6, -3.2, 3.2, 6]) { deco(1.3, 1.3, 0.1, 0x9fd6f2, x, 2.0, -34.96, 0.04); deco(1.5, 0.14, 0.16, C.trim, x, 1.3, -34.94, 0.04); }
  block(5.6, -38.6, 6.8, -37.4, 9.4, 0xc9705a, 0.1);
  hedge(-7, -27, 7, -26, 2.7);
  crate(-11.5, -31.5, 1.2, 1); crate(11.5, -31.5, 1.2, 2);

  // ---------- the Yard (between the two sites) ----------
  well(0, -15);
  tractor(-7, -21);
  hay(6, -10, false, 2); hay(-10, -8.6, true, 2); hay(-8.9, -8.6, true, 1); crate(8, -21, 1.3, 1); hay(3.5, -23, false, 1);

  // ---------- middle: the cornfield ----------
  stone(-11, -5, -8, -4); stone(-5, -5, 5, -4); stone(8, -5, 11, -4);
  stone(-12, -5, -11, 17); stone(-12, 20, -11, 26);
  stone(11, -5, 12, 17); stone(11, 20, 12, 26);
  fence(-11, 26, -4, 26.4); fence(4, 26, 11, 26.4);
  hay(0, 18.5, false, 1); hay(-6, 21, true, 1); hay(6.5, 22.5, false, 2);

  // ---------- west lane: Coop Alley and the Tractor Gate ----------
  stone(-40, 4, -37, 5); stone(-34, 4, -17, 5); stone(-14, 4, -12, 5);
  block(-30, 12, -22, 18, 3, C.coop, 0.12);
  gableRoof(-30.6, -21.4, 11.4, 18.6, 2.95, 5, 'shingle', C.coop, 0.6);
  deco(1.0, 1.2, 0.12, C.woodDark, -26, 0.6, 18.02, 0.04);
  deco(0.9, 0.08, 1.8, C.wood, -26, 0.25, 18.8, 0.03, { r: [0.28, 0, 0] });
  for (const x of [-28.4, -23.6]) deco(1.0, 0.8, 0.1, 0x9fd6f2, x, 1.9, 18.03, 0.04);
  hay(-19, 9.5, false, 2); hay(-17.4, 22, true, 1); crate(-33, 10, 1.2, 1); crate(-21.5, 1, 1.2, 2); hay(-30, 0.5, false, 1); hay(-14, -1.5, true, 2);
  tree(-37.5, 22); tree(-21, 25.5, 0.9); tree(-38, -2.5, 0.9);

  // ---------- east lane: Garden Gate and the Creek Culvert ----------
  stone(12, 6, 15, 7); stone(18, 6, 28, 7); stone(37, 6, 40, 7);
  block(28, 3, 31, 7, 3, C.stone, 0.14); block(34, 3, 37, 7, 3, C.stone, 0.14); block(31, 3, 34, 7, 0.7, C.stone, 0.14, 2.4);
  deco(9.3, 0.26, 4.3, C.stoneCap, 32.5, 3.1, 5, 0.1);
  crate(19.5, 11, 1.2, 2); hay(28.5, 15, true, 1); crate(36, 12, 1.2, 1); hay(20, 1, false, 2); crate(27, -0.5, 1.2, 1); hay(15, 21.5, true, 1);
  for (const [x, z, s] of [[23.5, 13, 0.55], [26.4, 21, 0.7], [22.6, 25, 0.5]]) { solid(x - s, 0, z - s, x + s, s * 1.2, z + s); add(root, sphereGeo(), 0xa9a79f, x, s * 0.5, z, { s: [s * 1.15, s * 0.85, s * 1.05] }); }
  tree(36.5, 22); tree(14.5, 25, 0.85); tree(38, -1.5, 0.9);

  // ---------- the Herd's start: back pasture ----------
  hay(-9, 30, false, 1); hay(9, 30, false, 1); hay(-18, 33.5, true, 2); hay(18, 33.5, true, 2);
  tree(-28, 36.5); tree(28, 36.5); tree(0, 38.2, 0.8);
  block(-3.2, 36.2, 3.2, 37, 0.6, C.wood, 0.1);
  deco(6, 0.08, 0.5, C.water, 0, 0.6, 36.6, 0.03, { cast: false });

  // ---------- hedges drawn as one batch ----------
  const bushMesh = new T.InstancedMesh(sphereGeo(), new T.MeshLambertMaterial({ color: 0xffffff }), bushes.length);
  const dummy = new T.Object3D(), col = new T.Color();
  bushes.forEach((b, i) => {
    dummy.position.set(b.x, b.y, b.z); dummy.scale.set(b.sx, b.sy, b.sz); dummy.updateMatrix();
    bushMesh.setMatrixAt(i, dummy.matrix); bushMesh.setColorAt(i, col.setHex(b.c));
  });
  bushMesh.castShadow = true; bushMesh.receiveShadow = true;
  root.add(bushMesh);

  // ---------- corn ----------
  const cornZones = [];
  const cornTex = canvasTexture(128, 256, (g) => {
    g.lineCap = 'round';
    g.strokeStyle = '#4c9a36'; g.lineWidth = 9; g.beginPath(); g.moveTo(64, 256); g.lineTo(64, 22); g.stroke();
    const leaf = (y, dir, len, colr) => { g.strokeStyle = colr; g.lineWidth = 13; g.beginPath(); g.moveTo(64, y); g.quadraticCurveTo(64 + dir * len * 0.7, y - 46, 64 + dir * len, y - 6); g.stroke(); };
    leaf(240, 1, 52, '#5fb43f'); leaf(226, -1, 56, '#57a93a'); leaf(176, 1, 58, '#69c048'); leaf(158, -1, 54, '#5fb43f'); leaf(108, 1, 46, '#57a93a'); leaf(92, -1, 50, '#69c048'); leaf(48, 1, 30, '#69c048'); leaf(44, -1, 28, '#5fb43f');
    g.fillStyle = '#f4cf45'; g.beginPath(); g.ellipse(80, 128, 11, 26, 0.25, 0, 7); g.fill();
    g.fillStyle = '#8fd060'; g.beginPath(); g.ellipse(76, 142, 9, 18, 0.25, 0, 7); g.fill();
    g.fillStyle = '#e8c56a'; g.beginPath(); g.ellipse(64, 16, 10, 16, 0, 0, 7); g.fill();
  });
  const cornGeo = new T.BufferGeometry();
  const hw = 0.62, ch = 2.45;
  cornGeo.setAttribute('position', new T.Float32BufferAttribute([-hw, 0, 0, hw, 0, 0, hw, ch, 0, -hw, ch, 0, 0, 0, -hw, 0, 0, hw, 0, ch, hw, 0, ch, -hw], 3));
  cornGeo.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  cornGeo.setAttribute('normal', new T.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  cornGeo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const stalks = [];
  for (const [x1, x2] of [[-10, -1.4], [1.4, 10]]) for (const [z1, z2] of [[-1, 6], [8.6, 15]]) {
    cornZones.push({ x1, y1: 0, z1, x2, y2: 2.3, z2 });
    for (let x = x1 + 0.35; x < x2 - 0.2; x += 0.72) for (let z = z1 + 0.35; z < z2 - 0.2; z += 0.72) stalks.push([x + rand(-0.22, 0.22), z + rand(-0.22, 0.22)]);
  }
  const corn = new T.InstancedMesh(cornGeo, new T.MeshLambertMaterial({ map: cornTex, alphaTest: 0.45, side: T.DoubleSide }), stalks.length);
  stalks.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z); dummy.rotation.set(0, rand(Math.PI), 0); dummy.scale.setScalar(rand(0.86, 1.14)); dummy.updateMatrix();
    corn.setMatrixAt(i, dummy.matrix);
  });
  dummy.rotation.set(0, 0, 0);
  corn.receiveShadow = true;
  root.add(corn);

  // ---------- ground ----------
  // Three painted surfaces (grass, dirt path, garden soil) are blended by a "mask" picture:
  // red in the mask means path, green means soil. Small details (creek, barn floor, flowers) sit on top.
  const P1 = (v, S) => (v + 48) * (S / 96);
  const lanes = [
    [[-36, 31], [36, 31]], [[-15.5, 31], [-15.5, -1], [-26, -3.5], [-26, -13]], [[-35.5, 31], [-35.5, -22.5], [-22.5, -22.5], [-22.5, -19]],
    [[0, 31], [0, -2]], [[0, -2], [-6.5, -4.5], [-6.5, -10], [0, -18]], [[0, -2], [6.5, -4.5], [6.5, -10], [0, -18]], [[-10, 7.3], [10, 7.3]],
    [[16.5, 31], [16.5, -1], [24, -10]], [[32.5, 31], [32.5, -1], [24, -10]],
    [[0, -31], [-10, -29], [-22.5, -23]], [[0, -31], [10, -29], [22, -25], [24, -12]], [[0, -18], [-15, -13], [-26, -13]], [[0, -18], [10, -7], [14, -7]], [[12, -16.5], [22, -14]],
    [[-9, -29], [-9, -24], [0, -18]], [[9, -29], [9, -24], [0, -18]], [[-11.5, 18.5], [-15.5, 18.5]], [[11.5, 18.5], [16.5, 18.5]],
  ];
  const maskTex = canvasTexture(1024, 1024, (g, S) => {
    const P = (v) => P1(v, S), m2p = S / 96;
    g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round'; g.lineJoin = 'round';
    const stroke = (pts, w, colr) => { g.strokeStyle = colr; g.lineWidth = w * m2p; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(P(x), P(z)) : g.moveTo(P(x), P(z)))); g.stroke(); };
    try { g.filter = 'blur(5px)'; } catch (e) { /* sharper edges on older browsers */ }
    lanes.forEach((l) => stroke(l, 2.9, '#ff0000'));
    g.fillStyle = '#00ff00';
    roundRect(g, P(14), P(-22), 22.5 * m2p, 18 * m2p, 30); g.fill();
    for (const z of cornZones) { roundRect(g, P(z.x1 - 0.3), P(z.z1 - 0.3), (z.x2 - z.x1 + 0.6) * m2p, (z.z2 - z.z1 + 0.6) * m2p, 8); g.fill(); }
    g.filter = 'none'; g.globalCompositeOperation = 'source-over';
  });
  maskTex.encoding = T.LinearEncoding;
  const detailTex = canvasTexture(2048, 2048, (g, S) => {
    const P = (v) => P1(v, S), m2p = S / 96;
    g.clearRect(0, 0, S, S);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const stroke = (pts, w, colr) => { g.strokeStyle = colr; g.lineWidth = w * m2p; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(P(x), P(z)) : g.moveTo(P(x), P(z)))); g.stroke(); };
    const creek = [[24.5, 7.4], [24, 14], [25.6, 22], [24.4, 30], [25, 40]];
    try { g.filter = 'blur(4px)'; } catch (e) { /* fine */ }
    stroke(creek, 3.4, '#9be2fb');
    g.filter = 'none';
    stroke(creek, 2.3, '#5fc4ef');
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const z = 9 + i * 1.15, x = 24.6 + Math.sin(i * 1.7) * 0.7; g.beginPath(); g.moveTo(P(x - 0.3), P(z)); g.lineTo(P(x + 0.3), P(z + 0.1)); g.stroke(); }
    // barn floor boards
    g.fillStyle = '#d4a96f'; g.fillRect(P(-33.6), P(-19.6), 15.2 * m2p, 13.2 * m2p);
    g.strokeStyle = 'rgba(120,80,40,0.4)'; g.lineWidth = 2.5;
    for (let z = -19; z < -6.5; z += 0.9) { g.beginPath(); g.moveTo(P(-33.6), P(z)); g.lineTo(P(-18.4), P(z)); g.stroke(); }
    // where the pumpkin can be planted
    const ring = (x, z) => { g.strokeStyle = 'rgba(255,248,230,0.95)'; g.lineWidth = 0.28 * m2p; g.setLineDash([24, 16]); g.beginPath(); g.arc(P(x), P(z), 3.4 * m2p, 0, 7); g.stroke(); g.setLineDash([]); };
    ring(-26, -13); ring(24, -10.2);
    for (let i = 0; i < 1100; i++) { g.fillStyle = ['#ffffff', '#ffe36e', '#ff9ec4', '#fff3b0'][i % 4]; g.beginPath(); g.arc(rand(S), rand(S), rand(1.5, 3.2), 0, 7); g.fill(); }
  });
  const flat = (colr) => canvasTexture(4, 4, (g) => { g.fillStyle = colr; g.fillRect(0, 0, 4, 4); });
  const uni = { dirtMap: { value: flat('#dcb98a') }, soilMap: { value: flat('#9b6b46') }, maskMap: { value: maskTex }, detailMap: { value: detailTex } };
  const groundMat = new T.MeshLambertMaterial({ map: flat('#86cf58') });
  groundMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_pars_fragment>', '#include <map_pars_fragment>\nuniform sampler2D dirtMap; uniform sampler2D soilMap; uniform sampler2D maskMap; uniform sampler2D detailMap;')
      .replace('#include <map_fragment>', `
        vec2 tuv = vUv * 30.0;
        vec4 mk = texture2D( maskMap, vUv );
        vec3 gcol = mix( texture2D( map, tuv ).rgb, texture2D( map, tuv * 0.31 + 0.37 ).rgb, 0.4 );
        vec3 col = mix( gcol, texture2D( dirtMap, tuv * 0.8 ).rgb, smoothstep( 0.15, 0.75, mk.r ) );
        col = mix( col, texture2D( soilMap, tuv * 0.8 ).rgb, smoothstep( 0.2, 0.8, mk.g ) );
        vec4 det = texture2D( detailMap, vUv );
        col = mix( col, det.rgb, det.a );
        diffuseColor.rgb *= col;`);
  };
  loadTexture('grass', (t) => { groundMat.map = t; groundMat.needsUpdate = true; });
  loadTexture('dirt', (t) => { uni.dirtMap.value = t; });
  loadTexture('soil', (t) => { uni.soilMap.value = t; });
  const ground = new T.Mesh(new T.PlaneGeometry(96, 96), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData.keep = true;
  root.add(ground);
  const outer = new T.Mesh(new T.CircleGeometry(420, 40), mat(0x7cc452));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.06;
  root.add(outer);

  // ---------- scenery beyond the hedge ----------
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand(0.2), d = rand(120, 230), s = rand(40, 85);
    add(root, sphereGeo(), i % 2 ? 0x74bf52 : 0x8ad164, Math.cos(a) * d, -s * 0.18, Math.sin(a) * d, { s: [s, s * rand(0.3, 0.5), s], cast: false, receive: false });
  }
  for (let i = 0; i < 26; i++) {
    const a = rand(Math.PI * 2), d = rand(47, 80);
    tree(Math.cos(a) * d * 1.05, Math.sin(a) * d * 1.05, rand(1.0, 1.7), false);
  }
  // windmill landmark
  const mill = group(root, -58, 0, -52);
  add(mill, cylGeo(1.6, 2.8, 12, 12), 0xfff1d6, 0, 6, 0);
  add(mill, coneGeo(2.2, 2.4, 12), C.coopRoof, 0, 13.2, 0);
  const blades = group(mill, 2.0, 11, 1.2);
  blades.rotation.y = 0.9;
  for (let i = 0; i < 4; i++) { const b = add(blades, rboxGeo(0.8, 7, 0.1, 0.04), C.trim, 0, 0, 0.3); b.geometry = b.geometry.clone().translate(0, 3.8, 0); b.rotation.z = (i * Math.PI) / 2; b.userData.keep = true; }
  animated.push((t) => { blades.children.forEach((b, i) => { b.rotation.z = t * 0.5 + (i * Math.PI) / 2; }); });
  // clouds
  const clouds = group(root);
  for (let i = 0; i < 12; i++) {
    const c = group(clouds, rand(-220, 220), rand(55, 85), rand(-220, 220));
    const cm = new T.MeshBasicMaterial({ color: 0xffffff, fog: false });
    for (let k = 0; k < 4; k++) { const p = new T.Mesh(sphereGeo(), cm); p.position.set(k * 5 - 7 + rand(-1, 1), rand(-1, 1), rand(-2, 2)); p.scale.set(rand(5, 8), rand(3, 4.5), rand(4, 6)); c.add(p); }
  }
  animated.push((t, dt) => { clouds.children.forEach((c) => { c.position.x += dt * 1.2; if (c.position.x > 240) c.position.x = -240; }); });
  // sky dome
  const skyTex = canvasTexture(16, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3fa4ee'); gr.addColorStop(0.45, '#8fd0fb'); gr.addColorStop(0.62, '#e4f6ff'); gr.addColorStop(1, '#e4f6ff');
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
  });
  const sky = new T.Mesh(new T.SphereGeometry(400, 20, 14), new T.MeshBasicMaterial({ map: skyTex, side: T.BackSide, fog: false }));
  root.add(sky);

  bakeTree(root);

  // ---------- lights ----------
  scene.fog = new T.Fog(0xdff3ff, 130, 520);
  scene.add(new T.HemisphereLight(0xe4f2ff, 0xe3d8b0, 0.82));
  const sun = new T.DirectionalLight(0xfff0d0, 0.74);
  sun.position.set(34, 58, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -58, right: 58, top: 58, bottom: -58, near: 1, far: 160 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  scene.add(sun);

  // ---------- places the computer players know about ----------
  const pt = (x, z) => ({ x, z });
  const points = {
    A: pt(-26, -13), B: pt(24, -12.6), MID: pt(0, 7.3), YARD: pt(3, -17), HERD: pt(0, 32), HANDS: pt(0, -31),
    A_S: pt(-26, -3), A_E: pt(-15, -13), W_GATE: pt(-15.5, 8), W_ALLEY: pt(-35.5, 8), A_BACK: pt(-36, -2),
    E_GATE: pt(16.5, 10), E_TUNNEL: pt(32.5, 10), B_S: pt(32.5, -2), MID_L: pt(-6.5, -7), MID_R: pt(6.5, -7), B_W: pt(10, -7),
  };
  const routes = {
    A: [['W_GATE', 'A_S', 'A'], ['W_ALLEY', 'A_BACK', 'A_S', 'A'], ['MID', 'MID_L', 'A_E', 'A']],
    B: [['E_GATE', 'B'], ['E_TUNNEL', 'B_S', 'B'], ['MID', 'MID_R', 'B_W', 'B']],
  };
  // where defenders like to stand, and what they keep an eye on
  const holds = {
    A: [{ x: -32, z: -18, lx: -26, lz: -6 }, { x: -21.5, z: -8.5, lx: -18, lz: -13 }, { x: -19.5, z: -15.6, lx: -26, lz: -7 }, { x: -15, z: -9.5, lx: -15.5, lz: 4 }, { x: -25.5, z: -16.6, lx: -26, lz: -6 }],
    B: [{ x: 33.5, z: -11.5, lx: 16.5, lz: 5 }, { x: 18, z: -16.5, lx: 32.5, lz: 2 }, { x: 26.5, z: -19, lx: 22, lz: 2 }, { x: 23, z: -17.2, lx: 16.5, lz: 6 }, { x: 14.5, z: -10.5, lx: 32, lz: 2 }],
    MID: [{ x: -2.5, z: -13.5, lx: -6.5, lz: -4 }, { x: 4, z: -24.2, lx: 6.5, lz: -4 }, { x: 7, z: -8.2, lx: 6.5, lz: 0 }],
  };
  const spawns = {
    attack: [[0, 33], [-3, 33.6], [3, 33.6], [-6, 34.4], [6, 34.4]].map(([x, z]) => ({ x, z, yaw: 0 })),
    defend: [[0, -31], [-3, -31.5], [3, -31.5], [-6, -32], [6, -32]].map(([x, z]) => ({ x, z, yaw: Math.PI })),
  };
  const sites = { A: { x: -26, z: -13, r: 3.4 }, B: { x: 24, z: -10.2, r: 3.4 } };

  return { boxes, cornZones, points, routes, holds, spawns, sites, animated, half: 40 };
}

function pickGreen() { return ['#9bdc66', '#74c24a', '#a5e072', '#6ab944'][(Math.random() * 4) | 0]; }
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}
