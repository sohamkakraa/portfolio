"use client";

import type * as THREE_NS from "three";
import { disposeObject, rampColor, smoothstep, type SceneApi, type SceneHandle } from "@/lib/lab/scene";

/**
 * One Day. The camera never moves — you stand in one place and the light travels.
 * A single scroll scalar drives sky zenith, sky horizon, sun elevation, ridge haze,
 * star opacity and cloud tint, so the whole page stays coherent for free.
 */

/** Sky colour ramps, keyed to the same t values as the HOURS content. */
const ZENITH = [
  { t: 0.0, hex: 0x05060d },
  { t: 0.17, hex: 0x223055 },
  { t: 0.36, hex: 0x5b8ec4 },
  { t: 0.55, hex: 0x7fb0d8 },
  { t: 0.73, hex: 0x5f7fae },
  { t: 0.88, hex: 0x2a2b48 },
  { t: 1.0, hex: 0x05060d },
];

const HORIZON = [
  { t: 0.0, hex: 0x0b0c14 },
  { t: 0.17, hex: 0x8c6b6a },
  { t: 0.36, hex: 0xc3d3dc },
  { t: 0.55, hex: 0xd3e0e6 },
  { t: 0.73, hex: 0xe0a35c },
  { t: 0.88, hex: 0x4a3247 },
  { t: 1.0, hex: 0x0b0c14 },
];

