// Characters and their launchers, built from soft rounded shapes. Everyone faces "north" (-z) by default.
import { add, group, sphereGeo, capsuleGeo, cylGeo, coneGeo, torusGeo, rboxGeo, mat, bakeChildren } from './gfx.js';

const T = window.THREE;
const HALF = Math.PI / 2;

function eyes(head, y, z, spread, size = 0.07) {
  for (const s of [-1, 1]) {
    add(head, sphereGeo(), 0xffffff, s * spread, y, z, { s: size, cast: false });
    add(head, sphereGeo(), 0x23252b, s * spread * 0.97, y, z - size * 0.5, { s: size * 0.66, cast: false });
    add(head, sphereGeo(), 0xffffff, s * spread * 0.97 + 0.014, y + 0.02, z - size * 1.08, { s: size * 0.2, cast: false });
  }
}

// Big head, round body, short legs: everybody is about 1.75 m tall so both teams are equally easy to hit.
function skeleton(o) {
  const root = new T.Group(); // turns left/right
  const pose = group(root); // tips over when splatted out
  const upper = group(pose); // everything above the legs (drops when crouching)
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const leg = group(pose, s * 0.17, 0.44, 0);
    add(leg, capsuleGeo(0.1, 0.2), o.leg, 0, -0.2, 0);
    add(leg, sphereGeo(), o.foot, 0, -0.39, -0.05, { s: [0.13, 0.08, 0.19] });
    legs.push(leg);
  }
  const torso = group(upper, 0, 0.86, 0);
  torso.scale.setScalar(1.14);
  add(torso, sphereGeo(), o.body, 0, 0, 0, { s: [o.bw, o.bh, o.bd] });
  const head = group(upper, 0, 1.42, 0);
  head.scale.setScalar(1.26);
  add(head, sphereGeo(), o.head, 0, 0, 0, { s: o.hr });
  for (const s of [-1, 1]) {
    const arm = group(upper, s * (o.bw * 1.14 + 0.03), 1.06, 0);
    add(arm, capsuleGeo(0.085, 0.2), o.arm, 0, -0.17, 0);
    add(arm, sphereGeo(), o.hand, 0, -0.37, 0, { s: 0.105 });
    arms.push(arm);
  }
  const mount = group(arms[1], 0, -0.4, 0);
  mount.rotation.x = -HALF;
  const marker = add(root, coneGeo(0.13, 0.26, 10), new T.MeshBasicMaterial({ color: 0x6dff7a }), 0, 2.3, 0, { r: [Math.PI, 0, 0], cast: false });
  marker.visible = false;
  return { root, pose, upper, legs, arms, torso, head, mount, marker, splats: [], phase: Math.random() * 6, flop: 0 };
}

