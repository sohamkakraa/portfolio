"use client";

import type * as THREE_NS from "three";
import { disposeObject, rampColor, smoothstep, type SceneApi, type SceneHandle } from "@/lib/lab/scene";

/**
 * The Route. The camera walks one continuous path and the world morphs under it:
 * India → the Gulf → East Africa → the Netherlands.
 *
 * Everything derives from a single normalised distance `d`, exactly the trick the Streets
 * reference uses for its city-to-town seam, generalised to four regions. Ground colour,
 * building silhouette, vegetation, sky and weather all read the same number, so the
 * transitions are coherent without any hand-authored keyframes.
 */

const PATH_START = 12;
const PATH_END = -420;
const PATH_LEN = PATH_START - PATH_END;

/**
 * Route-distance beyond which a structure is culled. Must stay below the tightest gap between
 * two region centres, otherwise a region's forms survive into the next one — with six regions
 * the closest pair is 0.14 apart, so the old 0.2 left Eindhoven's brick terraces standing in
 * the snow above Grindelwald.
 */
const CULL_T = 0.085;

/**
 * Region centres, matching the `t` values on ROUTE_CHAPTERS.
 *
 * `arid` and `wet` let the weather read the region rather than the raw progress value,
 * so haze belongs to the Gulf and rain to the Netherlands even though the India detour
 * sits between them. Adding a region never requires touching the update loop.
 */
const REGIONS = [
  { t: 0.08, sky: 0xc9a878, ground: 0x8a7154, build: 0xc0a583, kind: "dust", arid: 1, wet: 0 },
  { t: 0.26, sky: 0x9fb0b8, ground: 0x4e5c46, build: 0x3f5138, kind: "alpine", arid: 0, wet: 0.2 },
  { t: 0.45, sky: 0xd0c1a2, ground: 0xc0aa86, build: 0x5b6b78, kind: "glass", arid: 0.85, wet: 0 },
  { t: 0.63, sky: 0x9fb9c9, ground: 0x8d7c46, build: 0x5d6b3a, kind: "savanna", arid: 0.35, wet: 0 },
  { t: 0.8, sky: 0x6e7883, ground: 0x4c5442, build: 0x7d6355, kind: "drizzle", arid: 0, wet: 1 },
  // Grindelwald closes the route. It returns to the alpine of the India detour on purpose —
  // same kind of mountain, except by this point he is up there on his own.
  { t: 0.94, sky: 0xbccbd8, ground: 0xdfe4e6, build: 0x4a5560, kind: "snow", arid: 0, wet: 0.45 },
] as const;

/**
 * Ground height in world space. The corridor stays flat and the flanks undulate, which is
 * where every structure stands — so set dressing has to read this too. Placing groups at y = 0
 * on a displaced surface left acacias and Dutch terraces hovering a few metres up.
 */
function groundHeight(x: number, z: number) {
  const away = Math.min(1, Math.abs(x) / 40);
  return away * (Math.sin(x * 0.06 + z * 0.05) * 1.6 + Math.cos(z * 0.021) * 2.4);
}

export function zAt(t: number) {
  return PATH_START - PATH_LEN * t;
}
function tAt(z: number) {
  return Math.min(1, Math.max(0, (PATH_START - z) / PATH_LEN));
}

/** Which region dominates at this distance, and how far into the blend we are. */
function regionAt(t: number) {
  let idx = 0;
  for (let i = 0; i < REGIONS.length; i += 1) {
    if (t >= REGIONS[i].t) idx = i;
  }
  const a = REGIONS[idx];
  const b = REGIONS[Math.min(REGIONS.length - 1, idx + 1)];
  const span = b.t - a.t || 1;
  const local = Math.min(1, Math.max(0, (t - a.t) / span));
  return { a, b, local, idx };
}

/** Interpolate any numeric region property along the route. */
function regionScalar(t: number, key: "arid" | "wet") {
  const { a, b, local } = regionAt(t);
  return a[key] + (b[key] - a[key]) * local;
}

