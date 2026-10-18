// Software raycaster for the Defend the Center arena: textured walls,
// floor/ceiling casting, billboard imps, a gun, and feedback overlays.
import { ARENA } from '../game.js';

export const VW = 320;
export const VH = 200;
const TEX = 64;
const FOV_PLANE = 0.66;
const WALL_H = 2.2; // wall height in map units; the eye is at 0.5

const rgb = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;

function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function makeBrick() {
  const t = new Uint32Array(TEX * TEX);
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const row = Math.floor(y / 16);
      const off = row % 2 ? 16 : 0;
      const bx = (x + off) % 32;
      const by = y % 16;
      const brick = Math.floor((x + off) / 32) + row * 7;
      const mortar = bx < 2 || by < 2;
      const n = hash(x, y, 1) * 0.25 + hash(brick, row, 2) * 0.3;
      if (mortar) t[y * TEX + x] = rgb(38 + n * 20, 30 + n * 15, 24 + n * 10);
      else t[y * TEX + x] = rgb(110 + n * 70, 72 + n * 40, 44 + n * 25);
    }
  }
  return t;
}

function makeTech() {
  const t = new Uint32Array(TEX * TEX);
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const n = hash(x, y, 3) * 18;
      let c = rgb(88 + n, 92 + n, 98 + n);
      const px = x % 32;
      const py = y % 32;
      if (px === 0 || py === 0) c = rgb(40, 42, 46);
      else if (px === 31 || py === 31) c = rgb(130, 134, 140);
      if ((px === 4 || px === 27) && (py === 4 || py === 27)) c = rgb(170, 170, 160);
      if (y >= 28 && y <= 35 && x > 6 && x < 58) c = (x + y) % 3 === 0 ? rgb(60, 220, 90) : rgb(30, 140, 60);
      t[y * TEX + x] = c;
    }
  }
  return t;
}

function makeFloor() {
  const t = new Uint32Array(TEX * TEX);
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const n = hash(x, y, 5) * 22 + hash(x >> 3, y >> 3, 6) * 14;
      const grout = x % 32 === 0 || y % 32 === 0;
      t[y * TEX + x] = grout ? rgb(30, 28, 26) : rgb(70 + n, 64 + n, 56 + n);
    }
  }
  return t;
}

function makeCeil() {
  const t = new Uint32Array(TEX * TEX);
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const n = hash(x, y, 7) * 12;
      const light = x > 20 && x < 44 && y > 20 && y < 44;
      t[y * TEX + x] = light ? rgb(230, 225, 200) : rgb(48 + n, 46 + n, 50 + n);
    }
  }
  return t;
}

// Draw an imp-ish demon on a small canvas and return its pixels.
function drawImp(frame) {
  const w = 32;
  const h = 48;
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const skin = '#8a5a32';
  const dark = '#4f2f18';
  const light = '#b98250';
  const px = (x, y, ww, hh, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, ww, hh);
  };

  if (frame === 'corpse') {
    px(4, 40, 24, 6, '#7a1010');
    px(8, 38, 14, 4, skin);
    px(10, 39, 4, 2, dark);
    px(2, 44, 6, 3, '#a01818');
    px(22, 43, 8, 3, '#a01818');
    return g.getImageData(0, 0, w, h);
  }
  const dying = frame === 'die';
  const step = frame === 'walkB' ? 2 : 0;
  const attack = frame === 'attack';

  // legs
  px(10, 34 - step, 5, 13 + step, dark);
  px(18, 34 + step - 2, 5, 13 - step + 2, dark);
  px(9, 45, 7, 3, '#2a1a10');
  px(17, 45, 7, 3, '#2a1a10');
  // torso
  px(8, 16, 16, 19, skin);
  px(11, 19, 10, 10, light);
  px(8, 30, 16, 5, dark);
  // shoulder spikes
  px(6, 14, 3, 3, '#e8e0c8');
  px(23, 14, 3, 3, '#e8e0c8');
  // arms
  if (attack) {
    px(3, 6, 5, 14, skin);
    px(24, 6, 5, 14, skin);
    px(2, 3, 7, 4, '#ff9a20');
    px(23, 3, 7, 4, '#ff9a20');
  } else {
    px(4, 17, 4, 15, skin);
    px(24, 17, 4, 15, skin);
    px(3, 31, 5, 3, '#e8e0c8');
    px(24, 31, 5, 3, '#e8e0c8');
  }
  // head
  px(10, 5, 12, 11, skin);
  px(9, 8, 14, 6, skin);
  px(10, 5, 12, 2, dark);
  px(12, 9, 3, 2, '#ffde2a');
  px(18, 9, 3, 2, '#ffde2a');
  px(13, 9, 1, 1, '#ff2010');
  px(19, 9, 1, 1, '#ff2010');
  px(13, 13, 7, 2, '#300808');
  px(14, 13, 1, 1, '#e8e0c8');
  px(18, 13, 1, 1, '#e8e0c8');
  if (dying) {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(200,20,20,0.55)';
    g.fillRect(0, 0, w, h);
  }
  return g.getImageData(0, 0, w, h);
}

