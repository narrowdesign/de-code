"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import { LayoutNode } from "@/lib/layoutEngine";

interface ConceptClusterProps {
  node: LayoutNode;
  onFocus: (id: string, position: THREE.Vector3) => void;
  isActive: boolean;
  cameraDistance: number;
}

export default function ConceptCluster({
  node,
  onFocus,
  isActive,
  cameraDistance,
}: ConceptClusterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onFocus(node.id, node.position);
  }, [node.id, node.position, onFocus]);

  const baseSize = node.size * 0.3;
  const displaySize = baseSize * (hovered ? 1.3 : 1.0);

  // Label visibility based on distance
  const showLabel = cameraDistance < 30;
  const labelScale = Math.min(1, Math.max(0.3, (30 - cameraDistance) / 15));

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = node.position.y + Math.sin(t * 0.3 + timeOffset) * 0.05;
    }
    if (glowRef.current) {
      const t = clock.elapsedTime;
      const scale = 1 + Math.sin(t * 0.5 + timeOffset) * 0.15;
      glowRef.current.scale.setScalar(scale * (isActive ? 1.5 : 1));
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (isActive ? 0.3 : 0.15) + Math.sin(t * 0.7 + timeOffset) * 0.05;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[node.position.x, node.position.y, node.position.z]}
    >
      {/* Core sphere */}
      <Sphere
        args={[displaySize, 16, 16]}
        onClick={handleClick}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <meshPhongMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          transparent
          opacity={0.8}
          shininess={60}
        />
      </Sphere>

      {/* Glow */}
      <Sphere ref={glowRef} args={[displaySize * 2, 12, 12]}>
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Sub-threads hint on hover */}
      {hovered && Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const len = displaySize * 2;
        return (
          <mesh key={i} rotation={[0, 0, angle]}>
            <cylinderGeometry args={[0.005, 0.005, len, 4]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.3} />
          </mesh>
        );
      })}

      {/* Label as HTML-style sprite using a simple plane with canvas texture would be complex.
          Instead use a simple Billboard text approach */}
      {showLabel && (
        <sprite
          position={[0, displaySize + 0.4, 0]}
          scale={[node.id.length * 0.18 * labelScale, 0.3 * labelScale, 1]}
        >
          <spriteMaterial
            transparent
            opacity={labelScale}
            depthWrite={false}
          >
          </spriteMaterial>
        </sprite>
      )}
    </group>
  );
}
