import type { SymmetryElement } from '@/types';
import * as THREE from 'three';

/**
 * Build a 4x4 transformation matrix for a given symmetry operation.
 * Used to animate molecules under symmetry operations in 3D.
 */
export function getTransformMatrix(
  element: SymmetryElement,
  t: number // interpolation parameter 0→1
): THREE.Matrix4 {
  const mat = new THREE.Matrix4();

  switch (element.type) {
    case 'axis': {
      // Proper rotation: rotate by (360°/order) around the axis direction
      const angle = ((2 * Math.PI) / (element.order ?? 2)) * t;
      const dir = new THREE.Vector3(...(element.direction ?? [0, 1, 0])).normalize();
      mat.makeRotationAxis(dir, angle);
      break;
    }

    case 'plane': {
      // Reflection through a plane defined by its normal vector.
      // Reflection matrix: I - 2 * n * nᵀ
      // Interpolate from identity (t=0) to full reflection (t=1)
      const n = new THREE.Vector3(...(element.normal ?? [0, 0, 1])).normalize();
      const reflection = new THREE.Matrix4().set(
        1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, 0,
        -2 * n.y * n.x, 1 - 2 * n.y * n.y, -2 * n.y * n.z, 0,
        -2 * n.z * n.x, -2 * n.z * n.y, 1 - 2 * n.z * n.z, 0,
        0, 0, 0, 1
      );

      // Interpolate: M(t) = (1-t)*I + t*R
      const identity = new THREE.Matrix4();
      mat.copy(identity);
      const elements = mat.elements;
      const reflElements = reflection.elements;
      for (let i = 0; i < 16; i++) {
        elements[i] = (1 - t) * elements[i] + t * reflElements[i];
      }
      break;
    }

    case 'center': {
      // Inversion through the origin: (x,y,z) → (-x,-y,-z)
      // Interpolate from identity to inversion
      const scale = 1 - 2 * t; // goes from 1 to -1
      mat.makeScale(scale, scale, scale);
      break;
    }

    case 'improper': {
      // Improper rotation Sn = σh × Cn
      // Rotation by (360°/order) followed by reflection through perpendicular plane
      const angle = ((2 * Math.PI) / (element.order ?? 2)) * t;
      const dir = new THREE.Vector3(...(element.direction ?? [0, 1, 0])).normalize();

      // Rotation part
      const rotation = new THREE.Matrix4().makeRotationAxis(dir, angle);

      // Reflection through plane perpendicular to axis (normal = dir)
      const n = dir;
      const reflection = new THREE.Matrix4().set(
        1 - 2 * t * n.x * n.x, -2 * t * n.x * n.y, -2 * t * n.x * n.z, 0,
        -2 * t * n.y * n.x, 1 - 2 * t * n.y * n.y, -2 * t * n.y * n.z, 0,
        -2 * t * n.z * n.x, -2 * t * n.z * n.y, 1 - 2 * t * n.z * n.z, 0,
        0, 0, 0, 1
      );

      mat.multiplyMatrices(reflection, rotation);
      break;
    }
  }

  return mat;
}

/**
 * Apply a symmetry transformation to a set of 3D positions.
 */
export function transformPositions(
  positions: [number, number, number][],
  element: SymmetryElement,
  t: number
): [number, number, number][] {
  const matrix = getTransformMatrix(element, t);
  const vec = new THREE.Vector3();

  return positions.map(([x, y, z]) => {
    vec.set(x, y, z).applyMatrix4(matrix);
    return [vec.x, vec.y, vec.z];
  });
}