function glowTexture(THREE: typeof THREE_NS, color: string) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function windowTexture(THREE: typeof THREE_NS, base: string, lit: string, litChance: number) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 256);
  const cols = 8;
  const rows = 20;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      ctx.fillStyle = Math.random() < litChance ? lit : "rgba(255,255,255,0.07)";
      const w = 128 / cols;
      const h = 256 / rows;
      ctx.fillRect(x * w + w * 0.22, y * h + h * 0.2, w * 0.56, h * 0.55);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildRouteScene({ THREE, renderer, width, height }: SceneApi): SceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 700);

  const skyStops = REGIONS.map((r) => ({ t: r.t, color: new THREE.Color(r.sky) }));
  const sky = new THREE.Color(REGIONS[0].sky);
  scene.background = sky;
  // Deliberately short draw distance: you should not be able to see Dubai from India.
  // Each region has to be walked into before it resolves out of the haze.
  const fog = new THREE.Fog(REGIONS[0].sky, 16, 120);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2b2620, 0.72);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.05);
  sun.position.set(28, 52, 16);
  scene.add(sun);

  // ── Ground, vertex-coloured along the route ──────────────
  const groundGeo = new THREE.PlaneGeometry(300, PATH_LEN + 80, 30, 120);
  groundGeo.rotateX(-Math.PI / 2);
  const gpos = groundGeo.attributes.position;
  const gcol = new Float32Array(gpos.count * 3);
  const tmpA = new THREE.Color();
  const tmpB = new THREE.Color();
  for (let i = 0; i < gpos.count; i += 1) {
    const x = gpos.getX(i);
    const z = gpos.getZ(i) - PATH_LEN / 2 + PATH_START;
    gpos.setY(i, groundHeight(x, z));
    const { a, b, local } = regionAt(tAt(z));
    tmpA.set(a.ground);
    tmpB.set(b.ground);
    tmpA.lerp(tmpB, local);
    gcol[i * 3] = tmpA.r;
    gcol[i * 3 + 1] = tmpA.g;
    gcol[i * 3 + 2] = tmpA.b;
  }
  groundGeo.setAttribute("color", new THREE.BufferAttribute(gcol, 3));
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 })
  );
  ground.position.z = PATH_START - PATH_LEN / 2;
  scene.add(ground);

  // ── The path itself, colour-ramped like the reference's road dashes ──
  const pathGeo = new THREE.PlaneGeometry(7, PATH_LEN + 60, 1, 90);
  pathGeo.rotateX(-Math.PI / 2);
  const ppos = pathGeo.attributes.position;
  const pcol = new Float32Array(ppos.count * 3);
  for (let i = 0; i < ppos.count; i += 1) {
    const z = ppos.getZ(i) - PATH_LEN / 2 + PATH_START;
    const { a, b, local } = regionAt(tAt(z));
    tmpA.set(a.ground).multiplyScalar(0.62);
    tmpB.set(b.ground).multiplyScalar(0.62);
    tmpA.lerp(tmpB, local);
    pcol[i * 3] = tmpA.r;
    pcol[i * 3 + 1] = tmpA.g;
    pcol[i * 3 + 2] = tmpA.b;
  }
  pathGeo.setAttribute("color", new THREE.BufferAttribute(pcol, 3));
  const path = new THREE.Mesh(
    pathGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })
  );
  path.position.set(0, 0.06, PATH_START - PATH_LEN / 2);
  scene.add(path);

  // ── Shared materials ─────────────────────────────────────
  const glassTex = windowTexture(THREE, "#1e252b", "#c8e2ea", 0.34);
  const brickTex = windowTexture(THREE, "#7d6355", "#ffd894", 0.2);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb9a07c, roughness: 0.95 });
  const glassMat = new THREE.MeshStandardMaterial({
    map: glassTex,
    color: 0x8ea3b0,
    roughness: 0.45,
    metalness: 0.32,
  });
  const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x53372c, roughness: 0.9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b3a28, roughness: 1 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x5d6b3a, roughness: 1 });
  const scrubMat = new THREE.MeshStandardMaterial({ color: 0x8a7f4a, roughness: 1 });
  const coniferMat = new THREE.MeshStandardMaterial({ color: 0x2f4232, roughness: 1 });
  const boulderMat = new THREE.MeshStandardMaterial({ color: 0x6a6b64, roughness: 0.98 });
  const spruceMat = new THREE.MeshStandardMaterial({ color: 0x24352c, roughness: 1 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xe9eef0, roughness: 0.82 });

  // ── Set dressing, placed by distance and chosen by region ──
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  /** Each structure remembers where on the route it belongs, so far regions can be culled. */
  const structures: { group: THREE_NS.Object3D; t: number }[] = [];

  // Density is set against the cull window, not the whole route: only ~17% of these are ever
  // on screen at once, so 150 left each region looking like three props on an empty plain.
  for (let i = 0; i < 340; i += 1) {
    const z = PATH_START - 3 - Math.random() * (PATH_LEN - 6);
    const t = tAt(z);
    const { a, b, local } = regionAt(t);
    // A structure belongs to whichever region centre is *nearest*, not to the one it has just
    // left. Anchoring to the preceding centre meant a region's forms populated the entire span
    // up to the next one, so Dutch terraces stood on ground that was already half snow. The
    // ground colour interpolates linearly between centres, and switching forms at the midpoint
    // is the only rule that agrees with it.
    // No mixing across the seam at all. Blending even a third of the neighbour in near the
    // midpoint put a glass tower on the Himalayan skyline, and a 40-metre tower reads as a
    // mistake at any distance fog can offer. Ground colour interpolates between centres, which
    // is all the transition these regions can take when they are continents apart.
    const kind = (local < 0.5 ? a : b).kind;
    const side = Math.random() < 0.5 ? -1 : 1;
    // Wide enough that acacia canopies never clip through the camera on the path.
    const x = side * (11 + Math.random() * 42);
    const group = new THREE.Group();

    if (kind === "dust") {
      // Low sandstone masses, occasionally stepped like a temple plinth.
      const tiers = Math.random() < 0.35 ? 3 : 1;
      const w = 4 + Math.random() * 7;
      for (let s = 0; s < tiers; s += 1) {
        const shrink = 1 - s * 0.24;
        const h = (2.4 + Math.random() * 3.4) / tiers;
        const m = new THREE.Mesh(boxGeo, stoneMat);
        m.scale.set(w * shrink, h, (w * 0.8) * shrink);
        m.position.y = h / 2 + s * h;
        group.add(m);
      }
      group.rotation.y = Math.random() * 0.6;
    } else if (kind === "glass") {
      const h = 18 + Math.random() * 44;
      const w = 3.2 + Math.random() * 4.4;
      const m = new THREE.Mesh(boxGeo, glassMat);
      m.scale.set(w, h, w * (0.7 + Math.random() * 0.6));
      m.position.y = h / 2;
      if (Math.random() < 0.3) m.rotation.z = (Math.random() - 0.5) * 0.06;
      group.add(m);
    } else if (kind === "savanna") {
      if (Math.random() < 0.62) {
        // Acacia: thin trunk, wide flat canopy.
        const hgt = 3.4 + Math.random() * 2.6;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, hgt, 6), trunkMat);
        trunk.position.y = hgt / 2;
        group.add(trunk);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.2 + Math.random(), 9, 6), canopyMat);
        canopy.scale.set(1.5, 0.34, 1.5);
        canopy.position.y = hgt + 0.4;
        group.add(canopy);
      } else {
        const s = 0.5 + Math.random() * 0.9;
        const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), scrubMat);
        bush.position.y = s * 0.6;
        group.add(bush);
      }
    } else if (kind === "alpine") {
      if (Math.random() < 0.72) {
        // Deodar: tall, narrow, stacked cones — the Parvati valley silhouette.
        const hgt = 9 + Math.random() * 13;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, hgt * 0.3, 6), trunkMat);
        trunk.position.y = hgt * 0.15;
        group.add(trunk);
        for (let s = 0; s < 3; s += 1) {
          const r = (2.3 - s * 0.55) * (0.8 + Math.random() * 0.3);
          const cone = new THREE.Mesh(new THREE.ConeGeometry(r, hgt * 0.42, 7), coniferMat);
          cone.position.y = hgt * (0.3 + s * 0.24);
          group.add(cone);
        }
      } else {
        // Glacial boulders, the kind the trails are littered with.
        const s = 1.1 + Math.random() * 2.6;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), boulderMat);
        rock.position.y = s * 0.45;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.y = 0.7;
        group.add(rock);
      }
    } else if (kind === "snow") {
      // Grindelwald: spruce standing in snow, and boulders with snow sitting on top of them.
      // Narrower and darker than the deodars of the India detour, so the two alpine stretches
      // read as different mountains rather than the same asset used twice.
      if (Math.random() < 0.66) {
        const hgt = 8 + Math.random() * 11;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.26, hgt * 0.26, 6), trunkMat);
        trunk.position.y = hgt * 0.13;
        group.add(trunk);
        for (let s = 0; s < 3; s += 1) {
          const r = (1.5 - s * 0.36) * (0.85 + Math.random() * 0.3);
          const cone = new THREE.Mesh(new THREE.ConeGeometry(r, hgt * 0.4, 7), spruceMat);
          cone.position.y = hgt * (0.28 + s * 0.23);
          group.add(cone);
        }
        // A cap of snow on the crown, which is what makes it read as winter at a glance.
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.72, hgt * 0.16, 7), snowMat);
        cap.position.y = hgt * 0.92;
        group.add(cap);
      } else {
        const s = 1 + Math.random() * 2.2;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), boulderMat);
        rock.position.y = s * 0.42;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.y = 0.66;
        group.add(rock);
        const drift = new THREE.Mesh(new THREE.SphereGeometry(s * 0.82, 9, 6), snowMat);
        drift.scale.set(1.1, 0.34, 1.1);
        drift.position.y = s * 0.72;
        group.add(drift);
      }
    } else {
      // Dutch terrace: narrow, low, pitched roof, lit windows.
      const h = 5 + Math.random() * 4;
      const w = 3 + Math.random() * 2;
      const body = new THREE.Mesh(boxGeo, brickMat);
      body.scale.set(w, h, 6 + Math.random() * 2);
      body.position.y = h / 2;
      group.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.82, 2.2, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = h + 1.05;
      group.add(roof);
    }

    // Sit on the terrain, and sink very slightly so no gap opens between a base and a slope.
    group.position.set(x, groundHeight(x, z) - 0.15, z);
    scene.add(group);
    structures.push({ group, t });
  }

  // ── Waymarkers at each chapter ───────────────────────────
  const markerMat = new THREE.MeshStandardMaterial({ color: 0xd99a55, roughness: 0.6 });
  REGIONS.forEach((r) => {
    const z = zAt(r.t);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 6), trunkMat);
    post.position.set(4.6, 1.6, z);
    scene.add(post);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), markerMat);
    flag.position.set(5.0, 3.0, z);
    scene.add(flag);
  });

  // ── Weather: warm dust early, rain late ──────────────────
  function particleField(count: number, spread: number, colorHex: number, size: number, tex: THREE_NS.Texture | null) {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = Math.random() * 26 + 0.4;
      arr[i * 3 + 2] = PATH_START - Math.random() * PATH_LEN;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      ...(tex ? { map: tex, blending: THREE.AdditiveBlending } : {}),
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return { pts, mat };
  }

  const dustTex = glowTexture(THREE, "rgba(255,224,170,1)");
  const dust = particleField(420, 120, 0xffe0aa, 0.5, dustTex);
  const rain = particleField(900, 120, 0xbcd0dc, 0.11, null);

  // ── Sun disc low on the horizon, for the Gulf haze ───────
  const sunGlowTex = glowTexture(THREE, "rgba(255,228,175,0.95)");
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: sunGlowTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  sunGlow.scale.set(120, 120, 1);
  scene.add(sunGlow);

  const tmpWhite = new THREE.Color(0xffffff);

  /**
   * The handover. For most of the route the camera is on rails and the visitor is a
   * passenger — which is the point, because those moves were not mine to make. Across the
   * final chapter the pointer gradually starts to steer the look direction and the scripted
   * sway fades out. No toggle, no prompt; the world just begins answering to you.
   */
  let pointerX = 0;
  let pointerY = 0;
  let steerX = 0;
  let steerY = 0;
  const onPointerMove = (e: PointerEvent) => {
    pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  return {
    update({ progress, elapsed }) {
      rampColor(THREE, skyStops, progress, sky);
      fog.color.copy(sky);
      sun.color.copy(sky).lerp(tmpWhite, 0.5);

      // Overcast flattens the light wherever the region is wet, not at a fixed distance.
      const wet = regionScalar(progress, "wet");
      const arid = regionScalar(progress, "arid");
      sun.intensity = THREE.MathUtils.lerp(1.15, 0.42, wet);
      hemi.intensity = THREE.MathUtils.lerp(0.7, 0.95, wet);
      // Kept under the distance one region span covers (~60 units), so the haze closes before
      // the next country's silhouettes can resolve out of it.
      fog.far = THREE.MathUtils.lerp(72, 60, wet);

      // Hide anything belonging to a region this far off. CULL_T sits just past the fog
      // wall, so a silhouette is already the colour of the sky by the time it disappears —
      // which is what stops Dubai's towers from standing on the Kenyan horizon.
      for (const s of structures) {
        s.group.visible = Math.abs(s.t - progress) < CULL_T;
      }

      const camZ = THREE.MathUtils.lerp(PATH_START, PATH_END + 30, progress);
      const handover = smoothstep(progress, 0.82, 0.99);
      steerX += (pointerX - steerX) * 0.045;
      steerY += (pointerY - steerY) * 0.045;

      const sway = Math.sin(progress * 9) * 0.7 * (1 - handover);
      const bob = 2.7 + Math.sin(elapsed * 1.4) * 0.07;
      camera.position.set(sway + steerX * 1.9 * handover, bob, camZ);
      camera.lookAt(
        sway + steerX * 9 * handover,
        bob + 0.45 - steerY * 3.2 * handover,
        camZ - 22
      );

      dust.mat.opacity = arid * 0.5;
      rain.mat.opacity = wet * 0.55;
      dust.pts.rotation.y = elapsed * 0.01;

      if (rain.mat.opacity > 0.01) {
        const arr = rain.pts.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] -= 0.85;
          if (arr[i] < 0) arr[i] = 26;
        }
        rain.pts.geometry.attributes.position.needsUpdate = true;
      }

      sunGlow.position.set(46, 26, camZ - 210);
      sunGlow.material.opacity = arid * 0.8;
    },

    render() {
      renderer.render(scene, camera);
    },

    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },

    dispose() {
      window.removeEventListener("pointermove", onPointerMove);
      disposeObject(scene);
      glassTex.dispose();
      brickTex.dispose();
      dustTex.dispose();
      sunGlowTex.dispose();
    },
  };
}

export function liteRouteBackground(progress: number): string {
  const { a, b, local } = regionAt(progress);
  const mix = (ha: number, hb: number, shift: number) => {
    const ca = (ha >> shift) & 0xff;
    const cb = (hb >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * local);
  };
  const top = `rgb(${mix(a.sky, b.sky, 16)}, ${mix(a.sky, b.sky, 8)}, ${mix(a.sky, b.sky, 0)})`;
  const bottom = `rgb(${mix(a.ground, b.ground, 16)}, ${mix(a.ground, b.ground, 8)}, ${mix(a.ground, b.ground, 0)})`;
  return `linear-gradient(to bottom, ${top} 0%, ${top} 52%, ${bottom} 100%)`;
}

export const ROUTE_REGION_LABELS = REGIONS.map((r) => r.t);
