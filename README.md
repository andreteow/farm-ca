# Harvest Standoff

A kid-friendly, round-based, 5-against-5 farm game that runs in a web browser.
The Herd (animals) try to splat the Hands (farmhands) before the clock runs out.

## Where things are

- `src/config.js` holds every number that changes how the game feels (speeds, launcher strength, prices, round and fuse lengths, difficulty).
- `src/world.js` is the map, Sunnyside Farm.
- `src/characters.js` builds the animals, farmhands, launchers and the Stink-Pumpkin.
- `src/bot.js` is the thinking for computer players.
- `src/main.js` runs the match: rounds, shop, coins, the pumpkin, half-time.
- `assets/` holds what the game loads: surface textures (`tex`), menu and shop art (`ui`) and all sounds (`audio`).
- `art/generated/` keeps the full-size generated artwork; `art/reference/` has a top-down picture of the map.
- `tools/audio/` has the scripts that generated and trimmed the voice lines, music and sound effects.
- `dist/` is the finished game: `index.html` plus its `assets` folder (upload both to any web host).

## Rebuild after a change

```bash
npm install
```

```bash
node build.mjs
```

## Automatic checks

`tests/` contains scripts that open the game in a headless browser, play rounds and take screenshots, for example:

```bash
node tests/play.cjs herd easy 6
```

```bash
node tests/objective.cjs
```

## Status

Milestone 2: shop and corn-coin economy, four launchers, overalls and cork kit, the Stink-Pumpkin plant-and-cork objective,
half-time job swap, generated textures and menu art, recorded voice lines, music and sound effects.

Not built yet: throwables (flour bomb and friends), the over-the-shoulder view, the other three modes, more maps, online play.
