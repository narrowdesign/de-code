"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Text, Sphere } from "@react-three/drei";
import { LayoutNode } from "@/lib/layoutEngine";

interface ConceptClusterProps {
  node: LayoutNode;
  onFocus: (id: string, position: THREE.Vector3) => void;
  zoomLevel: number;
  isActive: boolean;
  cameraDistance: number;
}

export default function ConceptCluster({
  node,
  onFocus,
  zoomLevel: _zoomLevel,
  isActive,
  cameraDistance,
}: ConceptClusterProps) {
  void _zoomLevel;
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onFocus(node.id, node.position);
  }, [node.id, node.position, onFocus]);

  // Node visual size based on importance and zoom
  const baseSize = node.size * 0.3;
  const displaySize = baseSize * (hovered ? 1.3 : 1.0);

  // Label visibility based on distance
  const showLabel = cameraDistance < 30;
  const labelOpacity = Math.min(1, Math.max(0, (30 - cameraDistance) / 15));

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle floating animation
      const t = clock.elapsedTime;
      groupRef.current.position.y = node.position.y + Math.sin(t * 0.3 + timeOffset) * 0.05;
    }
    if (glowRef.current) {
      const t = clock.elapsedTime;
      const scale = 1 + Math.sin(t * 0.5 + timeOffset) * 0.15;
      glowRef.current.scale.setScalar(scale * (isActive ? 1.5 : 1));
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (isActive ? 0.3 : 0.15) + Math.sin(t * 0.7 + timeOffset) * 0.05;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[node.position.x, node.position.y, node.position.z]}
    >
      {/* Core sphere — the "knot" where threads converge */}
      <Sphere
        args={[displaySize, 16, 16]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
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

      {/* Glow effect */}
      <Sphere ref={glowRef} args={[displaySize * 2, 12, 12]}>
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Sub-threads radiating from the knot — visual hint of internal structure */}
      {hovered && Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const len = displaySize * 2;
        return (
          <mesh key={i} rotation={[0, 0, angle]}>
            <cylinderGeometry args={[0.005, 0.005, len, 4]} />
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      })}

      {/* Label */}
      {showLabel && (
        <Text
          position={[0, displaySize + 0.3, 0]}
          fontSize={Math.min(0.35, 0.15 + node.size * 0.15)}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="black"
          fillOpacity={labelOpacity}
          renderOrder={1}
        >
          {node.id}
        </Text>
      )}
    </group>
  );
}
