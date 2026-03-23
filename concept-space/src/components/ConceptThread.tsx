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

  const { geometry, material } = useMemo(() => {
    const points = thread.points.map(p => p.position);
    const curve = new THREE.CatmullRomCurve3(points);

    // Create tube geometry — thicker threads for stronger relationships
    const thickness = 0.02 + thread.weight * 0.04;
    const tubularSegments = 24;
    const radialSegments = 6;
    const geo = new THREE.TubeGeometry(curve, tubularSegments, thickness, radialSegments, false);

    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(thread.color),
      transparent: true,
      opacity: opacity * (0.3 + thread.weight * 0.5),
      emissive: new THREE.Color(thread.color),
      emissiveIntensity: 0.15,
      shininess: 30,
    });

    return { geometry: geo, material: mat };
  }, [thread, opacity]);

  useFrame(({ clock }) => {
    if (meshRef.current && animated) {
      const mat = meshRef.current.material as THREE.MeshPhongMaterial;
      const pulse = 0.8 + Math.sin(clock.elapsedTime * 0.5 + timeOffset) * 0.2;
      mat.opacity = opacity * (0.3 + thread.weight * 0.5) * pulse;
      mat.emissiveIntensity = 0.1 + Math.sin(clock.elapsedTime * 0.3 + timeOffset) * 0.1;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}