const BUILD = {
  chicken() {
    const c = skeleton({ body: 0xffffff, head: 0xffffff, leg: 0xf5a623, foot: 0xf5a623, arm: 0xffffff, hand: 0xfff3d6, bw: 0.3, bh: 0.4, bd: 0.3, hr: 0.23 });
    eyes(c.head, 0.04, -0.19, 0.1);
    add(c.head, coneGeo(0.075, 0.2, 10), 0xffa62b, 0, -0.03, -0.27, { r: [-HALF, 0, 0] });
    for (const [z, s] of [[-0.09, 0.07], [0.01, 0.085], [0.11, 0.07]]) add(c.head, sphereGeo(), 0xe5412d, 0, 0.23, z, { s });
    add(c.head, sphereGeo(), 0xe5412d, 0, -0.15, -0.2, { s: [0.045, 0.07, 0.045] });
    add(c.torso, coneGeo(0.15, 0.36, 8), 0xffffff, 0, 0.12, 0.3, { r: [0.9, 0, 0] });
    return c;
  },
  pig() {
    const c = skeleton({ body: 0xf7a8b8, head: 0xf7a8b8, leg: 0xf7a8b8, foot: 0xd8798f, arm: 0xf7a8b8, hand: 0xd8798f, bw: 0.34, bh: 0.4, bd: 0.32, hr: 0.26 });
    eyes(c.head, 0.07, -0.21, 0.11);
    add(c.head, cylGeo(0.11, 0.12, 0.1, 14), 0xee8fa3, 0, -0.04, -0.26, { r: [HALF, 0, 0] });
    for (const s of [-1, 1]) {
      add(c.head, sphereGeo(), 0xb85c74, s * 0.04, -0.04, -0.315, { s: 0.022, cast: false });
      add(c.head, coneGeo(0.1, 0.18, 8), 0xee8fa3, s * 0.17, 0.22, -0.02, { r: [-0.5, 0, -s * 0.5] });
    }
    add(c.torso, torusGeo(0.06, 0.022), 0xee8fa3, 0, -0.05, 0.33, { r: [0, HALF, 0] });
    add(c.torso, sphereGeo(), 0xfcc5d0, 0, -0.04, -0.1, { s: [0.26, 0.3, 0.25] });
    return c;
  },
  cow() {
    const c = skeleton({ body: 0xffffff, head: 0xffffff, leg: 0xffffff, foot: 0x3b3b40, arm: 0xffffff, hand: 0x3b3b40, bw: 0.34, bh: 0.42, bd: 0.31, hr: 0.25 });
    eyes(c.head, 0.07, -0.2, 0.11);
    add(c.head, sphereGeo(), 0xf7b7c2, 0, -0.09, -0.19, { s: [0.17, 0.12, 0.13] });
    add(c.head, sphereGeo(), 0x33343a, 0.13, 0.1, -0.13, { s: [0.11, 0.12, 0.1] });
    for (const s of [-1, 1]) {
      add(c.head, coneGeo(0.045, 0.16, 8), 0xf3e6c4, s * 0.13, 0.26, 0, { r: [0, 0, -s * 0.4] });
      add(c.head, sphereGeo(), 0xffffff, s * 0.27, 0.1, 0, { s: [0.1, 0.055, 0.07] });
    }
    for (const [x, y, z, s] of [[0.2, 0.12, -0.16, 0.16], [-0.22, -0.1, 0.1, 0.18], [0.08, -0.16, 0.24, 0.14], [-0.14, 0.2, -0.18, 0.1]]) add(c.torso, sphereGeo(), 0x33343a, x, y, z, { s: [s, s, s * 0.75] });
    return c;
  },
  sheep() {
    const c = skeleton({ body: 0xfdf6e3, head: 0x4f443c, leg: 0x4f443c, foot: 0x2e2824, arm: 0x4f443c, hand: 0x2e2824, bw: 0.33, bh: 0.4, bd: 0.32, hr: 0.21 });
    eyes(c.head, 0.03, -0.17, 0.09);
    for (const [x, y, z, s] of [[0.2, 0.18, 0.1, 0.2], [-0.2, 0.2, 0.08, 0.2], [0.22, -0.12, -0.05, 0.2], [-0.22, -0.14, -0.02, 0.2], [0, 0.1, 0.24, 0.22], [0, -0.16, 0.2, 0.2], [0, 0.26, -0.08, 0.2], [0.1, -0.05, -0.24, 0.17], [-0.1, 0.05, -0.25, 0.17]]) add(c.torso, sphereGeo(), 0xfdf6e3, x, y, z, { s });
    for (const [x, z, s] of [[0, -0.02, 0.15], [0.1, 0.06, 0.11], [-0.1, 0.06, 0.11]]) add(c.head, sphereGeo(), 0xfdf6e3, x, 0.19, z, { s });
    for (const s of [-1, 1]) add(c.head, sphereGeo(), 0x4f443c, s * 0.23, 0.02, 0.02, { s: [0.1, 0.05, 0.065], r: [0, 0, -s * 0.4] });
    return c;
  },
  goat() {
    const c = skeleton({ body: 0xdcbc8e, head: 0xdcbc8e, leg: 0xdcbc8e, foot: 0x4a3a2c, arm: 0xdcbc8e, hand: 0x4a3a2c, bw: 0.31, bh: 0.41, bd: 0.3, hr: 0.23 });
    eyes(c.head, 0.06, -0.19, 0.1);
    add(c.head, sphereGeo(), 0xf3e2c4, 0, -0.07, -0.18, { s: [0.13, 0.11, 0.13] });
    add(c.head, coneGeo(0.06, 0.2, 8), 0xffffff, 0, -0.26, -0.14, { r: [Math.PI, 0, 0] });
    for (const s of [-1, 1]) {
      add(c.head, coneGeo(0.045, 0.26, 8), 0x8d8478, s * 0.1, 0.27, 0.06, { r: [0.6, 0, -s * 0.15] });
      add(c.head, sphereGeo(), 0xdcbc8e, s * 0.26, 0.04, 0.02, { s: [0.11, 0.045, 0.06], r: [0, 0, s * 0.5] });
    }
    return c;
  },
  farmer(look = 0) {
    const L = [
      { shirt: 0xd9463e, skin: 0xf2c9a0, hat: 'straw', extra: 'moustache' },
      { shirt: 0xf2c84b, skin: 0xf7d7b5, hat: 'bandana', extra: 'ponytail' },
      { shirt: 0x58a55c, skin: 0xc98f62, hat: 'cap', extra: 'beard' },
      { shirt: 0xff9a3c, skin: 0x9a6b45, hat: 'straw', extra: null },
      { shirt: 0x9b6fd0, skin: 0xf2c9a0, hat: 'sun', extra: 'bun' },
    ][look % 5];
    const c = skeleton({ body: 0x3d6fb5, head: L.skin, leg: 0x3d6fb5, foot: 0x6b4426, arm: L.shirt, hand: L.skin, bw: 0.29, bh: 0.41, bd: 0.25, hr: 0.22 });
    eyes(c.head, 0.03, -0.185, 0.085, 0.052);
    add(c.head, sphereGeo(), L.skin, 0, -0.03, -0.215, { s: 0.045 });
    add(c.torso, rboxGeo(0.34, 0.3, 0.08, 0.04), 0x4f84cf, 0, 0.08, -0.215);
    for (const s of [-1, 1]) add(c.torso, sphereGeo(), 0xffd24a, s * 0.13, 0.19, -0.26, { s: 0.028, cast: false });
    add(c.torso, sphereGeo(), L.shirt, 0, 0.26, 0, { s: [0.27, 0.2, 0.23] });
    if (L.hat === 'straw' || L.hat === 'sun') {
      const wide = L.hat === 'sun' ? 0.5 : 0.42;
      add(c.head, cylGeo(wide, wide, 0.035, 20), 0xf2cc5c, 0, 0.14, 0);
      add(c.head, cylGeo(0.19, 0.22, 0.17, 16), 0xf2cc5c, 0, 0.23, 0);
      add(c.head, cylGeo(0.225, 0.225, 0.05, 16), L.hat === 'sun' ? 0xff6f91 : 0x9b5a3c, 0, 0.17, 0);
    } else if (L.hat === 'cap') {
      add(c.head, sphereGeo(), 0x2f6fb0, 0, 0.08, 0.01, { s: [0.235, 0.17, 0.235] });
      add(c.head, cylGeo(0.16, 0.16, 0.03, 14), 0x2f6fb0, 0, 0.1, -0.22, { s: [1, 1, 0.9] });
    } else {
      add(c.head, sphereGeo(), 0xe2443a, 0, 0.09, 0.02, { s: [0.232, 0.15, 0.232] });
    }
    if (L.extra === 'moustache') add(c.head, sphereGeo(), 0x6b4426, 0, -0.085, -0.2, { s: [0.1, 0.03, 0.04] });
    if (L.extra === 'beard') add(c.head, sphereGeo(), 0xd9d9d9, 0, -0.13, -0.13, { s: [0.15, 0.12, 0.11] });
    if (L.extra === 'ponytail') add(c.head, sphereGeo(), 0xd9783a, 0, -0.02, 0.24, { s: [0.09, 0.2, 0.09], r: [0.5, 0, 0] });
    if (L.extra === 'bun') add(c.head, sphereGeo(), 0xf0f0f0, 0, 0.0, 0.22, { s: 0.11 });
    return c;
  },
};

