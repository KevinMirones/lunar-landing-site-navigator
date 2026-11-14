// 3D Moon lit by the real Sun direction, with the direction to Earth and every
// site marked. Moon-fixed (x, y, z) maps to three.js (x, z, -y).
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DEG, type Vec3 } from '../lib/ephemeris';
import type { Site } from '../lib/sites';
import { useTr } from '../lib/util';

interface Props {
  sunDir: Vec3;
  earthDir: Vec3;
  sites: Site[];
  selectedId: string;
  pinned: string[];
  onSelect: (id: string) => void;
  onPick: (lat: number, lon: number) => void;
}

const toThree = (v: Vec3) => new THREE.Vector3(v[0], v[2], -v[1]).normalize();
const sitePos = (s: { lat: number; lon: number }, r = 1) => {
  const lat = s.lat * DEG;
  const lon = s.lon * DEG;
  return toThree([Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]).multiplyScalar(r);
};

interface Stage {
  render: () => void;
  light: THREE.DirectionalLight;
  earthArm: THREE.Group;
  sunArm: THREE.Group;
  markers: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
}

export function Globe({ sunDir, earthDir, sites, selectedId, pinned, onSelect, onPick }: Props) {
  const tr = useTr();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const earthLabelRef = useRef<HTMLDivElement>(null);
  const sunLabelRef = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const cb = useRef({ onSelect, onPick, sites, selectedId });
  cb.current = { onSelect, onPick, sites, selectedId };

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, -3.8, 3.5);

    const texture = new THREE.TextureLoader().load('/textures/moon_1k.jpg', () => render());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 64),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 }),
    );
    scene.add(moon);
    scene.add(new THREE.AmbientLight(0xbfc8e0, 0.32)); // lifted so the night side stays readable
    const light = new THREE.DirectionalLight(0xfff4e0, 3.2);
    scene.add(light);

    const arm = (color: number, length: number, ball: number) => {
      const g = new THREE.Group();
      const pts = [new THREE.Vector3(0, 0, 1.02), new THREE.Vector3(0, 0, length)];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })));
      const b = new THREE.Mesh(new THREE.SphereGeometry(ball, 24, 16), new THREE.MeshBasicMaterial({ color }));
      b.position.set(0, 0, length);
      g.add(b);
      scene.add(g);
      return g;
    };
    const earthArm = arm(0x5db8ff, 1.38, 0.022);
    const sunArm = arm(0xffc247, 1.38, 0.022);

    const markers = new THREE.Group();
    scene.add(markers);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 9;
    controls.rotateSpeed = 0.6;

    const v = new THREE.Vector3();
    const place = (el: HTMLDivElement | null, world: THREE.Vector3, hideBehind: boolean) => {
      if (!el) return;
      v.copy(world).project(camera);
      let behind = hideBehind && world.clone().normalize().dot(camera.position.clone().normalize()) < 0.15;
      if (!hideBehind) {
        // An arm tip is hidden when the Moon sits between it and the camera.
        const d = world.clone().sub(camera.position);
        const t = -camera.position.dot(d) / d.lengthSq();
        behind = t > 0 && t < 1 && camera.position.clone().addScaledVector(d, t).length() < 1;
      }
      el.style.opacity = behind || v.z > 1 ? '0' : '1';
      el.style.transform = `translate(${((v.x + 1) / 2) * wrap.clientWidth}px, ${((1 - v.y) / 2) * wrap.clientHeight}px)`;
    };
    function render() {
      renderer.render(scene, camera);
      const sel = cb.current.sites.find((s) => s.id === cb.current.selectedId);
      if (sel) place(labelRef.current, sitePos(sel, 1.01), true);
      place(earthLabelRef.current, new THREE.Vector3(0, 0, 1.38).applyQuaternion(earthArm.quaternion), false);
      place(sunLabelRef.current, new THREE.Vector3(0, 0, 1.38).applyQuaternion(sunArm.quaternion), false);
    }
    controls.addEventListener('change', render);

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Click (without drag) selects a marker or picks a new point on the surface.
    const ray = new THREE.Raycaster();
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down || Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 4) return;
      const rect = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
      const hit = ray.intersectObject(moon)[0];
      if (!hit) return;
      const p = hit.point.normalize();
      let best: { id: string; d: number } | null = null;
      for (const s of cb.current.sites) {
        const d = sitePos(s).distanceTo(p);
        if (!best || d < best.d) best = { id: s.id, d };
      }
      if (best && best.d < 0.035) cb.current.onSelect(best.id);
      else cb.current.onPick(Math.asin(p.y) / DEG, Math.atan2(-p.z, p.x) / DEG);
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    stage.current = { render, light, earthArm, sunArm, markers, camera, controls };
    resize();
    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      controls.dispose();
      renderer.dispose();
      stage.current = null;
    };
  }, []);

  // Sun & Earth directions.
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const z = new THREE.Vector3(0, 0, 1);
    st.light.position.copy(toThree(sunDir).multiplyScalar(10));
    st.sunArm.quaternion.setFromUnitVectors(z, toThree(sunDir));
    st.earthArm.quaternion.setFromUnitVectors(z, toThree(earthDir));
    st.render();
  }, [sunDir, earthDir]);

  // Markers.
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    st.markers.clear();
    for (const s of sites) {
      const isSel = s.id === selectedId;
      const isPin = pinned.includes(s.id);
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(isSel ? 0.016 : 0.01, 16, 12),
        new THREE.MeshBasicMaterial({ color: isSel ? 0xffffff : isPin ? 0xece7db : 0x9d998f }),
      );
      m.position.copy(sitePos(s, 1.004));
      st.markers.add(m);
      if (isSel) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.036, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
        ring.position.copy(sitePos(s, 1.006));
        ring.lookAt(sitePos(s, 2));
        st.markers.add(ring);
      }
    }
    st.render();
  }, [sites, selectedId, pinned]);

  // Turn the globe to face the selected site.
  useEffect(() => {
    const st = stage.current;
    const sel = sites.find((s) => s.id === selectedId);
    if (!st || !sel) return;
    const dist = st.camera.position.length();
    // Look from slightly off the site's zenith so the limb stays visible.
    const target = sitePos(sel).add(new THREE.Vector3(0.25, 0.1, 0.25)).normalize().multiplyScalar(dist);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      st.camera.position.copy(target);
      st.controls.update();
      st.render();
      return;
    }
    const from = st.camera.position.clone();
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 600);
      const e = k * k * (3 - 2 * k);
      st.camera.position.copy(from).lerp(target, e).normalize().multiplyScalar(dist);
      st.controls.update();
      st.render();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const sel = sites.find((s) => s.id === selectedId);
  return (
    <div ref={wrapRef} className="globe">
      <canvas ref={canvasRef} />
      <div ref={labelRef} className="globe-label">
        {sel?.name}
      </div>
      <div ref={earthLabelRef} className="globe-label is-earth">
        {tr('hacia la Tierra', 'to Earth')}
      </div>
      <div ref={sunLabelRef} className="globe-label is-sun">
        {tr('hacia el Sol', 'to the Sun')}
      </div>
      <div className="polar-foot">
        <span />
        <span>{tr('Arrastra para girar. Haz clic en la superficie para evaluar ese punto.', 'Drag to rotate. Click the surface to evaluate that point.')}</span>
      </div>
    </div>
  );
}
