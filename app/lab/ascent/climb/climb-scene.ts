"use client";

import type * as THREE_NS from "three";
import { CLIMB_STOPS } from "@/lib/lab/lab-content";
import {
  disposeObject,
  rampColor,
  rampValue,
  smoothstep,
  type SceneApi,
  type SceneHandle,
} from "@/lib/lab/scene";

/**
 * The Climb — a port of the Landscape reference, rebuilt for React and three r185.
 *
 * The camera walks a Catmull-Rom trail curve through procedural terrain. Sky, fog,
 * sun colour, rain, snow, fireflies and a summit glow are all keyed to scroll.
 *
 * The light follows an overnight ascent, because the written bands demand it: the camp band
 * is what the archive is really about and every frame in it is a night sky, so the scene has
 * to actually be dark there. That fixes the arc for free — you walk in during the day, shoot
 * the sky at camp, leave in the blue hour and reach the ridge at sunrise, which is both how
 * these walks really go and why the summit gold reads as earned rather than applied.
 */

const SKY = [
  { t: 0, hex: 0x5c6a52 },
  { t: 0.2, hex: 0x8f9a9e },
  { t: 0.34, hex: 0xa9bdcf },
  { t: 0.48, hex: 0xb7a189 },
  { t: 0.55, hex: 0x46405c },
  { t: 0.6, hex: 0x0c1020 },
  { t: 0.7, hex: 0x0a0e1b },
  { t: 0.78, hex: 0x22385a },
  { t: 0.88, hex: 0x8a7c92 },
  { t: 1, hex: 0xe8b878 },
];

/**
 * How much daylight there is, 0–1, on the same curve as the sky. Everything that responds to
 * nightfall reads this rather than progress, so nothing can brighten while the sky darkens.
 */
const DAYLIGHT = [
  { t: 0, v: 0.9 },
  { t: 0.34, v: 1 },
  { t: 0.48, v: 0.78 },
  { t: 0.56, v: 0.2 },
  { t: 0.6, v: 0.03 },
  { t: 0.72, v: 0.03 },
  { t: 0.8, v: 0.2 },
  { t: 0.9, v: 0.62 },
  { t: 1, v: 1 },
];

function glowTexture(THREE: typeof THREE_NS, color: string, size = 128) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/**
 * A small sprite for points: solid to most of its radius, then a short fade. `glowTexture`'s
 * pure falloff is only opaque at the exact centre, so a two-pixel star drawn with it almost
 * disappears — but an untextured point renders as a hard square. This is the middle.
 */