export function buildCharacter(kind, look) {
  const c = BUILD[kind](look);
  // each stiff body part becomes a single shape, so a whole character costs only a few draw steps
  for (const part of [c.torso, c.head, ...c.legs, ...c.arms]) {
    for (const m of part.children) if (m.isMesh) m.castShadow = true;
    bakeChildren(part);
  }
  return c;
}

// Called every frame: legs, arms, crouch and the "flop over" when splatted out.
export function animateCharacter(c, dt, speed, pitch, crouched, alive) {
  c.phase += dt * (4 + speed * 1.7);
  const k = Math.min(1, speed / 5);
  const sw = Math.sin(c.phase) * 0.85 * k;
  c.legs[0].rotation.x = sw; c.legs[1].rotation.x = -sw;
  const drop = crouched ? 0.32 : 0;
  c.upper.position.y += (-drop + Math.abs(Math.sin(c.phase)) * 0.045 * k - c.upper.position.y) * Math.min(1, dt * 14);
  for (const leg of c.legs) { leg.position.y = 0.44 - drop * 0.75; leg.scale.y = crouched ? 0.45 : 1; }
  c.arms[1].rotation.x = HALF + pitch;
  c.arms[0].rotation.x = HALF + pitch - 0.12;
  c.arms[0].rotation.z = -0.5;
  c.head.rotation.x = pitch * 0.6;
  const target = alive ? 0 : 1;
  c.flop += (target - c.flop) * Math.min(1, dt * 9);
  c.pose.rotation.x = c.flop * HALF * 0.98;
  c.pose.position.y = c.flop * 0.22;
}

