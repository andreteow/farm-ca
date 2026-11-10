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

## Characters

All ten characters are sculpted in Blender by script, with no manual modelling:

- `tools/chars/blender_lib.py` and `tools/chars/characters.py` lay out rounded shapes in a T-pose, melt them into one
  smooth skin, paint soft colour areas and add crisp extras (eyes, hooves, hats...).
- `tools/chars/bake.mjs` finds each model's hips and shoulders, paints the "which bone moves me" weights and writes
  `assets/chars/<name>.json`, which `src/characters.js` loads and animates with six bones.
- If a model fails to load, the game falls back to a simpler hand-built version of that character.

To rebuild them you need Blender's Python module (`pip install bpy`):

```bash
python tools/chars/characters.py all art/characters
```

```bash
for n in chicken pig cow sheep goat farmer0 farmer1 farmer2 farmer3 farmer4; do node tools/chars/bake.mjs art/characters/${n}_raw.json $n; done
```

## Going live

The public site is built by Vercel from this repository (`vercel.json`): every push to `main` runs `node build.mjs`
and publishes the `dist` folder. The public page loads nothing from other companies' servers; the 3D library and the
fonts are copied next to the game.

## Status

Milestone 5: over-the-shoulder view (V key) and public deployment, on top of Blender-sculpted characters, the throwables (Flour Bomb, Rooster Crow, Mud Balloon), the shop and
corn-coin economy, four launchers, overalls and cork kit, the Stink-Pumpkin objective, half-time job swap, generated
textures and menu art, and recorded voice lines, music and sound effects.

Not built yet: the other three modes, more maps, online play.
