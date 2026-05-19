import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { Viewer3DConfig } from "@/app/layouts/types";
import { CameraController } from "../modules/CameraController";
import { SceneBuilder } from "../modules/SceneBuilder";

export function useThreeScene(
  containerRef: RefObject<HTMLDivElement>,
  config: Viewer3DConfig,
) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const initialConfigRef = useRef(config);
  const animationConfigRef = useRef({
    autoRotate: config.autoRotate ?? false,
    autoRotateSpeed: config.controls?.autoRotateSpeed ?? 0.7,
  });

  useEffect(() => {
    animationConfigRef.current = {
      autoRotate: config.autoRotate ?? false,
      autoRotateSpeed: config.controls?.autoRotateSpeed ?? 0.7,
    };
  }, [config.autoRotate, config.controls?.autoRotateSpeed]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const initialConfig = initialConfigRef.current;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const scene = SceneBuilder.createScene();
    const camera = SceneBuilder.createCamera(
      width,
      height,
      initialConfig.camera.fov,
    );
    const renderer = SceneBuilder.createRenderer(container);
    const controls = new OrbitControls(camera, renderer.domElement);
    let animationFrameId = 0;

    renderer.domElement.className = "h-full w-full";
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = false;
    controlsRef.current = controls;
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    SceneBuilder.applyBackground(scene, initialConfig.background);
    CameraController.applyConfig(camera, controls, initialConfig.camera);

    const resizeObserver = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      const nextWidth = Math.max(box.width, 1);
      const nextHeight = Math.max(box.height, 1);

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
    });

    resizeObserver.observe(container);

    const animate = () => {
      const animationConfig = animationConfigRef.current;

      controls.autoRotate = animationConfig.autoRotate;
      controls.autoRotateSpeed = animationConfig.autoRotateSpeed;
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      scene.clear();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
    };
  }, [containerRef]);

  return { cameraRef, controlsRef, rendererRef, sceneRef };
}