export function addSplat(c, worldPoint, color) {
  const p = c.pose.worldToLocal(worldPoint.clone());
  const len = Math.hypot(p.x, p.z) || 1;
  const blob = add(c.pose, sphereGeo(), color, p.x, Math.max(0.2, Math.min(1.7, p.y)), p.z, { s: [0.13, 0.13, 0.13], cast: false });
  // nudge it onto the surface of the body
  const reach = 0.3 / len;
  blob.position.x = p.x * Math.min(1.4, Math.max(reach, 0.9));
  blob.position.z = p.z * Math.min(1.4, Math.max(reach, 0.9));
  blob.scale.set(0.14 + Math.random() * 0.06, 0.12 + Math.random() * 0.06, 0.1);
  blob.lookAt(c.pose.localToWorld(new T.Vector3(0, blob.position.y, 0)));
  c.splats.push(blob);
  if (c.splats.length > 9) c.pose.remove(c.splats.shift());
}

export function clearSplats(c) {
  for (const s of c.splats) c.pose.remove(s);
  c.splats.length = 0;
  c.flop = 0; c.pose.rotation.x = 0; c.pose.position.y = 0;
}

// ---------- launchers ----------
export function buildGadget(id) {
  const g = new T.Group();
  let muzzle = { y: 0.07, z: -0.3 };
  if (id === 'squirter') {
    add(g, rboxGeo(0.085, 0.105, 0.27, 0.04), 0x2f9bea, 0, 0.06, -0.08);
    add(g, cylGeo(0.022, 0.03, 0.1, 10), 0xff8a2a, 0, 0.07, -0.25, { r: [HALF, 0, 0] });
    add(g, sphereGeo(), mat(0x9fe3ff, { transparent: true, opacity: 0.85 }), 0, 0.145, 0.0, { s: [0.04, 0.042, 0.06] });
    add(g, cylGeo(0.018, 0.018, 0.025, 8), 0xff8a2a, 0, 0.192, 0.0);
    add(g, rboxGeo(0.055, 0.13, 0.065, 0.025), 0xff8a2a, 0, -0.035, 0.03, { r: [0.25, 0, 0] });
    add(g, rboxGeo(0.06, 0.045, 0.09, 0.02), 0xffd447, 0, 0.0, -0.13);
    muzzle = { y: 0.07, z: -0.31 };
  } else if (id === 'egg') {
    add(g, cylGeo(0.052, 0.052, 0.34, 14), 0xffd447, 0, 0.07, -0.14, { r: [HALF, 0, 0] });
    add(g, cylGeo(0.064, 0.064, 0.045, 14), 0xe5412d, 0, 0.07, -0.31, { r: [HALF, 0, 0] });
    add(g, rboxGeo(0.13, 0.055, 0.18, 0.02), 0xcfc7b8, 0, 0.15, -0.08);
    for (const z of [-0.135, -0.08, -0.025]) add(g, sphereGeo(), 0xfffaf0, 0, 0.185, z, { s: [0.036, 0.045, 0.036] });
    add(g, rboxGeo(0.055, 0.13, 0.065, 0.025), 0xb98452, 0, -0.035, 0.03, { r: [0.25, 0, 0] });
    add(g, rboxGeo(0.055, 0.08, 0.14, 0.025), 0xb98452, 0, 0.06, 0.12);
    muzzle = { y: 0.07, z: -0.34 };
  } else if (id === 'pea') {
    add(g, cylGeo(0.024, 0.028, 0.62, 10), 0xd9c27a, 0, 0.07, -0.34, { r: [HALF, 0, 0] });
    add(g, sphereGeo(), 0x58b03c, 0, 0.06, -0.04, { s: [0.06, 0.07, 0.2] });
    for (const z of [-0.14, -0.06, 0.02]) add(g, sphereGeo(), 0x9bdb72, 0, 0.1, z, { s: 0.036 });
    add(g, cylGeo(0.026, 0.026, 0.2, 10), 0xc9a13a, 0, 0.165, -0.08, { r: [HALF, 0, 0] });
    add(g, cylGeo(0.034, 0.026, 0.04, 10), 0xc9a13a, 0, 0.165, -0.19, { r: [HALF, 0, 0] });
    add(g, rboxGeo(0.058, 0.09, 0.24, 0.03), 0xb98452, 0, 0.045, 0.18);
    add(g, rboxGeo(0.055, 0.13, 0.065, 0.025), 0xb98452, 0, -0.035, 0.05, { r: [0.25, 0, 0] });
    muzzle = { y: 0.07, z: -0.66 };
  } else {
    add(g, cylGeo(0.036, 0.04, 0.5, 12), 0x4fa846, 0, 0.07, -0.22, { r: [HALF, 0, 0] });
    add(g, cylGeo(0.052, 0.04, 0.06, 12), 0xe5412d, 0, 0.07, -0.47, { r: [HALF, 0, 0] });
    add(g, cylGeo(0.088, 0.088, 0.085, 16), 0xe5412d, 0, -0.005, -0.15, { r: [0, 0, HALF] });
    add(g, coneGeo(0.03, 0.05, 6), 0x58b03c, 0, 0.125, -0.1);
    add(g, rboxGeo(0.058, 0.09, 0.22, 0.03), 0xb98452, 0, 0.05, 0.14);
    add(g, rboxGeo(0.055, 0.13, 0.065, 0.025), 0xb98452, 0, -0.035, 0.03, { r: [0.25, 0, 0] });
    muzzle = { y: 0.07, z: -0.5 };
  }
  g.userData.muzzle = muzzle;
  bakeChildren(g);
  return g;
}

