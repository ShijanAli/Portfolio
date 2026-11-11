import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

const PARTICLES = 5200;

// Each point drifts along a slow wave, so the sphere seems to breathe.
const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vDepth;

  void main() {
    vec3 p = position;
    float wave = sin(p.y * 2.4 + uTime * 0.7 + aSeed * 6.2831) * 0.09
               + cos(p.x * 1.8 + uTime * 0.5) * 0.07;
    p += normalize(p) * wave;

    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vDepth = smoothstep(-4.2, -1.6, view.z);
    gl_PointSize = (2.2 + aSeed * 2.6) * uPixelRatio * (1.0 / -view.z) * 2.4;
    gl_Position = projectionMatrix * view;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vDepth;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.05, dist) * mix(0.18, 0.95, vDepth);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), vDepth * 0.35), alpha);
  }
`;

/** Points spread evenly over a sphere (Fibonacci lattice). */
function createGeometry(): BufferGeometry {
  const positions = new Float32Array(PARTICLES * 3);
  const seeds = new Float32Array(PARTICLES);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < PARTICLES; index += 1) {
    const y = 1 - (index / (PARTICLES - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * index;
    positions.set(
      [Math.cos(theta) * radius * 1.25, y * 1.25, Math.sin(theta) * radius * 1.25],
      index * 3,
    );
    seeds[index] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  return geometry;
}

/**
 * The hero's 3D backdrop: a slowly turning sphere of glowing particles that leans toward
 * the pointer. Returns a function that stops the animation and frees every GPU resource.
 */
export function startHeroScene(canvas: HTMLCanvasElement, accentColor: string): () => void {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 20);
  camera.position.z = 3.4;

  const geometry = createGeometry();
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uColor: { value: new Color(accentColor) },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  scene.add(points);

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const pointer = { x: 0, y: 0 };
  const onPointerMove = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Nothing is drawn while the hero is scrolled out of view or the tab is hidden.
  let visible = true;
  const visibility = new IntersectionObserver(
    ([entry]) => (visible = entry?.isIntersecting ?? true),
  );
  visibility.observe(canvas);

  let frame = 0;
  const startedAt = performance.now();
  const render = () => {
    frame = requestAnimationFrame(render);
    if (!visible || document.hidden) return;

    const time = (performance.now() - startedAt) / 1000;
    material.uniforms.uTime!.value = time;
    points.rotation.y = time * 0.08 + pointer.x * 0.25;
    points.rotation.x += (pointer.y * 0.2 - points.rotation.x) * 0.04;
    renderer.render(scene, camera);
  };
  render();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', onPointerMove);
    resizeObserver.disconnect();
    visibility.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
