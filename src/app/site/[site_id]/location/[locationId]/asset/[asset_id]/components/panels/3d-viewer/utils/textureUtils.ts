import * as THREE from 'three';

export async function loadTexture(url: string): Promise<THREE.Texture | null> {
  const textureLoader = new THREE.TextureLoader();
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (texture) => resolve(configureTexture(texture)),
      undefined,
      () => {
        console.warn(`Failed to load texture: ${url}`);
        resolve(null);
      }
    );
  });
}

export async function loadTextureFromFile(file: File): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const texture = await loadTexture(dataUrl);
        resolve(texture);
      } catch (error) {
        console.error('Failed to load texture from file:', error);
        resolve(null);
      }
    };
    reader.onerror = () => {
      console.error('Failed to read file');
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

export async function loadTextureSource(
  source: string | File,
): Promise<THREE.Texture | null> {
  return typeof source === 'string'
    ? loadTexture(source)
    : loadTextureFromFile(source);
}

export function applyTextureToMaterial(
  material: THREE.MeshStandardMaterial | THREE.MeshPhongMaterial,
  texture: THREE.Texture | null,
): void {
  if (texture) {
    material.map = texture;
    material.needsUpdate = true;
  }
}

export function configureTexture(texture: THREE.Texture): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function disposeMaterialTextures(material: THREE.Material): void {
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhongMaterial
  ) {
    material.map?.dispose();
    material.emissiveMap?.dispose();
    material.alphaMap?.dispose();
  }

  if (material instanceof THREE.MeshStandardMaterial) {
    material.roughnessMap?.dispose();
  }
}
