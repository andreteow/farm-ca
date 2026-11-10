// One character in the match (the player or a computer player): movement, mess meter, launcher state.
import { MOVE, GADGETS } from './config.js';
import { moveAndCollide } from './collide.js';
import { buildCharacter, animateCharacter, clearSplats, buildGadget } from './characters.js';

const T = window.THREE;

export class Actor {
  constructor(game, team, info, isPlayer) {
    this.game = game; this.team = team; this.name = info.name; this.kind = info.kind; this.isPlayer = isPlayer;
    this.pos = new T.Vector3(); this.vel = new T.Vector3();
    this.yaw = 0; this.pitch = 0; this.recoil = 0;
    this.crouched = false; this.onGround = true; this.alive = true; this.hp = 100;
    this.gadgetId = null; this.tanks = {}; this.cooldown = 0; this.reloadT = 0; this.bloom = 0;
    for (const id in GADGETS) this.tanks[id] = GADGETS[id].tank;
    this.stepDist = 0; this.outT = 0;
    this.char = buildCharacter(info.kind, info.look);
    this.gadgetMeshes = {};
    for (const id in GADGETS) { const m = buildGadget(id); m.visible = false; this.char.mount.add(m); this.gadgetMeshes[id] = m; }
    game.scene.add(this.char.root);
    this.setGadget('squirter');
  }

  // each launcher keeps its own tank, so swapping is never a free refill
  get ammo() { return this.tanks[this.gadgetId]; }
  set ammo(v) { this.tanks[this.gadgetId] = v; }

  setGadget(id) {
    if (this.gadgetId === id) return;
    this.gadgetId = id;
    this.reloadT = 0; this.cooldown = 0.35; this.bloom = 0;
    for (const k in this.gadgetMeshes) this.gadgetMeshes[k].visible = k === id;
    if (this.ammo <= 0) this.startReload();
  }

  reset(spawn) {
    this.pos.set(spawn.x, 0, spawn.z); this.vel.set(0, 0, 0);
    this.yaw = spawn.yaw; this.pitch = 0; this.recoil = 0;
    this.hp = 100; this.alive = true; this.crouched = false; this.outT = 0;
    for (const id in GADGETS) this.tanks[id] = GADGETS[id].tank;
    this.reloadT = 0; this.cooldown = 0; this.bloom = 0;
    clearSplats(this.char);
    this.char.root.visible = true; this.char.root.scale.setScalar(1);
  }

  eyeY() { return this.crouched ? MOVE.eyeCrouch : MOVE.eye; }
  speed2d() { return Math.hypot(this.vel.x, this.vel.z); }

  // wx,wz: the direction this character wants to go (length 0..1)
  move(dt, wx, wz, wantJump, walking, crouching) {
    this.crouched = crouching;
    const top = crouching ? MOVE.crouch : walking ? MOVE.walk : MOVE.run;
    const tx = wx * top, tz = wz * top;
    const rate = MOVE.accel * (this.onGround ? 1 : MOVE.airControl) * dt;
    const dx = tx - this.vel.x, dz = tz - this.vel.z, d = Math.hypot(dx, dz);
    if (d <= rate || d === 0) { this.vel.x = tx; this.vel.z = tz; } else { this.vel.x += (dx / d) * rate; this.vel.z += (dz / d) * rate; }
    if (wantJump && this.onGround) { this.vel.y = MOVE.jump; this.onGround = false; }
    this.vel.y -= MOVE.gravity * dt;
    const before = this.onGround;
    const px = this.pos.x, pz = this.pos.z;
    this.onGround = moveAndCollide(this.pos, this.vel, dt, MOVE.radius, crouching ? MOVE.heightCrouch : MOVE.height, this.game.world.boxes);
    if (this.onGround) {
      const sp = this.speed2d();
      if (sp > MOVE.walk + 0.5) {
        this.stepDist += Math.hypot(this.pos.x - px, this.pos.z - pz);
        if (this.stepDist > 2.3) { this.stepDist = 0; this.game.audio.step(this); }
      }
      if (!before) this.game.audio.step(this);
    }
  }

  // how wide the shots scatter right now (running and jumping make it much worse)
  spread() {
    const g = GADGETS[this.gadgetId];
    let s = g.spread + this.bloom;
    const sp = this.speed2d();
    if (sp > MOVE.walk + 0.4) s += g.moveSpread * Math.min(1, (sp - MOVE.walk) / (MOVE.run - MOVE.walk));
    if (!this.onGround) s += g.airSpread;
    if (this.crouched) s *= 0.75;
    return s;
  }

  startReload() {
    const g = GADGETS[this.gadgetId];
    if (this.reloadT > 0 || this.ammo >= g.tank) return;
    this.reloadT = g.reload;
    if (this.isPlayer) this.game.audio.reload();
  }

  tick(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.reloadT > 0) { this.reloadT -= dt; if (this.reloadT <= 0) { this.ammo = GADGETS[this.gadgetId].tank; this.reloadT = 0; } }
    const g = GADGETS[this.gadgetId];
    this.bloom = Math.max(0, this.bloom - g.bloomMax * 2.2 * dt);
    this.recoil *= Math.exp(-7 * dt);
    if (!this.alive) this.outT += dt;
  }

  updateModel(dt, hidden) {
    const c = this.char;
    c.root.position.copy(this.pos);
    c.root.rotation.y = this.yaw;
    animateCharacter(c, dt, this.alive ? this.speed2d() : 0, this.pitch + this.recoil, this.crouched, this.alive);
    if (!this.alive) {
      // lie there looking silly for a moment, then pop away
      const s = this.outT < 1.6 ? 1 : Math.max(0, 1 - (this.outT - 1.6) * 4);
      c.root.scale.setScalar(Math.max(0.001, s));
      c.root.visible = s > 0.01;
    } else c.root.visible = !hidden;
  }
}