function toSprite(img) {
  const d = img.data;
  const out = new Uint32Array(img.width * img.height);
  for (let k = 0; k < out.length; k++) {
    const a = d[k * 4 + 3];
    out[k] = a > 127 ? rgb(d[k * 4], d[k * 4 + 1], d[k * 4 + 2]) : 0;
  }
  return { w: img.width, h: img.height, px: out };
}

export class DoomView {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = VW;
    canvas.height = VH;
    this.ctx = canvas.getContext('2d');
    this.img = this.ctx.createImageData(VW, VH);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.zbuf = new Float32Array(VW);
    this.tex = { brick: makeBrick(), tech: makeTech(), floor: makeFloor(), ceil: makeCeil() };
    this.sprites = {};
    for (const f of ['walkA', 'walkB', 'attack', 'die', 'corpse']) this.sprites[f] = toSprite(drawImp(f));
    this.frame = 0;
  }

  wallTex(mx, my) {
    return (mx + my) % 5 === 0 ? this.tex.tech : this.tex.brick;
  }

  isWall(mx, my) {
    return mx <= 0 || my <= 0 || mx >= ARENA.size - 1 || my >= ARENA.size - 1;
  }

  render(game, fb) {
    this.frame++;
    const { buf, zbuf } = this;
    const posX = ARENA.cx;
    const posY = ARENA.cy;
    const dirX = Math.cos(game.view);
    const dirY = Math.sin(game.view);
    // Camera plane points to the player's right (clockwise), so screen-left is CCW.
    const planeX = dirY * FOV_PLANE;
    const planeY = -dirX * FOV_PLANE;
    const half = VH / 2;

    // Floor and ceiling
    const fl = this.tex.floor;
    const ce = this.tex.ceil;
    const rx0 = dirX - planeX;
    const ry0 = dirY - planeY;
    const rx1 = dirX + planeX;
    const ry1 = dirY + planeY;
    for (let y = 0; y < VH; y++) {
      if (y === half) continue;
      const isFloor = y > half;
      const rowDist = isFloor ? (0.5 * VH) / (y - half) : ((WALL_H - 0.5) * VH) / (half - y);
      const stepX = (rowDist * (rx1 - rx0)) / VW;
      const stepY = (rowDist * (ry1 - ry0)) / VW;
      let fx = posX + rowDist * rx0;
      let fy = posY + rowDist * ry0;
      const shade = Math.max(0.22, Math.min(1, 1.25 - rowDist / 14)) * (isFloor ? 1 : 0.85);
      const T = isFloor ? fl : ce;
      const sc = isFloor ? TEX : TEX / 2;
      for (let x = 0; x < VW; x++) {
        const tx = ((fx * sc) | 0) & (TEX - 1);
        const ty = ((fy * sc) | 0) & (TEX - 1);
        fx += stepX;
        fy += stepY;
        buf[y * VW + x] = shadeColor(T[ty * TEX + tx], shade);
      }
    }

    // Walls (DDA)
    for (let x = 0; x < VW; x++) {
      const cam = (2 * x) / VW - 1;
      const rdx = dirX + planeX * cam;
      const rdy = dirY + planeY * cam;
      let mx = Math.floor(posX);
      let my = Math.floor(posY);
      const ddx = Math.abs(1 / rdx);
      const ddy = Math.abs(1 / rdy);
      let sx;
      let sy;
      let sdx;
      let sdy;
      if (rdx < 0) {
        sx = -1;
        sdx = (posX - mx) * ddx;
      } else {
        sx = 1;
        sdx = (mx + 1 - posX) * ddx;
      }
      if (rdy < 0) {
        sy = -1;
        sdy = (posY - my) * ddy;
      } else {
        sy = 1;
        sdy = (my + 1 - posY) * ddy;
      }
      let side = 0;
      for (let guard = 0; guard < 64; guard++) {
        if (sdx < sdy) {
          sdx += ddx;
          mx += sx;
          side = 0;
        } else {
          sdy += ddy;
          my += sy;
          side = 1;
        }
        if (this.isWall(mx, my)) break;
      }
      const perp = side === 0 ? sdx - ddx : sdy - ddy;
      zbuf[x] = perp;
      const y0 = Math.max(0, Math.floor(half - ((WALL_H - 0.5) * VH) / perp));
      const y1 = Math.min(VH - 1, Math.floor(half + (0.5 * VH) / perp));
      let wx = side === 0 ? posY + perp * rdy : posX + perp * rdx;
      wx -= Math.floor(wx);
      let tx = Math.floor(wx * TEX);
      if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = TEX - tx - 1;
      const tex = this.wallTex(mx, my);
      const shade = Math.max(0.22, Math.min(1, 1.25 - perp / 14)) * (side ? 0.78 : 1);
      for (let y = y0; y <= y1; y++) {
        const z = 0.5 + ((half - y) * perp) / VH; // world height of this pixel
        const ty = (((WALL_H - z) * TEX) | 0) & (TEX - 1);
        buf[y * VW + x] = shadeColor(tex[ty * TEX + tx], shade);
      }
    }

    // Sprites, far to near
    const invDet = 1 / (planeX * dirY - dirX * planeY);
    const list = game.enemies
      .map((e) => {
        const p = game.pos(e);
        return { e, x: p.x - posX, y: p.y - posY, d: e.dist };
      })
      .sort((a, b) => b.d - a.d);
    for (const s of list) {
      const tX = invDet * (dirY * s.x - dirX * s.y);
      const tY = invDet * (-planeY * s.x + planeX * s.y);
      if (tY <= 0.1) continue;
      const e = s.e;
      let spr;
      if (!e.alive) spr = e.dying < 7 ? this.sprites.die : this.sprites.corpse;
      else if (e.dist < 2.2) spr = this.sprites.attack;
      else spr = Math.floor(e.phase) % 2 ? this.sprites.walkA : this.sprites.walkB;
      const screenX = Math.floor((VW / 2) * (1 + tX / tY));
      const sh = Math.abs(Math.floor((VH / tY) * 0.85));
      const sw = Math.floor((sh * spr.w) / spr.h);
      const floorY = half + (0.5 * VH) / tY;
      const yTop = Math.floor(floorY - sh);
      const xL = Math.floor(screenX - sw / 2);
      const shade = Math.max(0.3, Math.min(1, 1.3 - tY / 12));
      for (let x = Math.max(0, xL); x < Math.min(VW, xL + sw); x++) {
        if (tY >= zbuf[x]) continue;
        const u = Math.floor(((x - xL) * spr.w) / sw);
        for (let y = Math.max(0, yTop); y < Math.min(VH, yTop + sh); y++) {
          const v = Math.floor(((y - yTop) * spr.h) / sh);
          const c = spr.px[v * spr.w + u];
          if (c) buf[y * VW + x] = shadeColor(c, shade);
        }
      }
    }

    // Feedback overlays in the framebuffer
    if (fb && fb.type === 'noise') {
      for (let k = 0; k < buf.length; k++) {
        if (Math.random() < 0.55) {
          const g = (Math.random() * 255) | 0;
          buf[k] = rgb(Math.min(255, g + 40), g * 0.75, g * 0.75);
        }
      }
    }

    this.ctx.putImageData(this.img, 0, 0);
    this.drawGun(game);
    this.drawOverlay(game, fb);
    this.drawMinimap(game);
  }

  drawGun(game) {
    const g = this.ctx;
    const bob = Math.sin(this.frame * 0.25) * (game.fx.muzzle ? 0 : 1.5);
    const cx = VW / 2;
    const by = VH - 2 + bob;
    if (game.fx.muzzle) {
      g.fillStyle = '#ffd040';
      g.fillRect(cx - 9, by - 62, 18, 14);
      g.fillStyle = '#fff6c0';
      g.fillRect(cx - 5, by - 58, 10, 8);
      g.fillStyle = '#ff8a20';
      g.fillRect(cx - 14, by - 56, 4, 4);
      g.fillRect(cx + 10, by - 56, 4, 4);
    }
    // barrel and slide
    g.fillStyle = '#2b2b2e';
    g.fillRect(cx - 6, by - 48, 12, 22);
    g.fillStyle = '#55565c';
    g.fillRect(cx - 4, by - 48, 3, 22);
    g.fillStyle = '#18181a';
    g.fillRect(cx - 2, by - 50, 4, 3);
    // hand
    g.fillStyle = '#c98a5c';
    g.fillRect(cx - 12, by - 28, 24, 22);
    g.fillStyle = '#a86c44';
    g.fillRect(cx - 12, by - 20, 24, 3);
    g.fillRect(cx - 12, by - 13, 24, 3);
    g.fillStyle = '#3a6b2a';
    g.fillRect(cx - 16, by - 8, 32, 10);
  }

  drawOverlay(game, fb) {
    const g = this.ctx;
    // crosshair
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(VW / 2 - 4, VH / 2, 3, 1);
    g.fillRect(VW / 2 + 2, VH / 2, 3, 1);
    g.fillRect(VW / 2, VH / 2 - 4, 1, 3);
    g.fillRect(VW / 2, VH / 2 + 2, 1, 3);
    if (game.fx.hurt) {
      g.fillStyle = `rgba(220,0,0,${0.12 * game.fx.hurt})`;
      g.fillRect(0, 0, VW, VH);
    }
    if (fb) {
      const pattern = fb.type === 'pattern';
      if (pattern) {
        g.fillStyle = `rgba(34,197,94,${0.18 + 0.12 * (this.frame % 2)})`;
        g.fillRect(0, 0, VW, VH);
      }
      g.font = 'bold 11px ui-monospace, monospace';
      g.textAlign = 'center';
      const label = pattern ? 'PREDICTABLE STIM' : 'UNPREDICTABLE STIM';
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(VW / 2 - 62, 18, 124, 16);
      g.fillStyle = pattern ? '#4ade80' : '#f87171';
      g.fillText(label, VW / 2, 30);
    }
  }

  drawMinimap(game) {
    const g = this.ctx;
    const S = 54;
    const ox = VW - S - 4;
    const oy = 4;
    const sc = S / ARENA.size;
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(ox, oy, S, S);
    g.strokeStyle = 'rgba(160,160,160,0.7)';
    g.strokeRect(ox + sc + 0.5, oy + sc + 0.5, S - 2 * sc - 1, S - 2 * sc - 1);
    // math y-up -> screen y-down
    const mx = (x) => ox + x * sc;
    const my = (y) => oy + S - y * sc;
    const cx = mx(ARENA.cx);
    const cy = my(ARENA.cy);
    const fov = Math.atan(FOV_PLANE);
    g.fillStyle = 'rgba(250,250,180,0.18)';
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(game.view + fov) * 30, cy - Math.sin(game.view + fov) * 30);
    g.lineTo(cx + Math.cos(game.view - fov) * 30, cy - Math.sin(game.view - fov) * 30);
    g.closePath();
    g.fill();
    for (const e of game.enemies) {
      if (!e.alive) continue;
      const p = game.pos(e);
      g.fillStyle = '#ef4444';
      g.fillRect(Math.round(mx(p.x)) - 1, Math.round(my(p.y)) - 1, 3, 3);
    }
    g.fillStyle = '#4ade80';
    g.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
  }
}

function shadeColor(c, f) {
  const r = (c & 255) * f;
  const g = ((c >>> 8) & 255) * f;
  const b = ((c >>> 16) & 255) * f;
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}
