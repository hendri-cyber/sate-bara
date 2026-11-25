# SATE BARA — Charcoal Grill Rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hendri-cyber/sate-bara/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hendri-cyber/sate-bara/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original charcoal-grill cooking game in real 3D (three.js,
vendored) for the make.fun bounty **best-cooking-game-20261125-0137**
("Make the best cooking game", $250, top 10).

You run a satay stall at night. Orders land on the board; you grill raw skewers
over charcoal, pull each one off in the green zone before it burns, stack the
plate to match the ticket, and ring the bell before the customer's patience runs
out. One 3-minute shift, 6 dishes, combo scoring.

## How to play

Serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8908) and play in a desktop browser. No network request,
no build step, no assets — every picture is drawn from code.

- **Grill**: click a raw skewer (Ayam / Kambing / Sapi) on the counter to put it
  on the grill — 4 slots. Each skewer cooks in about 6 seconds.
- **Pull it off**: click a skewer while its meter is green (55–85%) for a
  perfect grill. Past 97% it burns — click it to throw it away.
- **Build the plate**: click a ticket to select it, then click the cooked
  skewers on the tray and the sides on the counter (lontong, bumbu kacang,
  kuah padang, sambal, es teh) to match the ticket. A wrong item resets
  your combo.
- **Serve**: click the bell or press **Space** when the plate is complete.
  Coins = dish price + patience bonus + perfect-grill bonus, times your
  combo multiplier.
- **Keys**: 1–8 counter items · Space serve · Tab next ticket · P pause ·
  R restart.

## The stall

- **Real 3D (three.js 0.160.0, vendored under `game/vendor/`)**: one
  WebGL canvas, one fixed orthographic camera — the stall is built from
  real geometry: the grill is a firebox with glowing pulsing embers,
  grate bars and skewers lying on the grate; the counter bins are 3D
  boxes with dark openings and the ingredients sitting on top; the plate
  is a rimmed disc seen as a tabletop ellipse; the bell is a gold dome on
  its own little table. HUD panels (order board, customers, stats, timer)
  are the same 2D drawings painted onto canvas-texture planes, so the
  text stays crisp. All models from code, no assets, no network.
- **6 dishes**: Sate Ayam, Sate Kambing, Sate Padang, Sate Taichan,
  Es Teh Manis, Sate Campur — each with its own recipe and price.
- **3 tickets at most**, 45 seconds of patience each. An expired ticket
  walks away angry and resets your combo.
- **Combo multiplier** up to x2 for serving dish after dish without a
  mistake, a burnt skewer, or an expired ticket.
- **End of shift**: coins, dishes served, best combo, perfect grills,
  and a grade (S/A/B/C/D).

## Shots

`screenshots/` holds four real renders of the game's own code (seed 11),
staged by `game/src/shots.js`:

1. `1-cover.jpg` — the whole stall: board with 3 tickets, grill with
   skewers cooking, counter full, timer at 2:41.
2. `2-assembly.jpg` — Sate Ayam mid-assembly, 2 of 3 ingredients on
   the plate, sauce next.
3. `3-serve.jpg` — Sate Padang complete and ready, bell glowing,
   +32 coins flying.
4. `4-rush.jpg` — rush hour: 3 tickets, one patience bar red, grill
   full, 0:38 on the clock.

## Hand-in

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and
writes `/output/dossier.json` with the kit's `buildDossier`:

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`vendor/makefun-game.ts` is the kit's copy, unchanged.
`game/vendor/three.module.min.js` is three.js 0.160.0 (MIT), vendored —
the dossier lists it as a vendored file, not authored source. License: MIT.
