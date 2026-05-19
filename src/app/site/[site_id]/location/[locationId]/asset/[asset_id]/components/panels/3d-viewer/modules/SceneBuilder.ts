import * as THREE from "three";

import type { Background3DConfig } from "@/app/layouts/types";
import { createAxesHelper, createGridHelper } from "../utils/geometryUtils";

const GRID_NAME = "viewer-grid-helper";
const AXES_NAME = "viewer-axes-helper";
const GROUND_NAME = "viewer-ground-plane";

export class SceneBuilder {
  static createScene(): THREE.Scene {
    return new THREE.Scene();
  }

  static createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);

    return renderer;
  }

  static createCamera(
    width: number,
    height: number,
    fov: number = 45,
  ): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(fov, width / height, 0.1, 5000);
  }

  static applyBackground(scene: THREE.Scene, config: Background3DConfig): void {
    scene.background = new THREE.Color(config.color);
    scene.fog = config.fog?.enabled
      ? new THREE.Fog(config.fog.color, config.fog.near, config.fog.far)
      : null;

    this.replaceHelper(scene, GRID_NAME);
    this.replaceHelper(scene, AXES_NAME);
    this.replaceHelper(scene, GROUND_NAME);

    if (config.showGrid) {
      const grid = createGridHelper(
        config.gridSize,
        config.gridDivisions ?? Math.max(2, Math.round(config.gridSize / 10)),
        config.gridColor,
      );

      grid.name = GRID_NAME;
      scene.add(grid);
    }

    if (config.showAxes) {
      const axes = createAxesHelper(Math.max(config.gridSize * 0.34, 24));
      axes.name = AXES_NAME;
      scene.add(axes);
    }

    if (config.showGround) {
      const ground = this.createGroundPlane(config);
      scene.add(ground);
    }
  }

  private static createGroundPlane(
    config: Background3DConfig,
  ): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> {
    const size = Math.max(config.gridSize, 80) * 1.35;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({
        color: config.groundColor ?? "#0f172a",
        metalness: 0,
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    );

    ground.name = GROUND_NAME;
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    return ground;
  }

  private static replaceHelper(scene: THREE.Scene, name: string): void {
    const existing = scene.getObjectByName(name);

    if (!existing) {
      return;
    }

    scene.remove(existing);

    if (existing instanceof THREE.Mesh) {
      existing.geometry.dispose();
      existing.material.dispose();
    }
  }
}