function softSprite(THREE: typeof THREE_NS, inner: string, outer: string, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A ridge silhouette from a sum of sines — cheap, and reads as real terrain at distance. */
function ridgeShape(THREE: typeof THREE_NS, width: number, height: number, seed: number) {
  const shape = new THREE.Shape();
  const steps = 90;
  shape.moveTo(-width / 2, -height);
  for (let i = 0; i <= steps; i += 1) {
    const x = -width / 2 + (width * i) / steps;
    const n = x / width;
    const y =
      height *
      (0.45 +
        0.3 * Math.sin(n * 7.1 + seed) +
        0.16 * Math.sin(n * 17.3 + seed * 2.2) +
        0.08 * Math.sin(n * 31.7 + seed * 3.7));
    shape.lineTo(x, y);
  }
  shape.lineTo(width / 2, -height);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

export function buildDayScene({ THREE, renderer, width, height }: SceneApi): SceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, width / height, 0.5, 1200);
  camera.position.set(0, 6, 24);

  const zenithStops = ZENITH.map((s) => ({ t: s.t, color: new THREE.Color(s.hex) }));
  const horizonStops = HORIZON.map((s) => ({ t: s.t, color: new THREE.Color(s.hex) }));

  const zenith = new THREE.Color(ZENITH[0].hex);
  const horizon = new THREE.Color(HORIZON[0].hex);

  // ── Sky dome ─────────────────────────────────────────────
  const skyUniforms = {
    uZenith: { value: zenith },
    uHorizon: { value: horizon },
    uSunDir: { value: new THREE.Vector3(0, -1, 0) },
    uSunColor: { value: new THREE.Color(0xffcf8a) },
    uSunStrength: { value: 0 },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uSunStrength;
        void main() {
          vec3 d = normalize(vDir);
          float band = smoothstep(-0.08, 0.62, d.y);
          vec3 col = mix(uHorizon, uZenith, band);
          float toSun = max(dot(d, normalize(uSunDir)), 0.0);
          col += uSunColor * pow(toSun, 7.0) * uSunStrength;
          col += uSunColor * pow(toSun, 2.0) * uSunStrength * 0.12;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  scene.add(sky);

  // ── Stars ────────────────────────────────────────────────
  const starCount = 1600;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    // Upper hemisphere only, so none sit under the ridges.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.92 + 0.04);
    const r = 420;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    size: 2.4,
    map: softSprite(THREE, "rgba(255,255,255,1)", "rgba(255,255,255,0)", 64),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ── Sun / moon ───────────────────────────────────────────
  const sunTex = softSprite(THREE, "rgba(255,246,225,1)", "rgba(255,214,150,0)", 128);
  const sunMat = new THREE.SpriteMaterial({
    map: sunTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.95,
  });
  const sun = new THREE.Sprite(sunMat);
  sun.scale.set(70, 70, 1);
  scene.add(sun);

  const moonMat = new THREE.SpriteMaterial({
    map: softSprite(THREE, "rgba(226,236,255,1)", "rgba(160,190,235,0)", 128),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0,
  });
  const moon = new THREE.Sprite(moonMat);
  moon.scale.set(30, 30, 1);
  scene.add(moon);

  // ── Layered ridges ───────────────────────────────────────
  const ridgeSpecs = [
    { z: -180, w: 1100, h: 150, haze: 0.78, seed: 1.3 },
    { z: -120, w: 780, h: 105, haze: 0.55, seed: 4.1 },
    { z: -70, w: 520, h: 68, haze: 0.3, seed: 7.9 },
    { z: -34, w: 300, h: 40, haze: 0.12, seed: 11.4 },
  ];
  const ridgeBase = new THREE.Color(0x151a1c);
  const ridges = ridgeSpecs.map((spec) => {
    const mat = new THREE.MeshBasicMaterial({ color: ridgeBase.clone(), fog: false });
    const mesh = new THREE.Mesh(ridgeShape(THREE, spec.w, spec.h, spec.seed), mat);
    mesh.position.set(0, -spec.h * 0.42, spec.z);
    scene.add(mesh);
    return { mesh, mat, haze: spec.haze };
  });

  // ── Clouds ───────────────────────────────────────────────
  const cloudTex = softSprite(THREE, "rgba(255,255,255,0.95)", "rgba(255,255,255,0)", 128);
  const clouds = Array.from({ length: 9 }, (_, i) => {
    const mat = new THREE.SpriteMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const scaleX = 90 + Math.random() * 130;
    sprite.scale.set(scaleX, scaleX * (0.28 + Math.random() * 0.14), 1);
    sprite.position.set(
      -260 + Math.random() * 520,
      40 + Math.random() * 70,
      -150 - Math.random() * 200
    );
    scene.add(sprite);
    return { sprite, mat, speed: 1.4 + Math.random() * 2.4, phase: i };
  });

  const sunDir = new THREE.Vector3();
  const tmp = new THREE.Color();

  return {
    update({ progress, elapsed }) {
      rampColor(THREE, zenithStops, progress, zenith);
      rampColor(THREE, horizonStops, progress, horizon);

      // Sun rises at 0.17 and sets at 0.88, matching the content hours.
      const arc = (progress - 0.17) / (0.88 - 0.17);
      const angle = arc * Math.PI;
      const elevation = Math.sin(angle);
      const daylight = Math.max(0, elevation);

      sunDir.set(Math.cos(angle), elevation, -0.42).normalize();
      skyUniforms.uSunDir.value.copy(sunDir);
      skyUniforms.uSunStrength.value = daylight * 0.55 + (1 - Math.abs(elevation)) * daylight * 0.9;
      // Low sun reads warm, high sun reads neutral.
      skyUniforms.uSunColor.value
        .set(0xffb066)
        .lerp(tmp.set(0xffffff), THREE.MathUtils.clamp(elevation * 1.4, 0, 0.75));

      sun.position.copy(sunDir).multiplyScalar(330);
      sunMat.opacity = THREE.MathUtils.clamp(elevation * 4 + 0.15, 0, 1);
      const sunSize = THREE.MathUtils.lerp(96, 52, THREE.MathUtils.clamp(elevation, 0, 1));
      sun.scale.set(sunSize, sunSize, 1);

      // Moon uses the opposite side of the same arc.
      moon.position.set(-sunDir.x * 330, -elevation * 320 + 40, -0.42 * 330);
      moonMat.opacity = THREE.MathUtils.clamp(-elevation * 3, 0, 0.9);

      const nightness = Math.max(
        1 - smoothstep(progress, 0.1, 0.24),
        smoothstep(progress, 0.8, 0.96)
      );
      starMat.opacity = nightness * 0.95;
      stars.rotation.y = elapsed * 0.004;

      ridges.forEach(({ mat, haze }) => {
        mat.color.copy(ridgeBase).lerp(horizon, haze * (0.35 + daylight * 0.65));
      });

      clouds.forEach(({ sprite, mat, speed, phase }) => {
        sprite.position.x += speed * 0.02;
        if (sprite.position.x > 300) sprite.position.x = -300;
        sprite.position.y += Math.sin(elapsed * 0.12 + phase) * 0.008;
        mat.opacity = 0.06 + daylight * 0.3;
        mat.color.copy(horizon).lerp(tmp.set(0xffffff), 0.45 + daylight * 0.3);
      });

      // The camera holds still. Only a breath, so it feels inhabited rather than parked.
      camera.position.y = 6 + Math.sin(elapsed * 0.35) * 0.16;
      camera.rotation.x = THREE.MathUtils.lerp(-0.02, 0.05, daylight);
    },

    render() {
      renderer.render(scene, camera);
    },

    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },

    dispose() {
      disposeObject(scene);
      sunTex.dispose();
      cloudTex.dispose();
      starMat.map?.dispose();
      moonMat.map?.dispose();
    },
  };
}

/** Same ramp, for the no-WebGL path. */
export function liteSkyGradient(progress: number): string {
  const pick = (stops: { t: number; hex: number }[]) => {
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i += 1) {
      if (progress >= stops[i].t && progress <= stops[i + 1].t) {
        a = stops[i];
        b = stops[i + 1];
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
    return `rgb(${mix(16)}, ${mix(8)}, ${mix(0)})`;
  };
  return `linear-gradient(to bottom, ${pick(ZENITH)} 0%, ${pick(HORIZON)} 78%, #101215 100%)`;
}