// ---------- the Stink-Pumpkin ----------
export function buildPumpkin() {
  const g = new T.Group();
  const body = group(g, 0, 0.3, 0);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; add(body, sphereGeo(), i % 2 ? 0xf08a24 : 0xe87b17, 0, 0, 0, { s: [0.36, 0.29, 0.17], r: [0, a, 0] }); }
  for (const s of [-1, 1]) add(body, coneGeo(0.05, 0.08, 3), 0x3a2616, s * 0.12, 0.06, -0.31, { r: [HALF, 0, Math.PI], cast: false });
  add(body, sphereGeo(), 0x3a2616, 0, -0.07, -0.33, { s: [0.14, 0.035, 0.03], cast: false });
  add(body, cylGeo(0.07, 0.085, 0.14, 10), 0xd9b98a, 0, 0.3, 0);
  add(body, cylGeo(0.1, 0.1, 0.05, 14), 0xe2443a, 0.3, 0.0, 0.0, { r: [0, 0, HALF] });
  add(body, cylGeo(0.085, 0.085, 0.055, 14), 0xfff6df, 0.31, 0.0, 0.0, { r: [0, 0, HALF], cast: false });
  bakeChildren(body);
  const glow = add(g, sphereGeo(), new T.MeshBasicMaterial({ color: 0xb7f23a, transparent: true, opacity: 0.25, depthWrite: false }), 0, 0.3, 0, { s: 0.6, cast: false, receive: false });
  glow.visible = false;
  return { root: g, body, glow };
}
