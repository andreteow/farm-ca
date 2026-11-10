// Everything drawn on top of the 3D view: score, timer, clean meter, radar, crosshair and messages.
import { GADGETS, TEAM } from './config.js';
import { angDiff, yawTo } from './util.js';

const $ = (id) => document.getElementById(id);

export function createHud(game) {
  const el = {};
  for (const id of ['hud', 'score-herd', 'score-hands', 'pips-herd', 'pips-hands', 'timer', 'feed', 'hurt', 'hurt-arrow', 'hitmark', 'banner', 'banner-title', 'banner-sub',
    'tip', 'spectate', 'hp-num', 'hp-fill', 'ammo-num', 'ammo-fill', 'gadget-name', 'slots', 'radar', 'cross', 'ch-t', 'ch-b', 'ch-l', 'ch-r']) el[id] = $(id);
  for (const t of ['herd', 'hands']) { el['pips-' + t].innerHTML = '<i></i><i></i><i></i><i></i><i></i>'; }
  const rctx = el.radar.getContext('2d');
  let bannerT = 0, tipT = 0, hitT = 0, hurtT = 0;
  const last = {};
  const set = (key, node, value) => { if (last[key] !== value) { last[key] = value; node.textContent = value; } };

  function update(dt) {
    const p = game.player;
    if (!p) return;
    set('sh', el['score-herd'], String(game.score.herd));
    set('sf', el['score-hands'], String(game.score.hands));
    const secs = Math.max(0, Math.ceil(game.state === 'freeze' ? game.roundLen : game.roundT));
    set('tm', el.timer, `${(secs / 60) | 0}:${String(secs % 60).padStart(2, '0')}`);
    el.timer.classList.toggle('low', secs <= 15 && game.state === 'live');
    for (const t of ['herd', 'hands']) {
      const n = game.actors.filter((a) => a.team === t && a.alive).length;
      if (last['al' + t] !== n) { last['al' + t] = n; [...el['pips-' + t].children].forEach((c, i) => c.classList.toggle('off', i >= n)); }
    }
    const hp = Math.ceil(p.hp);
    if (last.hp !== hp) { last.hp = hp; el['hp-num'].textContent = hp; el['hp-fill'].style.width = hp + '%'; el['hp-fill'].style.background = hp > 55 ? '' : hp > 25 ? '#f6cf58' : '#d9463e'; }
    const g = GADGETS[p.gadgetId];
    const ammoText = p.reloadT > 0 ? 'Refilling' : String(p.ammo);
    set('am', el['ammo-num'], ammoText);
    const frac = p.reloadT > 0 ? 1 - p.reloadT / g.reload : p.ammo / g.tank;
    el['ammo-fill'].style.width = Math.round(frac * 100) + '%';
    if (last.gid !== p.gadgetId) {
      last.gid = p.gadgetId; el['gadget-name'].textContent = g.name;
      [...el.slots.children].forEach((c) => c.classList.toggle('on', c.dataset.id === p.gadgetId));
    }
    // crosshair opens up to show how much the shots will scatter
    const focal = (game.viewH / 2) / Math.tan((game.camera.fov * Math.PI) / 360);
    const gap = Math.round(5 + p.spread() * focal);
    if (last.gap !== gap) {
      last.gap = gap;
      el['ch-t'].style.top = -gap - 11 + 'px'; el['ch-b'].style.top = gap + 'px'; el['ch-l'].style.left = -gap - 11 + 'px'; el['ch-r'].style.left = gap + 'px';
    }
    el.cross.style.display = p.alive ? '' : 'none';

    if (bannerT > 0 && (bannerT -= dt) <= 0) el.banner.hidden = true;
    if (tipT > 0 && (tipT -= dt) <= 0) el.tip.hidden = true;
    if (hitT > 0 && (hitT -= dt) <= 0) el.hitmark.style.opacity = 0;
    if (hurtT > 0 && (hurtT -= dt) <= 0) { el.hurt.style.opacity = 0; el['hurt-arrow'].style.opacity = 0; }
    radar();
  }

  function radar() {
    const c = rctx, S = 272, r = 130, scale = r / 32;
    const v = game.viewActor || game.player, yaw = game.viewYaw;
    c.clearRect(0, 0, S, S);
    c.save();
    c.beginPath(); c.arc(S / 2, S / 2, r, 0, 7); c.clip();
    c.translate(S / 2, S / 2); c.scale(scale, scale); c.rotate(yaw); c.translate(-v.pos.x, -v.pos.z);
    c.fillStyle = 'rgba(58,38,22,0.32)';
    for (const b of game.world.boxes) if (b.y2 >= 2.2 && b.y1 < 1) c.fillRect(b.x1, b.z1, b.x2 - b.x1, b.z2 - b.z1);
    for (const key of ['A', 'B']) {
      const s = game.world.sites[key];
      c.strokeStyle = key === 'A' ? '#d9463e' : '#3f8fd9'; c.lineWidth = 0.6; c.beginPath(); c.arc(s.x, s.z, s.r, 0, 7); c.stroke();
    }
    const dot = (a, colr, rad) => { c.fillStyle = colr; c.strokeStyle = '#3a2616'; c.lineWidth = 0.35; c.beginPath(); c.arc(a.x, a.z, rad, 0, 7); c.fill(); c.stroke(); };
    for (const a of game.actors) if (a !== v && a.alive && a.team === game.playerTeam) dot(a.pos, TEAM[a.team].color, 1.25);
    game.intel[game.playerTeam].forEach((info, enemy) => { if (enemy.alive && game.time - info.t < 1.5) dot(info, '#e5412d', 1.25); });
    c.restore();
    c.fillStyle = '#fff'; c.strokeStyle = '#3a2616'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(S / 2, S / 2 - 11); c.lineTo(S / 2 + 8, S / 2 + 8); c.lineTo(S / 2 - 8, S / 2 + 8); c.closePath(); c.fill(); c.stroke();
  }

  return {
    update,
    show(on) { el.hud.hidden = !on; },
    banner(title, sub, secs = 2.5) { el['banner-title'].textContent = title; el['banner-sub'].textContent = sub || ''; el['banner-sub'].hidden = !sub; el.banner.hidden = false; bannerT = secs; },
    hideBanner() { el.banner.hidden = true; bannerT = 0; },
    tip(text, secs = 5) { el.tip.textContent = text; el.tip.hidden = false; tipT = secs; },
    spectate(text) { el.spectate.hidden = !text; if (text) el.spectate.textContent = text; },
    hitMarker(head) { el.hitmark.classList.toggle('head', head); el.hitmark.style.opacity = 1; hitT = 0.12; },
    hurt(from) {
      const p = game.player;
      el.hurt.style.opacity = 1; hurtT = 0.25;
      const rel = angDiff(yawTo(from.pos.x - p.pos.x, from.pos.z - p.pos.z), p.yaw);
      el['hurt-arrow'].style.transform = `rotate(${-rel}rad)`; el['hurt-arrow'].style.opacity = 1;
    },
    feed(attacker, victim, head) {
      const row = document.createElement('div');
      const who = (a) => { const b = document.createElement('b'); b.className = a.team; b.textContent = a.name; return b; };
      row.append(who(attacker), head ? ' bonked ' : ' splatted ', who(victim));
      el.feed.append(row);
      while (el.feed.children.length > 5) el.feed.firstChild.remove();
      setTimeout(() => row.remove(), 6000);
    },
    clearFeed() { el.feed.textContent = ''; },
  };
}
