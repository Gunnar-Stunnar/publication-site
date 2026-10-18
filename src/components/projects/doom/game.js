// "Defend the Center": a stripped-down Doom scenario (after ViZDoom's
// defend_the_center). The player stands in the middle of an arena and can only
// turn left, turn right, or fire. Imps spawn around the edge and walk inward.
import { mulberry32 } from './rng.js';

export const GAME_DEFAULTS = {
  nEnemies: 2,
  spawnDist: 9,
  enemySpeed: 0.14, // map units per tick
  turnDeg: 12,
  hitTolDeg: 8, // half-width of the crosshair, also the "center" sector
  nearDeg: 35,
  midDeg: 90,
  damage: 20,
  meleeDist: 0.9,
  respawnTicks: 12,
};

export const ARENA = { size: 24, cx: 12, cy: 12 };

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export function wrapPi(a) {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}

export class Game {
  constructor(params = {}, seed = 2) {
    this.p = { ...GAME_DEFAULTS, ...params };
    this.reset(seed);
  }

  reset(seed = 2) {
    this.rng = mulberry32(seed);
    this.view = Math.PI / 2;
    this.enemies = [];
    this.spawnTimers = [];
    this.health = 100;
    this.t = 0;
    this.nextId = 1;
    this.stats = { kills: 0, hits: 0, shots: 0, misses: 0, deaths: 0 };
    this.fx = { muzzle: 0, hurt: 0 };
    for (let k = 0; k < this.p.nEnemies; k++) this.spawnTimers.push(k * 20);
  }

  spawn() {
    this.enemies.push({
      id: this.nextId++,
      ang: this.rng() * TAU,
      dist: this.p.spawnDist,
      alive: true,
      dying: 0,
      phase: this.rng() * 10,
    });
  }

  relAngle(e) {
    return wrapPi(e.ang - this.view);
  }

  pos(e) {
    return { x: ARENA.cx + Math.cos(e.ang) * e.dist, y: ARENA.cy + Math.sin(e.ang) * e.dist };
  }

  // Map a relative angle (radians, + = to the player's left) to a sensory sector 0..6.
  sector(rel) {
    const a = Math.abs(rel) / DEG;
    const { hitTolDeg, nearDeg, midDeg } = this.p;
    if (a <= hitTolDeg) return 3;
    const off = a <= nearDeg ? 1 : a <= midDeg ? 2 : 3;
    return rel > 0 ? 3 - off : 3 + off;
  }

  nearest() {
    let best = null;
    for (const e of this.enemies) if (e.alive && (!best || e.dist < best.dist)) best = e;
    return best;
  }

  observe() {
    const e = this.nearest();
    if (!e) return { state: -1, proximity: 0, rel: 0, enemy: null };
    const rel = this.relAngle(e);
    const { spawnDist, meleeDist } = this.p;
    const proximity = 1 - (e.dist - meleeDist) / (spawnDist - meleeDist);
    return { state: this.sector(rel), proximity, rel, enemy: e };
  }

  // action: 0 = turn left, 1 = turn right, 2 = fire, -1 = nothing
  step(action) {
    const P = this.p;
    const events = [];
    if (this.fx.muzzle > 0) this.fx.muzzle--;
    if (this.fx.hurt > 0) this.fx.hurt--;

    if (action === 0) this.view = wrapPi(this.view + P.turnDeg * DEG);
    else if (action === 1) this.view = wrapPi(this.view - P.turnDeg * DEG);
    else if (action === 2) {
      this.stats.shots++;
      this.fx.muzzle = 2;
      let target = null;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.abs(this.relAngle(e)) <= P.hitTolDeg * DEG && (!target || e.dist < target.dist)) target = e;
      }
      if (target) {
        target.alive = false;
        target.dying = 1;
        this.stats.kills++;
        this.spawnTimers.push(P.respawnTicks);
        events.push('kill');
      } else {
        this.stats.misses++;
        events.push('miss');
      }
    }

    for (const e of this.enemies) {
      if (e.alive) {
        e.dist -= P.enemySpeed;
        e.phase += 0.25;
        if (e.dist <= P.meleeDist) {
          e.alive = false;
          e.dying = -1; // removed without a corpse
          this.health -= P.damage;
          this.stats.hits++;
          this.fx.hurt = 4;
          this.spawnTimers.push(P.respawnTicks);
          events.push('hit');
        }
      } else if (e.dying > 0) {
        e.dying++;
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive || (e.dying > 0 && e.dying < 40));

    if (this.health <= 0) {
      this.stats.deaths++;
      this.health = 100;
      events.push('death');
    }

    this.spawnTimers = this.spawnTimers.map((t) => t - 1).sort((a, b) => a - b);
    while (this.spawnTimers.length && this.spawnTimers[0] <= 0) {
      this.spawnTimers.shift();
      this.spawn();
    }
    this.t++;
    return events;
  }
}
