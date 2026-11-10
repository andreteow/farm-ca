// All sounds are made on the spot with the browser's built-in synthesiser, so there are no sound files to load.
import { angDiff, yawTo, clamp } from './util.js';

export function createAudio(game) {
  let ctx = null, master = null, noiseBuf = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
  }

  // how loud and how far left/right a sound at (x,z) should be for the listener
  function place(x, z) {
    const c = game.camera.position, dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz);
    const vol = clamp(1 - d / 55, 0, 1) ** 2;
    const pan = d < 0.6 ? 0 : clamp(-Math.sin(angDiff(yawTo(dx, dz), game.viewYaw)) * 0.85, -1, 1);
    return { vol, pan };
  }
  function bus(vol, pan) {
    const g = ctx.createGain(); g.gain.value = vol;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master);
    return g;
  }
  function noise(dur, f0, f1, vol, pan = 0, type = 'bandpass', q = 1.2) {
    if (!ctx || vol < 0.004) return;
    const t = ctx.currentTime, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = bus(1, pan), env = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true;
    fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    env.gain.setValueAtTime(vol, t); env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(fl); fl.connect(env); env.connect(g);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  function tone(wave, f0, f1, dur, vol, pan = 0, delay = 0) {
    if (!ctx || vol < 0.004) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), env = ctx.createGain(), g = bus(1, pan);
    o.type = wave; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(vol, t + 0.008); env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(env); env.connect(g);
    o.start(t); o.stop(t + dur + 0.03);
  }

  return {
    init,
    shoot(id, a) {
      if (!ctx) return;
      const p = a.isPlayer ? { vol: 0.8, pan: 0 } : place(a.pos.x, a.pos.z);
      const v = p.vol * 0.5;
      if (id === 'squirter') { noise(0.11, 2600, 700, v, p.pan); tone('sine', 900, 380, 0.08, v * 0.5, p.pan); }
      else if (id === 'egg') { tone('sine', 520, 190, 0.07, v * 0.9, p.pan); noise(0.05, 1500, 600, v * 0.5, p.pan); }
      else { tone('triangle', 230, 80, 0.12, v * 1.1, p.pan); noise(0.09, 900, 250, v * 0.7, p.pan, 'lowpass'); }
    },
    splat(x, y, z, onChar) {
      if (!ctx) return;
      const p = place(x, z);
      noise(0.13, onChar ? 1300 : 900, 160, p.vol * (onChar ? 0.5 : 0.25), p.pan, 'lowpass');
    },
    step(a) {
      if (!ctx) return;
      const p = a.isPlayer ? { vol: 0.25, pan: 0 } : place(a.pos.x, a.pos.z);
      noise(0.06, 300, 90, p.vol * 0.55, p.pan, 'lowpass', 0.7);
    },
    reload() { tone('square', 300, 520, 0.07, 0.08); tone('square', 520, 700, 0.07, 0.08, 0, 0.16); noise(0.25, 500, 1800, 0.06); },
    hitConfirm(head) { tone('sine', head ? 1250 : 900, head ? 1700 : 1150, 0.07, 0.22); if (head) tone('sine', 1900, 2300, 0.08, 0.16, 0, 0.06); },
    hurt() { tone('sine', 330, 140, 0.16, 0.3); },
    out(a) { const p = place(a.pos.x, a.pos.z); tone('sine', 950, 180, 0.45, p.vol * 0.3, p.pan); tone('triangle', 160, 70, 0.14, p.vol * 0.3, p.pan, 0.42); },
    bell() { for (const f of [540, 806]) tone('square', f, f * 0.99, 0.5, 0.09); tone('square', 540, 535, 0.5, 0.07, 0, 0.3); },
    tick() { tone('square', 700, 690, 0.05, 0.06); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.22, 0.2, 0, i * 0.12)); },
    lose() { [440, 392, 330, 262].forEach((f, i) => tone('triangle', f, f * 0.97, 0.26, 0.18, 0, i * 0.16)); },
    ui() { tone('sine', 660, 880, 0.06, 0.12); },
    setVolume(v) { if (master) master.gain.value = v; },
  };
}
