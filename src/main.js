// Harvest Standoff: ties the farm, the characters, the rules and the screen together.
import { add } from './gfx.js';
import { ROUND, TEAM, GADGETS, GADGET_ORDER, DIFFICULTY, ROSTER, MOVE } from './config.js';
import { buildWorld } from './world.js';
import { buildNav } from './nav.js';
import { Actor } from './actor.js';
import { Bot } from './bot.js';
import { createCombat } from './combat.js';
import { createFx } from './fx.js';
import { createAudio } from './audio.js';
import { createHud } from './hud.js';
import { createViewModel } from './viewmodel.js';
import { buildCharacter, buildGadget, animateCharacter } from './characters.js';
import { raycast } from './collide.js';
import { clamp, dirX, dirZ, shuffle, pick, rand } from './util.js';

const T = window.THREE;
const $ = (id) => document.getElementById(id);

function boot() {
  const canvas = $('view'), rootEl = $('game');
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    $('touch-note').hidden = false;
    $('touch-note').textContent = 'This browser could not start 3D graphics. Try a recent version of Chrome, Edge, Firefox or Safari on a computer.';
    $('play').disabled = true;
    return;
  }
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.autoClear = false;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(72, 1, 0.08, 700);
  camera.rotation.order = 'YXZ';

  const game = {
    scene, camera, renderer, actors: [], bots: [], player: null, viewActor: null,
    state: 'menu', paused: false, time: 0, roundT: ROUND.length, roundLen: ROUND.length, freezeT: 0, endT: 0, round: 0,
    score: { herd: 0, hands: 0 }, diff: DIFFICULTY.easy, diffKey: 'easy', playerTeam: 'herd',
    viewYaw: 0, viewH: 600, intel: { herd: new Map(), hands: new Map() },
  };
  game.world = buildWorld(scene);
  game.nav = buildNav(game.world);
  game.fx = createFx(scene);
  game.audio = createAudio(game);
  game.combat = createCombat(game);
  game.hud = createHud(game);
  const vm = createViewModel();
  const botOf = new Map();

  // ---------- what each team knows about the other ----------
  game.report = (team, enemy) => { game.intel[team].set(enemy, { x: enemy.pos.x, z: enemy.pos.z, t: game.time }); };
  game.latestIntel = (team) => {
    let best = null;
    game.intel[team].forEach((info, enemy) => { if (enemy.alive && game.time - info.t < 8 && (!best || info.t > best.t)) best = info; });
    return best;
  };
  game.busiestSite = (team) => {
    const enemiesLeft = game.actors.filter((a) => a.alive && a.team !== team).length;
    const need = enemiesLeft <= 2 ? 1 : 2;
    let bestSite = null, bestN = 0;
    for (const key of ['A', 'B']) {
      const s = game.world.points[key];
      let n = 0;
      game.intel[team].forEach((info, enemy) => { if (enemy.alive && game.time - info.t < 5 && Math.hypot(info.x - s.x, info.z - s.z) < 17) n++; });
      if (n >= need && n > bestN) { bestN = n; bestSite = key; }
    }
    return bestSite;
  };

  // ---------- match and round flow ----------
  function startMatch(team, diffKey) {
    for (const a of game.actors) scene.remove(a.char.root);
    game.actors = []; game.bots = []; botOf.clear();
    game.playerTeam = team; game.diffKey = diffKey; game.diff = DIFFICULTY[diffKey];
    game.score = { herd: 0, hands: 0 }; game.round = 0;
    for (const t of ['herd', 'hands']) {
      ROSTER[t].forEach((info, i) => {
        const isPlayer = t === team && i === 0;
        const a = new Actor(game, t, isPlayer ? { ...info, name: 'You' } : info, isPlayer);
        game.actors.push(a);
        if (isPlayer) game.player = a;
        else { const b = new Bot(game, a); game.bots.push(b); botOf.set(a, b); }
        a.char.marker.visible = t === team && !isPlayer;
      });
    }
    const p = game.player;
    if (team === 'herd') vm.setColors(0xfff3d6, 0xffffff); else vm.setColors(0xf2c9a0, 0xd9463e);
    vm.set(p.gadgetId);
    game.fx.clearDecals(); game.hud.clearFeed();
    startRound();
  }

  function planRound() {
    const W = game.world, at = (x, z) => game.nav.nearestFree(x + rand(-1.1, 1.1), z + rand(-1.1, 1.1));
    const main = pick(['A', 'B']), other = main === 'A' ? 'B' : 'A';
    const used = { A: 0, B: 0, MID: 0 };
    const routeOrder = { A: shuffle([0, 1, 2]), B: shuffle([0, 1, 2]) };
    let ai = 0, di = 0;
    const defendOrder = shuffle(['A', 'B', 'A', 'B', 'MID']);
    for (const b of game.bots) {
      const a = b.a;
      a.setGadget(pick(GADGET_ORDER));
      a.cooldown = 0;
      if (a.team === 'herd') {
        const site = Math.random() < 0.2 ? other : main;
        const route = W.routes[site][routeOrder[site][ai++ % 3]];
        const hold = W.holds[site][used[site]++ % W.holds[site].length];
        const legs = route.slice(0, -1).map((n) => at(W.points[n].x, W.points[n].z));
        legs.push(hold);
        b.newRound({ role: 'attack', site, legs, hold });
      } else {
        const site = defendOrder[di++ % defendOrder.length];
        const hold = W.holds[site][used[site]++ % W.holds[site].length];
        b.newRound({ role: 'defend', site, legs: [hold], hold });
      }
    }
  }

  function startRound() {
    game.round++;
    game.state = 'freeze'; game.freezeT = ROUND.freeze; game.roundT = ROUND.length;
    game.combat.clear();
    game.intel.herd.clear(); game.intel.hands.clear();
    for (const t of ['herd', 'hands']) {
      const slots = shuffle(game.world.spawns[t].slice());
      game.actors.filter((a) => a.team === t).forEach((a, i) => a.reset(slots[i]));
    }
    planRound();
    spectateIdx = 0; game.viewActor = game.player;
    game.hud.spectate(null);
    const job = game.playerTeam === 'herd' ? 'Splat all the farmhands before time runs out.' : 'Keep the animals out until the clock hits zero.';
    game.hud.banner(`Round ${game.round}`, job, ROUND.freeze);
  }

  function endRound(winner, why) {
    game.score[winner]++;
    game.state = 'roundEnd'; game.endT = ROUND.endDelay;
    const won = winner === game.playerTeam;
    game.hud.banner(won ? 'Round won!' : 'Round lost', why, ROUND.endDelay);
    if (won) game.audio.win(); else game.audio.lose();
  }

  function finishMatch() {
    game.state = 'matchEnd';
    const winner = game.score.herd > game.score.hands ? 'herd' : 'hands';
    const won = winner === game.playerTeam;
    $('end-title').textContent = won ? 'You won the match!' : `${TEAM[winner].name} won`;
    $('end-sub').textContent = `Final score: Herd ${game.score.herd}, Hands ${game.score.hands}. ${won ? 'The farm is yours today.' : 'Shake off the mess and try again.'}`;
    $('end').hidden = false;
    game.hud.hideBanner();
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function toMenu() {
    game.state = 'menu'; game.paused = false;
    for (const a of game.actors) scene.remove(a.char.root);
    game.actors = []; game.bots = []; game.player = null; game.viewActor = null;
    game.combat.clear();
    $('end').hidden = true; $('pause').hidden = true; $('menu').hidden = false;
    game.hud.show(false);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  game.onPlayerFire = () => vm.fire();
  game.onHit = (attacker, victim, head, out) => {
    if (attacker.isPlayer) { game.hud.hitMarker(head); game.audio.hitConfirm(head); }
    if (victim.isPlayer) { game.hud.hurt(attacker); game.audio.hurt(); }
    const vb = botOf.get(victim);
    if (vb) vb.onHurt(attacker);
    game.report(victim.team, attacker);
    if (out) { game.hud.feed(attacker, victim, head); game.audio.out(victim); }
  };

  // ---------- input ----------
  const keys = {};
  let mdx = 0, mdy = 0, mouseDown = false, fireEdge = false, locked = false, everLocked = false, noLock = false;
  let sens = 1, spectateIdx = 0, eyeY = MOVE.eye;
  try { const s = parseFloat(localStorage.getItem('hs-sens')); if (s > 0) sens = s; } catch (e) { /* no saved setting */ }
  $('sens').value = sens;

  const playing = () => game.state === 'freeze' || game.state === 'live' || game.state === 'roundEnd';
  function lockFailed() {
    if (locked) return;
    if (everLocked) { if (playing()) pause(); return; }
    noLock = true;
    game.hud.tip('Move the mouse or use the arrow keys to look around. Press Esc to pause.', 7);
  }
  function lock() {
    if (noLock || locked) return;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(lockFailed); } catch (e) { lockFailed(); }
  }
  function pause() {
    if (!playing() || game.paused) return;
    game.paused = true; $('pause').hidden = false;
    for (const k in keys) keys[k] = false;
    mouseDown = false;
  }
  function resume() {
    game.paused = false; $('pause').hidden = true;
    lock();
  }
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas;
    if (locked) everLocked = true;
    else if (playing() && !noLock) pause();
  });
  document.addEventListener('pointerlockerror', lockFailed);
  document.addEventListener('mousemove', (e) => { if ((locked || noLock) && playing() && !game.paused) { mdx += e.movementX || 0; mdy += e.movementY || 0; } });
  canvas.addEventListener('mousedown', (e) => {
    if (!playing() || game.paused || e.button !== 0) return;
    game.audio.init();
    if (!locked && !noLock) { lock(); return; }
    mouseDown = true; fireEdge = true;
    if (game.player && !game.player.alive) spectateIdx++;
  });
  window.addEventListener('mouseup', () => { mouseDown = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; });
  window.addEventListener('keydown', (e) => {
    if (!playing()) return;
    if (e.code === 'Escape' && noLock) { if (game.paused) resume(); else pause(); return; }
    if (game.paused) return;
    if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || (e.code.startsWith('Digit') && !e.ctrlKey && !e.metaKey)) e.preventDefault();
    if (e.repeat) return;
    keys[e.code] = true;
    const p = game.player;
    if (!p || !p.alive) return;
    const slot = { Digit1: 'squirter', Digit2: 'egg', Digit3: 'tomato' }[e.code];
    if (slot && slot !== p.gadgetId) { p.setGadget(slot); vm.set(slot); game.audio.ui(); }
    if (e.code === 'KeyR') p.startReload();
    if (e.code === 'KeyF') fireEdge = true;
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function updatePlayer(dt) {
    const p = game.player;
    const k = 0.0021 * sens;
    p.yaw -= mdx * k; p.pitch = clamp(p.pitch - mdy * k, -1.45, 1.45);
    mdx = 0; mdy = 0;
    p.yaw += ((keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0)) * 2.4 * dt;
    p.pitch = clamp(p.pitch + ((keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0)) * 1.6 * dt, -1.45, 1.45);
    if (!p.alive) { fireEdge = false; return; }
    if (game.state === 'live') {
      const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      let wx = dirX(p.yaw) * f + Math.cos(p.yaw) * s, wz = dirZ(p.yaw) * f - Math.sin(p.yaw) * s;
      const l = Math.hypot(wx, wz);
      if (l > 1) { wx /= l; wz /= l; }
      p.move(dt, wx, wz, !!keys.Space, !!(keys.ShiftLeft || keys.ShiftRight), !!keys.KeyC);
      const g = GADGETS[p.gadgetId];
      if ((g.auto ? mouseDown || keys.KeyF : fireEdge)) game.combat.tryFire(p);
    } else p.move(dt, 0, 0, false, false, false);
    fireEdge = false;
  }

  // ---------- camera ----------
  function updateCamera(dt) {
    const p = game.player;
    if (game.state === 'menu' || !p) {
      const a = game.time * 0.07;
      camera.position.set(Math.sin(a) * 50, 24, -4 + Math.cos(a) * 50);
      camera.lookAt(0, 1, -5);
      game.viewYaw = 0;
      return;
    }
    if (p.alive) {
      eyeY += (p.eyeY() - eyeY) * Math.min(1, dt * 14);
      camera.position.set(p.pos.x, p.pos.y + eyeY, p.pos.z);
      camera.rotation.set(p.pitch + p.recoil, p.yaw, 0);
      game.viewYaw = p.yaw; game.viewActor = p;
      return;
    }
    // splatted out: watch yourself flop, then follow a teammate from behind
    let target = p;
    if (p.outT > 1.5) {
      const mates = game.actors.filter((a) => a.alive && a.team === p.team);
      const others = mates.length ? mates : game.actors.filter((a) => a.alive);
      if (others.length) target = others[spectateIdx % others.length];
      game.hud.spectate(target === p ? 'You are out this round.' : `You are out this round. Watching ${target.name}. Click to switch.`);
    }
    game.viewActor = target; game.viewYaw = target.yaw;
    const fx = dirX(target.yaw), fz = dirZ(target.yaw);
    const hx = target.pos.x, hy = target.pos.y + 1.7, hz = target.pos.z;
    let dist = 3.6;
    const hit = raycast(hx, hy, hz, -fx * 0.94, 0.33, -fz * 0.94, dist, game.world.boxes);
    if (hit) dist = Math.max(0.6, hit.t - 0.25);
    const k = Math.min(1, dt * 10);
    camera.position.x += (hx - fx * 0.94 * dist - camera.position.x) * k;
    camera.position.y += (hy + 0.33 * dist - camera.position.y) * k;
    camera.position.z += (hz - fz * 0.94 * dist - camera.position.z) * k;
    camera.lookAt(hx + fx * 3, hy - 0.2, hz + fz * 3);
  }

  // ---------- one step of the game ----------
  function update(dt) {
    game.time += dt;
    for (const f of game.world.animated) f(game.time, dt);
    if (playing()) {
      if (game.state === 'freeze') {
        game.freezeT -= dt;
        if (game.freezeT <= 0) { game.state = 'live'; game.audio.bell(); game.hud.banner('Go!', '', 0.9); }
      } else if (game.state === 'live') {
        const before = Math.ceil(game.roundT);
        game.roundT -= dt;
        if (game.roundT <= 10 && Math.ceil(game.roundT) !== before && game.roundT > 0) game.audio.tick();
      }
      updatePlayer(dt);
      for (const b of game.bots) b.update(dt);
      for (const a of game.actors) a.tick(dt);
      game.combat.update(dt);
      if (game.state === 'live') {
        const herd = game.actors.filter((a) => a.team === 'herd' && a.alive).length;
        const hands = game.actors.filter((a) => a.team === 'hands' && a.alive).length;
        if (hands === 0 && herd > 0) endRound('herd', 'Every farmhand got splatted. The Herd takes the round.');
        else if (herd === 0) endRound('hands', 'Every animal got splatted. The Hands take the round.');
        else if (game.roundT <= 0) endRound('hands', 'Time is up. The Hands kept the farm safe.');
      } else if (game.state === 'roundEnd') {
        game.endT -= dt;
        if (game.endT <= 0) {
          if (game.score.herd >= ROUND.winTarget || game.score.hands >= ROUND.winTarget) finishMatch(); else startRound();
        }
      }
      for (const a of game.actors) a.updateModel(dt, a === game.player && a.alive);
      if (game.player && game.player.alive) vm.update(dt, game.player);
    }
    game.fx.update(dt);
    updateCamera(dt);
    game.hud.update(dt);
  }

  function render() {
    renderer.clear();
    renderer.render(scene, camera);
    if (playing() && game.player && game.player.alive) { renderer.clearDepth(); renderer.render(vm.scene, vm.cam); }
  }

  function resize() {
    const w = Math.max(1, rootEl.clientWidth), h = Math.max(1, rootEl.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    vm.resize(w / h);
    game.viewH = h;
  }

  // ---------- menu ----------
  function portrait(kind, look, img, bg) {
    const s = new T.Scene();
    s.background = new T.Color(bg);
    s.add(new T.HemisphereLight(0xffffff, 0xb0d090, 0.95));
    const d = new T.DirectionalLight(0xffffff, 0.55); d.position.set(-2, 3, -4); s.add(d);
    const c = buildCharacter(kind, look);
    c.mount.add(buildGadget(kind === 'farmer' ? 'squirter' : 'tomato'));
    animateCharacter(c, 0.016, 0, 0.1, false, true);
    c.root.rotation.y = 0.5;
    s.add(c.root);
    const cam = new T.PerspectiveCamera(30, 1, 0.1, 20);
    cam.position.set(0.15, 1.5, -2.5); cam.lookAt(0.05, 1.3, 0);
    renderer.setPixelRatio(1); renderer.setSize(192, 192, false);
    renderer.clear(); renderer.render(s, cam);
    const out = document.createElement('canvas'); out.width = out.height = 192;
    out.getContext('2d').drawImage(canvas, 0, 0);
    try { img.src = out.toDataURL('image/png'); } catch (e) { /* portrait is decoration only */ }
  }
  portrait('chicken', 0, $('pic-herd'), 0xffe2b8);
  portrait('farmer', 0, $('pic-hands'), 0xcfe6fb);

  let pickTeam = 'herd', pickDiff = 'easy';
  const choose = (group, attr, value) => document.querySelectorAll(group).forEach((b) => b.setAttribute('aria-checked', String(b.dataset[attr] === value)));
  document.querySelectorAll('.side').forEach((b) => b.addEventListener('click', () => { pickTeam = b.dataset.team; choose('.side', 'team', pickTeam); game.audio.init(); game.audio.ui(); }));
  document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { pickDiff = b.dataset.diff; choose('.seg button', 'diff', pickDiff); game.audio.init(); game.audio.ui(); }));
  function begin() {
    game.audio.init();
    $('menu').hidden = true; $('end').hidden = true;
    game.hud.show(true);
    startMatch(pickTeam, pickDiff);
    lock();
  }
  $('play').addEventListener('click', begin);
  $('again').addEventListener('click', begin);
  $('to-menu').addEventListener('click', toMenu);
  $('resume').addEventListener('click', resume);
  $('quit').addEventListener('click', toMenu);
  $('sens').addEventListener('input', (e) => { sens = parseFloat(e.target.value) || 1; try { localStorage.setItem('hs-sens', String(sens)); } catch (err) { /* not saved */ } });
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches) $('touch-note').hidden = false;

  window.addEventListener('resize', resize);
  resize();

  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (!game.paused && game.state !== 'matchEnd') update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // handy for automated checks: run the game forward without waiting for real time
  game.simulate = (seconds, step = 1 / 60) => { for (let t = 0; t < seconds; t += step) update(step); };
  game.begin = (team, diff) => { pickTeam = team; pickDiff = diff; begin(); };
  game.input = { keys, look: (dx, dy) => { mdx += dx; mdy += dy; }, fire: (down) => { mouseDown = down; fireEdge = down; }, noLock: () => { noLock = true; } };
  window.__hs = game;
}

if (window.THREE) boot();
else {
  const n = document.getElementById('touch-note');
  if (n) { n.hidden = false; n.textContent = 'The 3D library could not be loaded. Check your internet connection and reload the page.'; }
}
