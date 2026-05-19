import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

import type { Model3DFile, Model3DTextureFile } from "@/app/layouts/types";
import { prepareModelGeometry } from "../utils/geometryUtils";
import { normalizeModelTextures } from "../utils/modelFileUtils";
import { loadTextureSource } from "../utils/textureUtils";

export class ModelLoader {
  private plyLoader: PLYLoader;

  constructor() {
    this.plyLoader = new PLYLoader();
  }

  async loadModel(modelFile: Model3DFile): Promise<THREE.Group> {
    const geometry = prepareModelGeometry(
      await this.loadPLY(modelFile.plyUrl),
      modelFile.normalizeSize,
    );
    const material = await this.createMaterial(normalizeModelTextures(modelFile));
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();

    mesh.name = "ply-mesh";
    group.name = "asset-ply-model";
    group.userData.modelFile = modelFile;
    group.add(mesh);

    return group;
  }

  private async createMaterial(
    textures: Model3DTextureFile[],
  ): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      metalness: 0.1,
      roughness: 0.72,
      side: THREE.DoubleSide,
    });

    await Promise.all(
      textures
        .filter((textureConfig) => textureConfig.enabled !== false)
        .map(async (textureConfig) => {
          const texture = await loadTextureSource(textureConfig.source);

          if (!texture) {
            return;
          }

          this.applyTexture(material, textureConfig, texture);
        }),
    );

    material.needsUpdate = true;
    return material;
  }

  private applyTexture(
    material: THREE.MeshStandardMaterial,
    textureConfig: Model3DTextureFile,
    texture: THREE.Texture,
  ): void {
    if (textureConfig.role === "emissive") {
      material.emissive.set("#ffffff");
      material.emissiveIntensity = textureConfig.strength ?? 0.35;
      material.emissiveMap = texture;
      return;
    }

    if (textureConfig.role === "alpha") {
      material.alphaMap = texture;
      material.transparent = true;
      return;
    }

    if (textureConfig.role === "roughness") {
      material.roughnessMap = texture;
      return;
    }

    material.map = texture;
  }

  private loadPLY(plySource: string | File): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      if (typeof plySource === "string") {
        this.plyLoader.load(
          plySource,
          (geometry) => resolve(geometry),
          undefined,
          () => reject(new Error(`Failed to load PLY: ${plySource}`)),
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          resolve(this.plyLoader.parse(arrayBuffer));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read PLY file"));
      reader.readAsArrayBuffer(plySource);
    });
  }
}
