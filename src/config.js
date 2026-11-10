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
  freeze: 8, // seconds at the start line: this is shopping time
  length: 100, // seconds to plant the pumpkin
  winTarget: 6, // first team to this many rounds wins the match
  half: 5, // teams swap jobs after this many rounds
  endDelay: 5,
};

// the Stink-Pumpkin
export const OBJ = {
  plantTime: 3, // seconds holding E to plant
  corkTime: 8, // seconds holding E to cork it
  corkTimeKit: 4, // ...with a Cork Kit
  fuse: 40, // seconds from planted to "pee-yew"
  reach: 1.7, // how close you must be to cork or pick up
};

// corn coins
export const ECON = {
  start: 800,
  max: 16000,
  win: 3000,
  lose: [1400, 1900, 2400, 2900], // grows with each loss in a row
  splat: 300,
  plant: 300,
  cork: 300,
};

export const TEAM = {
  herd: { name: 'The Herd', short: 'Herd', color: '#f08a24' },
  hands: { name: 'The Hands', short: 'Hands', color: '#3f8fd9' },
};

// spread values are angles in radians (0.01 is roughly 20 cm off at 20 m)
export const GADGETS = {
  squirter: {
    id: 'squirter', name: 'Water Squirter', short: 'Squirter', auto: false, rate: 5.5,
    dmg: 24, head: 2, tank: 12, reload: 1.4,
    spread: 0.004, moveSpread: 0.03, airSpread: 0.06, bloom: 0.005, bloomMax: 0.03,
    kick: 0.011, speed: 110, color: 0x57c7ff, splat: 0.2, sound: 'sfx_squirt',
  },
  egg: {
    id: 'egg', name: 'Egg Popper', short: 'Egg Popper', auto: true, rate: 11,
    dmg: 13, head: 1.8, tank: 28, reload: 1.9,
    spread: 0.012, moveSpread: 0.03, airSpread: 0.07, bloom: 0.004, bloomMax: 0.04,
    kick: 0.006, speed: 100, color: 0xffe9a8, splat: 0.2, sound: 'sfx_egg',
  },
  tomato: {
    id: 'tomato', name: 'Tomato Tosser', short: 'Tomato Tosser', auto: true, rate: 7.5,
    dmg: 27, head: 2, tank: 20, reload: 2.2,
    spread: 0.003, moveSpread: 0.075, airSpread: 0.1, bloom: 0.008, bloomMax: 0.06,
    kick: 0.015, speed: 115, color: 0xe5412d, splat: 0.25, sound: 'sfx_tomato',
  },
  pea: {
    id: 'pea', name: 'Pea Shooter', short: 'Pea Shooter', auto: false, rate: 0.95,
    dmg: 88, head: 2, tank: 5, reload: 2.8,
    spread: 0.035, zoomSpread: 0.0007, moveSpread: 0.12, airSpread: 0.15, bloom: 0, bloomMax: 0,
    kick: 0.03, speed: 170, color: 0x8fd94a, splat: 0.22, sound: 'sfx_pea', zoom: true, slow: 0.86,
  },
};
export const PRIMARIES = ['egg', 'tomato', 'pea'];

// what the round shop sells (press B, then the number)
export const SHOP = [
  { id: 'egg', kind: 'gadget', price: 1200, icon: 'icon_egg', blurb: 'Fast and cheap. Great up close.' },
  { id: 'tomato', kind: 'gadget', price: 2700, icon: 'icon_tomato', blurb: 'Strong all-rounder. Stand still to aim.' },
  { id: 'pea', kind: 'gadget', price: 4200, icon: 'icon_pea', blurb: 'One big long-range shot. Right-click to zoom.' },
  { id: 'overalls', kind: 'gear', name: 'Padded Overalls', price: 650, icon: 'icon_overalls', blurb: 'Soaks up half of every splat until it wears out.' },
  { id: 'kit', kind: 'gear', name: 'Cork Kit', price: 400, icon: 'icon_cork_kit', blurb: 'Cork the pumpkin twice as fast.', role: 'defend' },
];

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
