// Every number that changes how the game FEELS lives here, so tuning is one file.

export const MOVE = {
  run: 6.2, // metres per second
  walk: 3.0, // holding Shift: slower, silent footsteps
  crouch: 2.6,
  accel: 55,
  airControl: 0.3,
  gravity: 22,
  jump: 7.4,
  eye: 1.62,
  eyeCrouch: 1.15,
  radius: 0.4,
  height: 1.8,
  heightCrouch: 1.3,
};

export const ROUND = {
  freeze: 3.5, // seconds everyone waits at the start line
  length: 100, // seconds per round
  winTarget: 5, // first team to this many rounds wins the match
  endDelay: 4.5,
};

export const TEAM = {
  herd: { name: 'The Herd', short: 'Herd', color: '#f08a24' },
  hands: { name: 'The Hands', short: 'Hands', color: '#3f8fd9' },
};

// spread values are angles in radians (0.01 is roughly 20 cm off at 20 m)
export const GADGETS = {
  squirter: {
    id: 'squirter', name: 'Water Squirter', slot: 1, auto: false, rate: 5.5,
    dmg: 24, head: 2, tank: 12, reload: 1.4,
    spread: 0.004, moveSpread: 0.03, airSpread: 0.06, bloom: 0.005, bloomMax: 0.03,
    kick: 0.011, speed: 110, color: 0x57c7ff, splat: 0.2,
  },
  egg: {
    id: 'egg', name: 'Egg Popper', slot: 2, auto: true, rate: 11,
    dmg: 13, head: 1.8, tank: 28, reload: 1.9,
    spread: 0.012, moveSpread: 0.03, airSpread: 0.07, bloom: 0.004, bloomMax: 0.04,
    kick: 0.006, speed: 100, color: 0xffe9a8, splat: 0.2,
  },
  tomato: {
    id: 'tomato', name: 'Tomato Tosser', slot: 3, auto: true, rate: 7.5,
    dmg: 27, head: 2, tank: 20, reload: 2.2,
    spread: 0.003, moveSpread: 0.075, airSpread: 0.1, bloom: 0.008, bloomMax: 0.06,
    kick: 0.015, speed: 115, color: 0xe5412d, splat: 0.25,
  },
};
export const GADGET_ORDER = ['squirter', 'egg', 'tomato'];

export const DIFFICULTY = {
  easy: { label: 'Easy', reaction: 0.8, aimErr: 0.085, turn: 3.2, dmgToPlayer: 0.55, fireMoving: true },
  medium: { label: 'Medium', reaction: 0.48, aimErr: 0.05, turn: 5.0, dmgToPlayer: 0.8, fireMoving: false },
  hard: { label: 'Hard', reaction: 0.28, aimErr: 0.027, turn: 7.5, dmgToPlayer: 1.0, fireMoving: false },
};

export const ROSTER = {
  herd: [
    { name: 'Clucky', kind: 'chicken' },
    { name: 'Hamlet', kind: 'pig' },
    { name: 'Daisy', kind: 'cow' },
    { name: 'Woolly', kind: 'sheep' },
    { name: 'Billy', kind: 'goat' },
  ],
  hands: [
    { name: 'Farmer Joe', kind: 'farmer', look: 0 },
    { name: 'Rosie', kind: 'farmer', look: 1 },
    { name: 'Hank', kind: 'farmer', look: 2 },
    { name: 'Pip', kind: 'farmer', look: 3 },
    { name: 'Mabel', kind: 'farmer', look: 4 },
  ],
};
