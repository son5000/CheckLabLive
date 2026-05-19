import * as THREE from "three";
import { disposeMaterialTextures } from "./textureUtils";

export function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(child.material);
      }
    }
  });
}

export function disposeMaterial(material: THREE.Material): void {
  disposeMaterialTextures(material);
  material.dispose();
}
