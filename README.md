# Harvest Standoff

A kid-friendly, round-based, 5-against-5 farm game that runs in a web browser.
The Herd (animals) try to splat the Hands (farmhands) before the clock runs out.

## Where things are

- `src/config.js` holds every number that changes how the game feels (speeds, launcher strength, round length, difficulty).
- `src/world.js` is the map, Sunnyside Farm.
- `src/characters.js` builds the animals, farmhands and launchers.
- `src/bot.js` is the thinking for computer players.
- `dist/index.html` is the finished game as one stand-alone page (upload this to any web host).

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

## Status

Milestone 1, the feel test: one map, movement, three launchers, computer players, rounds and scoring.
Not built yet: the round shop, the plant-and-cork objective, side swap at half-time, the over-the-shoulder view, and the other three modes.
