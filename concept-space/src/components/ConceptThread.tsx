"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ThreadData } from "@/lib/layoutEngine";

interface ConceptThreadProps {
  thread: ThreadData;
  opacity: number;
  animated?: boolean;
}

export default function ConceptThread({ thread, opacity, animated = true }: ConceptThreadProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  const tubeGeo = useMemo(() => {
    try {
      const points = thread.points.map(p =>
        new THREE.Vector3(p.position.x, p.position.y, p.position.z)
      );

      // CatmullRomCurve3 needs at least 2 distinct points
      if (points.length < 2) return null;

      // Check that points aren't all the same
      const allSame = points.every(p => p.distanceTo(points[0]) < 0.001);
      if (allSame) return null;

      const curve = new THREE.CatmullRomCurve3(points);
      const thickness = 0.02 + thread.weight * 0.04;
      return new THREE.TubeGeometry(curve, 20, thickness, 5, false);
    } catch {
      return null;
    }
  }, [thread]);

  useFrame(({ clock }) => {
    if (meshRef.current && animated) {
      const mat = meshRef.current.material as THREE.MeshPhongMaterial;
      if (mat) {
        const pulse = 0.8 + Math.sin(clock.elapsedTime * 0.5 + timeOffset) * 0.2;
        mat.opacity = opacity * (0.3 + thread.weight * 0.5) * pulse;
        mat.emissiveIntensity = 0.1 + Math.sin(clock.elapsedTime * 0.3 + timeOffset) * 0.1;
      }
    }
  });

  if (!tubeGeo) return null;

  return (
    <mesh ref={meshRef} geometry={tubeGeo}>
      <meshPhongMaterial
        color={thread.color}
        transparent
        opacity={opacity * (0.3 + thread.weight * 0.5)}
        emissive={thread.color}
        emissiveIntensity={0.15}
        shininess={30}
        depthWrite={false}
      />
    </mesh>
  );
}
