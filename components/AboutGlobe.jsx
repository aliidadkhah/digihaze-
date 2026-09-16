"use client";

import { useEffect, useRef, useState } from "react";

/**
 * سه‌بعدی: کره‌ی دیجیتال (Globe_Digital.glb) رو با three.js لود می‌کنه،
 * می‌چرخونه (اتوروتیت) و اجازه می‌ده کاربر با موس/لمس هم بچرخوندش.
 * فقط سمت کاربر (client) اجرا می‌شه، چون three.js به window/canvas نیاز داره.
 */
export default function AboutGlobe({
  src = "/models/Globe_Digital.glb",
  height = 380,
}) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let renderer, scene, camera, controls, model, frameId;
    let disposed = false;
    const container = mountRef.current;
    if (!container) return;

    async function init() {
      const THREE = await import("three");
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js"
      );
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );

      if (disposed || !container) return;

      const width = container.clientWidth;
      const heightPx = container.clientHeight;

      scene = new THREE.Scene();
      scene.background = null;

      camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
      camera.position.set(0, 0, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, heightPx);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // نور
      const ambient = new THREE.AmbientLight(0xffffff, 1.1);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0x9b5cff, 2.2);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x1fd1ff, 1.4);
      rim.position.set(-4, -2, -3);
      scene.add(rim);

      // کنترل چرخش با موس/لمس
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.6;

      const loader = new GLTFLoader();
      loader.load(
        src,
        (gltf) => {
          if (disposed) return;
          model = gltf.scene;

          // وسط‌چین و هم‌اندازه کردن مدل داخل صحنه
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);
          model.position.sub(center);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 3.2 / maxDim;
          model.scale.setScalar(scale);

          scene.add(model);
          setLoading(false);
        },
        undefined,
        (err) => {
          console.error("خطا در لود مدل سه‌بعدی:", err);
          if (!disposed) {
            setFailed(true);
            setLoading(false);
          }
        }
      );

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      cleanupResize = () => window.removeEventListener("resize", handleResize);
    }

    let cleanupResize = () => {};
    init();

    return () => {
      disposed = true;
      cleanupResize();
      if (frameId) cancelAnimationFrame(frameId);
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      if (scene) {
        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => {
              Object.values(m).forEach((v) => {
                if (v && v.isTexture) v.dispose();
              });
              m.dispose();
            });
          }
        });
      }
    };
  }, [src]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 20,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 40%, rgba(155,92,255,0.18), transparent 65%)",
        touchAction: "none",
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {loading && !failed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-mut)",
            fontSize: 13,
          }}
        >
          در حال بارگذاری مدل سه‌بعدی...
        </div>
      )}

      {failed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-mut)",
            fontSize: 13,
            textAlign: "center",
            padding: 20,
          }}
        >
          مدل سه‌بعدی لود نشد.
        </div>
      )}
    </div>
  );
}