function dotTexture(THREE: typeof THREE_NS, size = 64) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const mid = size / 2;
  const g = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,0.95)");
  g.addColorStop(0.8, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/**
 * A disc with a soft halo, rather than the pure radial falloff used for glows. A plain
 * gradient at this scale reads as a smudge on the sky instead of as the moon.
 */
function moonTexture(THREE: typeof THREE_NS, size = 256) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const mid = size / 2;
  const halo = ctx.createRadialGradient(mid, mid, size * 0.09, mid, mid, mid);
  halo.addColorStop(0, "rgba(214,228,255,0.5)");
  halo.addColorStop(0.45, "rgba(190,208,240,0.12)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);
  const disc = ctx.createRadialGradient(mid, mid, 0, mid, mid, size * 0.11);
  disc.addColorStop(0, "rgba(248,250,255,1)");
  disc.addColorStop(0.82, "rgba(236,242,255,1)");
  disc.addColorStop(1, "rgba(226,236,255,0)");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(mid, mid, size * 0.11, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

function heightAt(THREE: typeof THREE_NS, x: number, z: number) {
  const noise =
    Math.sin(x * 0.15 + z * 0.08) * 2.2 + Math.sin(x * 0.4 - z * 0.2) * 0.8 + Math.cos(z * 0.05) * 3;
  const rise = THREE.MathUtils.clamp(-z / 170, 0, 1) * 14;
  return noise + rise;
}

export function buildClimbScene({ THREE, renderer, width, height }: SceneApi): SceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);

  const skyStops = SKY.map((s) => ({ t: s.t, color: new THREE.Color(s.hex) }));
  const sky = new THREE.Color(SKY[0].hex);
  const fog = new THREE.Fog(SKY[0].hex, 15, 150);
  scene.fog = fog;

  // The sky is a dome rather than `scene.background`, because a plain background colour is not
  // tone mapped while fogged geometry is. With ACES enabled the two can never match, so the
  // fully-fogged distant range showed up as a hard-edged slab hanging in the sky. A dome goes
  // through the same shading path as everything else, so fog resolves into it exactly.
  const skyMat = new THREE.MeshBasicMaterial({
    color: sky,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(460, 24, 16), skyMat);
  skyDome.renderOrder = -1;
  scene.add(skyDome);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3226, 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d8, 1.1);
  sun.position.set(30, 60, 20);
  scene.add(sun);

  const h = (x: number, z: number) => heightAt(THREE, x, z);

  // ── Terrain, banded green → rock → snow with altitude ────
  // Runs well past the summit at z = −190 so the camera never reaches the edge of the
  // world and never sees the distant range as a flat slab.
  const TERRAIN_OFFSET = -110;
  const terrainGeo = new THREE.PlaneGeometry(190, 620, 34, 150);
  terrainGeo.rotateX(-Math.PI / 2);
  const tpos = terrainGeo.attributes.position;
  const tcol = new Float32Array(tpos.count * 3);
  const cGreen = new THREE.Color(0x4c5a3e);
  const cRock = new THREE.Color(0x6b6a63);
  const cSnow = new THREE.Color(0xeff1ee);
  const scratch = new THREE.Color();
  for (let i = 0; i < tpos.count; i += 1) {
    const x = tpos.getX(i);
    // Local z is offset from world z, and heightAt must agree with the walk in world space.
    const z = tpos.getZ(i) + TERRAIN_OFFSET;
    tpos.setY(i, h(x, z));
    // Bands are keyed to the written stops: green gives way to rock by the tree line
    // (z ≈ −85) and snow only begins above the lake (z ≈ −140), so the camp band still
    // reads as rock. Previously snow started low enough to whiten the camp at 3,800 m.
    const bandT = THREE.MathUtils.clamp((5 - z) / 90, 0, 1);
    scratch.copy(cGreen).lerp(cRock, bandT);
    scratch.lerp(cSnow, THREE.MathUtils.clamp((-140 - z) / 45, 0, 1));
    tcol[i * 3] = scratch.r;
    tcol[i * 3 + 1] = scratch.g;
    tcol[i * 3 + 2] = scratch.b;
  }
  terrainGeo.setAttribute("color", new THREE.BufferAttribute(tcol, 3));
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
  );
  terrain.position.z = TERRAIN_OFFSET;
  scene.add(terrain);

  // The reference had a flat 2D ridge shape standing in for a distant range. It is gone on
  // purpose: with only ten points and a 2.1× scale it read as a hard-edged slab cutting across
  // mid-sky, and being a billboard it could never agree with the fog around it. The terrain
  // already runs to z ≈ −420, well past the summit at −190, so the far range is real geometry.

  // ── Trail curve ──────────────────────────────────────────
  const waypoints: [number, number][] = [
    [2, 8], [11, -8], [-9, -22], [10, -38], [-11, -54], [7, -70], [-7, -86],
    [8, -102], [-4, -118], [5, -134], [-3, -148], [3, -160], [1, -170], [0, -180], [0, -190],
  ];
  const trailCurve = new THREE.CatmullRomCurve3(
    waypoints.map(([x, z]) => new THREE.Vector3(x, h(x, z) + 0.12, z)),
    false,
    "catmullrom",
    0.4
  );

  // Ribbon mesh swept along the curve.
  const segments = 240;
  const width_ = 1.7;
  const positions: number[] = [];
  const uvs: number[] = [];
  const trailAlpha: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const p = trailCurve.getPointAt(t);
    const tangent = trailCurve.getTangentAt(t);
    const right = new THREE.Vector3().crossVectors(tangent, up);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    else right.normalize();
    const l = p.clone().addScaledVector(right, -width_ / 2);
    const r = p.clone().addScaledVector(right, width_ / 2);
    // Sample the terrain per-vertex instead of interpolating between waypoint heights,
    // otherwise the ribbon floats off the ground between waypoints — very visible on snow.
    l.y = h(l.x, l.z) + 0.06;
    r.y = h(r.x, r.z) + 0.06;
    positions.push(l.x, l.y, l.z, r.x, r.y, r.z);
    uvs.push(0, t * 50, 1, t * 50);
    // The snowfield band is written as "the path erases itself", so it has to. A packed
    // earth ribbon drawn across the snow above the tree line contradicts the text and, on
    // white ground, reads as a black gash rather than a trail.
    const a = 1 - smoothstep(t, 0.72, 0.9);
    trailAlpha.push(1, 1, 1, a, 1, 1, 1, a);
    if (i < segments) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  trailGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  // Four components: three.js reads the alpha channel of a vertex colour attribute, which is
  // how the ribbon can fade along its own length without a custom shader.
  trailGeo.setAttribute("color", new THREE.Float32BufferAttribute(trailAlpha, 4));
  trailGeo.setIndex(indices);
  trailGeo.computeVertexNormals();

  const trailCanvas = document.createElement("canvas");
  trailCanvas.width = 16;
  trailCanvas.height = 16;
  const tctx = trailCanvas.getContext("2d")!;
  const tg = tctx.createLinearGradient(0, 0, 16, 0);
  tg.addColorStop(0, "#6b5940");
  tg.addColorStop(0.5, "#a68b68");
  tg.addColorStop(1, "#6b5940");
  tctx.fillStyle = tg;
  tctx.fillRect(0, 0, 16, 16);
  const trailTex = new THREE.CanvasTexture(trailCanvas);
  trailTex.wrapT = THREE.RepeatWrapping;
  trailTex.colorSpace = THREE.SRGBColorSpace;
  scene.add(
    new THREE.Mesh(
      trailGeo,
      new THREE.MeshStandardMaterial({
        map: trailTex,
        roughness: 1,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
      })
    )
  );

  // ── Trees and rocks ──────────────────────────────────────
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x3c4a34, roughness: 1 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 1 });
  const coneGeo = new THREE.ConeGeometry(0.6, 2.2, 7);
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.7, 6);
  // Sample the trail's x across its length so set dressing can be kept clear of the path
  // itself, rather than merely clear of x = 0 — the trail weaves by ±11.
  const TRAIL_SAMPLES = 64;
  const trailXs: number[] = [];
  const trailZs: number[] = [];
  for (let i = 0; i <= TRAIL_SAMPLES; i += 1) {
    const p = trailCurve.getPointAt(i / TRAIL_SAMPLES);
    trailXs.push(p.x);
    trailZs.push(p.z);
  }
  const trailXAt = (z: number) => {
    for (let i = 0; i < trailZs.length - 1; i += 1) {
      const z0 = trailZs[i];
      const z1 = trailZs[i + 1];
      if (z <= z0 && z >= z1) {
        const local = (z0 - z) / (z0 - z1 || 1);
        return trailXs[i] + (trailXs[i + 1] - trailXs[i]) * local;
      }
    }
    return trailXs[z > trailZs[0] ? 0 : trailXs.length - 1];
  };
  /** A random x at this z that is at least `clearance` away from the trail. */
  const offTrailX = (z: number, spread: number, clearance: number) => {
    const centre = trailXAt(z);
    const side = Math.random() < 0.5 ? -1 : 1;
    return centre + side * (clearance + Math.random() * spread);
  };

  const addTree = (x: number, z: number) => {
    const s = 1.1 + Math.random() * 1.7;
    const base = h(x, z);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.scale.setScalar(s);
    trunk.position.set(x, base + 0.35 * s, z);
    scene.add(trunk);
    const cone = new THREE.Mesh(coneGeo, treeMat);
    cone.scale.setScalar(s);
    cone.position.set(x, base + 1.8 * s, z);
    scene.add(cone);
  };
  // Trees stop at −95, which is where the terrain's snow band takes over, so the
  // treeline in the scene lines up with the treeline in the story.
  for (let i = 0; i < 115; i += 1) {
    const dense = i > 65;
    const z = -Math.random() * (dense ? 50 : 95);
    addTree(offTrailX(z, dense ? 22 : 34, 7), z);
  }

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a766c, roughness: 1 });
  for (let i = 0; i < 34; i += 1) {
    const z = -20 - Math.random() * 165;
    const s = 0.6 + Math.random() * 1.8;
    const x = offTrailX(z, 34, 3.2 + s);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), rockMat);
    rock.position.set(x, h(x, z) + s * 0.5, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    scene.add(rock);
  }

  // ── Waymarker posts ──────────────────────────────────────
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.9 });
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xc4622f,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  // One waymarker per written stop, so a marker passing the camera coincides with the band
  // label changing rather than landing at an unrelated point on the trail.
  CLIMB_STOPS.forEach(({ t }) => {
    const p = trailCurve.getPointAt(Math.min(0.998, t));
    const ground = h(p.x + 0.9, p.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.3, 6), postMat);
    post.position.set(p.x + 0.9, ground + 0.65, p.z);
    scene.add(post);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), flagMat);
    flag.position.set(p.x + 1.06, ground + 1.15, p.z);
    scene.add(flag);
  });

  // ── Life along the trail ─────────────────────────────────
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd8ad85, roughness: 0.9 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x33363c, roughness: 0.9 });

  const person = (shirt: number, sit: boolean) => {
    const g = new THREE.Group();
    const cloth = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, sit ? 0.32 : 0.5, 4, 8), cloth);
    body.position.y = sit ? 0.4 : 0.55;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), skinMat);
    head.position.y = sit ? 0.68 : 1.0;
    g.add(head);
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, sit ? 0.42 : 0.55, 6);
    [-0.09, 0.09].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      if (sit) {
        leg.rotation.x = Math.PI / 2;
        leg.position.set(lx, 0.16, 0.2);
      } else leg.position.set(lx, 0.27, 0);
      g.add(leg);
    });
    return g;
  };

  const quadruped = (color: number, scale: number, antlers: boolean, horns: boolean) => {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22 * scale, 0.5 * scale, 4, 8), mat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.45 * scale;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 8, 8), mat);
    head.position.set(0.42 * scale, 0.58 * scale, 0);
    g.add(head);
    const legGeo = new THREE.CylinderGeometry(0.045 * scale, 0.045 * scale, 0.42 * scale, 6);
    [[-0.22, -0.18], [-0.22, 0.18], [0.22, -0.18], [0.22, 0.18]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(lx * scale, 0.21 * scale, lz * scale);
      g.add(leg);
    });
    if (antlers || horns) {
      const capMat = new THREE.MeshStandardMaterial({
        color: antlers ? 0x6b5a44 : 0xd8d0c0,
        roughness: 0.85,
      });
      [-1, 1].forEach((s) => {
        const geo = antlers
          ? new THREE.ConeGeometry(0.03 * scale, 0.35 * scale, 5)
          : new THREE.ConeGeometry(0.025 * scale, 0.2 * scale, 5);
        const horn = new THREE.Mesh(geo, capMat);
        horn.position.set(0.4 * scale, (antlers ? 0.78 : 0.7) * scale, 0.07 * scale * s);
        horn.rotation.z = (antlers ? -0.3 : -0.5) * s;
        g.add(horn);
      });
    }
    return g;
  };

  const tent = (color: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.9, 0);
    shape.lineTo(0, 1.1);
    shape.lineTo(0.9, 0);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false });
    geo.rotateY(Math.PI / 2);
    geo.translate(-0.9, 0, 0);
    return new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide })
    );
  };

  const fireGlowTex = glowTexture(THREE, "rgba(255,150,60,0.9)");
  const campfire = () => {
    const g = new THREE.Group();
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 1 });
    for (let i = 0; i < 4; i += 1) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 2;
      log.position.y = 0.06;
      g.add(log);
    }
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: fireGlowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.scale.set(1.4, 1.4, 1);
    glow.position.y = 0.3;
    g.add(glow);
    return g;
  };

  const vignette = (type: string) => {
    const g = new THREE.Group();
    if (type === "deer") {
      const d1 = quadruped(0x6b4a30, 1, true, false);
      d1.position.x = -0.6;
      g.add(d1);
      const d2 = quadruped(0x7a5a3c, 0.85, false, false);
      d2.position.set(0.7, 0, 0.6);
      g.add(d2);
    } else if (type === "goats") {
      for (let i = 0; i < 3; i += 1) {
        const goat = quadruped(0xd8d2c0, 0.7, false, true);
        goat.position.set(i * 0.7 - 0.7, 0, (i % 2) * 0.5);
        g.add(goat);
      }
    } else if (type === "bear") {
      g.add(quadruped(0x3e2f22, 1.5, false, false));
    } else if (type === "hiker") {
      g.add(person(0xb0432a, false));
    } else if (type === "sitting") {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), rockMat);
      rock.position.y = 0.1;
      g.add(rock);
      const p = person(0x2a6b4a, true);
      p.position.y = 0.35;
      g.add(p);
    } else if (type === "lakeside") {
      const lakeGeo = new THREE.CircleGeometry(1, 32);
      lakeGeo.scale(5, 1, 3.4);
      lakeGeo.rotateX(-Math.PI / 2);
      g.add(
        new THREE.Mesh(
          lakeGeo,
          new THREE.MeshStandardMaterial({
            color: 0x2f5f73,
            roughness: 0.15,
            metalness: 0.3,
            transparent: true,
            opacity: 0.92,
          })
        )
      );
      const p1 = person(0x4a4ab0, true);
      p1.position.set(-3.2, 0, -2.4);
      g.add(p1);
      const p2 = person(0xb0972a, false);
      p2.position.set(-3.6, 0, -1.8);
      g.add(p2);
    } else if (type === "camp") {
      const t1 = tent(0xc4622f);
      t1.position.x = -1.2;
      g.add(t1);
      const t2 = tent(0x4a5a95);
      t2.position.set(0.6, 0, 0.8);
      g.add(t2);
      g.add(campfire());
      const p = person(0x555555, true);
      p.position.set(0.2, 0.35, -0.9);
      g.add(p);
    } else if (type === "greeting") {
      const p1 = person(0x2a6b4a, false);
      p1.position.x = -0.5;
      p1.rotation.y = 0.5;
      g.add(p1);
      const p2 = person(0xb0432a, false);
      p2.position.set(0.5, 0, 0.1);
      p2.rotation.y = -2.6;
      g.add(p2);
    } else if (type === "meadow") {
      const colors = [0xe8608a, 0xf0d050, 0xffffff];
      for (let i = 0; i < 40; i += 1) {
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 5, 5),
          new THREE.MeshBasicMaterial({ color: colors[i % 3] })
        );
        flower.position.set((Math.random() - 0.5) * 6, 0.1, (Math.random() - 0.5) * 6);
        g.add(flower);
      }
    }
    return g;
  };

  const plan = [
    { t: 0.05, type: "deer", dist: 4 },
    { t: 0.09, type: "meadow", dist: -4.5 },
    { t: 0.16, type: "hiker", dist: 1.6 },
    { t: 0.23, type: "lakeside", dist: -7 },
    { t: 0.32, type: "goats", dist: 4.5 },
    { t: 0.4, type: "sitting", dist: 3 },
    { t: 0.48, type: "bear", dist: -4 },
    { t: 0.58, type: "camp", dist: -4.5 },
    { t: 0.68, type: "greeting", dist: 3.5 },
  ];
  plan.forEach((v) => {
    const p = trailCurve.getPointAt(v.t);
    const tangent = trailCurve.getTangentAt(v.t);
    const right = new THREE.Vector3().crossVectors(tangent, up);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    else right.normalize();
    const g = vignette(v.type);
    g.position.copy(p.clone().addScaledVector(right, v.dist));
    g.position.y = h(g.position.x, g.position.z);
    g.rotation.y = Math.atan2(tangent.x, tangent.z);
    scene.add(g);
  });

  // ── Weather and light ────────────────────────────────────
  const fireflyTex = glowTexture(THREE, "rgba(220,255,140,1)");
  const ffPos = new Float32Array(70 * 3);
  for (let i = 0; i < 70; i += 1) {
    ffPos[i * 3] = (Math.random() - 0.5) * 70;
    ffPos[i * 3 + 1] = Math.random() * 3 + 0.3;
    ffPos[i * 3 + 2] = -Math.random() * 90;
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
  const fireflies = new THREE.Points(
    ffGeo,
    new THREE.PointsMaterial({
      color: 0xd8f27a,
      size: 0.12,
      map: fireflyTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scene.add(fireflies);

  // Untextured points render as hard squares, which is very obvious on snowflakes near the
  // camera. A soft disc costs one small texture and makes them read as particles.
  const dotTex = dotTexture(THREE);
  const makeField = (count: number, yMax: number, zNear: number, zSpan: number, color: number, size: number) => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 90;
      arr[i * 3 + 1] = Math.random() * yMax + 2;
      arr[i * 3 + 2] = zNear - Math.random() * zSpan;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      map: dotTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return { pts, mat };
  };
  const rain = makeField(700, 40, 0, 140, 0xaac4d8, 0.09);
  const snow = makeField(500, 45, -70, 130, 0xffffff, 0.22);

  const sunGlowTex = glowTexture(THREE, "rgba(255,225,170,0.9)");
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: sunGlowTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  sunGlow.scale.set(90, 90, 1);
  sunGlow.position.set(35, 75, -195);
  scene.add(sunGlow);

  // ── Night sky ────────────────────────────────────────────
  // The whole point of the camp band. Stars sit on a shell that rides with the camera and
  // ignore fog, so they read as sky rather than as something floating over the valley. A
  // denser tilted band stands in for the Milky Way, which is the subject of those frames.
  const STAR_R = 300;
  // Two layers rather than a per-vertex size attribute, which PointsMaterial ignores without a
  // custom shader. A sparse set of brighter stars is what stops a starfield looking like noise.
  const starLayer = (count: number, size: number, bandShare: number, tint: number) => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Some stars are pulled towards a tilted band, standing in for the Milky Way.
      const inBand = Math.random() < bandShare;
      const theta = Math.random() * Math.PI * 2;
      const phi = inBand
        ? Math.PI / 2 - (Math.random() - 0.5) * 0.38 + Math.sin(theta * 2) * 0.3
        : Math.acos(Math.random() * 0.95);
      pos[i * 3] = STAR_R * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(STAR_R * Math.cos(phi)) * 0.85 + 12;
      pos[i * 3 + 2] = STAR_R * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: tint,
      size,
      map: dotTex,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return { pts, mat };
  };
  const starsDim = starLayer(1400, 2.2, 0.42, 0xc8d2f0);
  const starsBright = starLayer(160, 4.4, 0.2, 0xf2f5ff);
  const starLayers = [starsDim, starsBright];

  const moonTex = moonTexture(THREE);
  const moon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: moonTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  moon.scale.set(44, 44, 1);
  scene.add(moon);

  // Fog colour must track the background exactly. Biasing one and not the other turns the
  // fully-fogged distant range into a visible hard-edged slab hanging in the sky.
  const white = new THREE.Color(0xffffff);

  return {
    update({ progress, elapsed }) {
      const t = Math.min(0.998, progress);
      const p = trailCurve.getPointAt(t);
      const ahead = trailCurve.getPointAt(Math.min(1, t + 0.015));
      const eye = 1.65 + Math.sin(elapsed * 2.2) * 0.05;
      // Walk on the terrain, not on the curve's interpolated height.
      camera.position.set(p.x, h(p.x, p.z) + eye, p.z);
      camera.lookAt(ahead.x, h(ahead.x, ahead.z) + eye * 0.9, ahead.z);

      const day = rampValue(DAYLIGHT, progress);
      const night = 1 - day;

      rampColor(THREE, skyStops, progress, sky);
      fog.color.copy(sky);
      // Materials copy colours on construction rather than holding the instance, so the dome
      // has to be updated explicitly or it stays frozen on the first stop of the ramp.
      skyMat.color.copy(sky);
      sun.color.copy(sky).lerp(white, 0.5);
      // Moonlight rather than no light: enough that the terrain still has form at camp, which
      // is the one band you are meant to linger in.
      sun.intensity = THREE.MathUtils.lerp(0.3, 1.5, day);
      hemi.intensity = THREE.MathUtils.lerp(0.22, 0.7, day);
      // Open the draw distance as you climb: at the summit you can finally see out. At night
      // pull it back in, so darkness closes the world down instead of showing a black slab.
      const reach = THREE.MathUtils.lerp(150, 420, smoothstep(progress, 0.55, 1));
      fog.far = THREE.MathUtils.lerp(reach, 120, night);

      const rainIn = smoothstep(progress, 0.02, 0.1);
      const rainOut = 1 - smoothstep(progress, 0.28, 0.4);
      rain.mat.opacity = Math.max(0, rainIn * rainOut) * 0.55;
      if (rain.mat.opacity > 0.01) {
        const arr = rain.pts.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] -= 0.9;
          if (arr[i] < 0) arr[i] = 40;
        }
        rain.pts.geometry.attributes.position.needsUpdate = true;
      }

      snow.mat.opacity = smoothstep(progress, 0.5, 0.8) * THREE.MathUtils.lerp(0.35, 0.85, day);
      snow.pts.rotation.y += 0.0004;
      // Sunrise only, and only once the sky has started coming back. Ramping this from 0.6
      // put a sun in the middle of the night, directly under the Milky Way frames.
      sunGlow.material.opacity = smoothstep(progress, 0.86, 1) * 0.95;
      (fireflies.material as THREE_NS.PointsMaterial).opacity =
        (1 - smoothstep(progress, 0.25, 0.4)) * 0.85;
      fireflies.rotation.y = elapsed * 0.02;

      // Stars ride with the camera and turn very slowly, so long scroll pauses at camp still
      // have some life in them without reading as a spinning skybox.
      skyDome.position.copy(camera.position);
      const starOpacity = Math.max(0, night * 1.05 - 0.05);
      for (const layer of starLayers) {
        layer.pts.position.set(camera.position.x, 0, camera.position.z);
        layer.pts.rotation.y = elapsed * 0.006;
        layer.mat.opacity = starOpacity;
      }
      moon.position.set(camera.position.x - 62, 74, camera.position.z - 150);
      moon.material.opacity = night * 0.8;
    },

    render() {
      renderer.render(scene, camera);
    },

    resize(w, h_) {
      camera.aspect = w / h_;
      camera.updateProjectionMatrix();
    },

    dispose() {
      disposeObject(scene);
      trailTex.dispose();
      fireGlowTex.dispose();
      fireflyTex.dispose();
      sunGlowTex.dispose();
      moonTex.dispose();
      dotTex.dispose();
    },
  };
}

export function liteClimbBackground(progress: number): string {
  let a = SKY[0];
  let b = SKY[SKY.length - 1];
  for (let i = 0; i < SKY.length - 1; i += 1) {
    if (progress >= SKY[i].t && progress <= SKY[i + 1].t) {
      a = SKY[i];
      b = SKY[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const local = Math.min(1, Math.max(0, (progress - a.t) / span));
  const mix = (shift: number) => {
    const ca = (a.hex >> shift) & 0xff;
    const cb = (b.hex >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * local);
  };
  const top = `rgb(${mix(16)}, ${mix(8)}, ${mix(0)})`;
  // Ground has to darken with the sky, or the lite path shows a lit valley under a night sky
  // at exactly the band where the night is the subject.
  const day = rampValue(DAYLIGHT, progress);
  const g = (lit: number, dark: number) => Math.round(dark + (lit - dark) * day);
  const ground = `rgb(${g(0x23, 0x0b)}, ${g(0x26, 0x0d)}, ${g(0x1f, 0x14)})`;
  return `linear-gradient(to bottom, ${top} 0%, ${top} 58%, ${ground} 100%)`;
}
