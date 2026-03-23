"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { conceptGraph } from "@/lib/conceptGraph";
import { generateLayout, LayoutResult } from "@/lib/layoutEngine";
import ConceptCluster from "./ConceptCluster";
import ConceptThread from "./ConceptThread";

// The navigation stack — each level represents a zoom into a concept
interface ZoomLevel {
  conceptId: string | null; // null = top level
  layout: LayoutResult;
  conceptIds: string[];
}

function CameraController({
  target,
  onDistanceChange,
}: {
  target: THREE.Vector3;
  onDistanceChange: (d: number) => void;
}) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const targetRef = useRef(target.clone());

  useEffect(() => {
    targetRef.current.copy(target);
  }, [target]);

  useFrame(() => {
    // Smooth camera target interpolation
    currentTarget.current.lerp(targetRef.current, 0.03);

    // Report camera distance
    const dist = camera.position.distanceTo(currentTarget.current);
    onDistanceChange(dist);
  });

  return null;
}

function SceneContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const [cameraDistance, setCameraDistance] = useState(25);
  const [cameraTarget, setCameraTarget] = useState(new THREE.Vector3(0, 0, 0));

  // Navigation state
  const [zoomStack, setZoomStack] = useState<ZoomLevel[]>(() => {
    const topConcepts = conceptGraph.getTopConcepts(12);
    const layout = generateLayout(topConcepts, new THREE.Vector3(0, 0, 0), 10);
    return [{ conceptId: null, layout, conceptIds: topConcepts }];
  });

  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Handle clicking on a concept to zoom in
  const handleFocus = useCallback((conceptId: string, position: THREE.Vector3) => {
    if (transitioning) return;

    // If clicking the same concept that's already active, zoom into it
    if (activeConcept === conceptId) {
      setTransitioning(true);

      // Get the concept's related concepts for the next zoom level
      const node = conceptGraph.getOrGenerate(conceptId);
      const subConcepts = node.links
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 14)
        .map(l => l.target);

      // Include the concept itself in its own sub-space
      if (!subConcepts.includes(conceptId)) {
        subConcepts.push(conceptId);
      }

      const subLayout = generateLayout(subConcepts, position, 8, conceptId);

      setZoomStack(prev => [...prev, {
        conceptId,
        layout: subLayout,
        conceptIds: subConcepts,
      }]);

      setCameraTarget(position);
      setActiveConcept(null);

      // Animate camera closer
      if (controlsRef.current) {
        const controls = controlsRef.current;
        const targetDist = 12;
        const startDist = cameraDistance;
        const startTime = Date.now();
        const duration = 1200;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - t, 3); // ease out cubic
          const dist = startDist + (targetDist - startDist) * eased;

          const direction = new THREE.Vector3()
            .subVectors(controls.object.position, controls.target)
            .normalize();
          controls.object.position.copy(
            new THREE.Vector3().copy(position).add(direction.multiplyScalar(dist))
          );
          controls.target.copy(position);
          controls.update();

          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            setTransitioning(false);
          }
        };
        requestAnimationFrame(animate);
      }
    } else {
      setActiveConcept(conceptId);
    }
  }, [activeConcept, transitioning, cameraDistance]);

  // Handle going back up
  const handleBack = useCallback(() => {
    if (zoomStack.length <= 1 || transitioning) return;
    setTransitioning(true);

    setZoomStack(prev => {
      const next = prev.slice(0, -1);
      const newLevel = next[next.length - 1];
      setCameraTarget(newLevel.layout.center);
      return next;
    });
    setActiveConcept(null);

    setTimeout(() => setTransitioning(false), 800);
  }, [zoomStack.length, transitioning]);

  // Build the breadcrumb trail
  const breadcrumbs = zoomStack.map((level, i) =>
    i === 0 ? "Overview" : level.conceptId || ""
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[20, 20, 20]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-15, -10, 15]} intensity={0.4} color="#4488ff" />
      <pointLight position={[0, -20, -10]} intensity={0.3} color="#ff4488" />

      {/* Background stars */}
      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0.5} />

      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={100}
        target={cameraTarget}
        makeDefault
      />
      <CameraController target={cameraTarget} onDistanceChange={setCameraDistance} />

      {/* Render all zoom levels with fading */}
      {zoomStack.map((level, levelIndex) => {
        const isCurrentLevel = levelIndex === zoomStack.length - 1;
        const isPreviousLevel = levelIndex === zoomStack.length - 2;
        const opacity = isCurrentLevel ? 1 : isPreviousLevel ? 0.15 : 0;

        if (opacity === 0) return null;

        return (
          <group key={`level-${levelIndex}-${level.conceptId}`}>
            {/* Threads */}
            {level.layout.threads.map(thread => (
              <ConceptThread
                key={thread.id}
                thread={thread}
                opacity={opacity}
              />
            ))}

            {/* Concept clusters */}
            {level.layout.nodes.map(node => (
              <ConceptCluster
                key={node.id}
                node={node}
                onFocus={isCurrentLevel ? handleFocus : () => {}}
                zoomLevel={levelIndex}
                isActive={activeConcept === node.id && isCurrentLevel}
                cameraDistance={cameraDistance}
              />
            ))}
          </group>
        );
      })}

      {/* Depth hint: faint grid at the "floor" */}
      <gridHelper
        args={[100, 50, "#111133", "#111133"]}
        position={[0, -15, 0]}
      />

      {/* HUD: breadcrumbs (rendered in 3D space, facing camera) */}
      <BreadcrumbHUD
        breadcrumbs={breadcrumbs}
        onBack={handleBack}
        canGoBack={zoomStack.length > 1}
      />
    </>
  );
}

function BreadcrumbHUD({
  breadcrumbs,
  onBack,
  canGoBack,
}: {
  breadcrumbs: string[];
  onBack: () => void;
  canGoBack: boolean;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      // Position HUD relative to camera
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

      groupRef.current.position.copy(camera.position)
        .add(forward.multiplyScalar(5))
        .add(up.multiplyScalar(2.2))
        .add(right.multiplyScalar(-2));
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const trail = breadcrumbs.join(" → ");

  return (
    <group ref={groupRef}>
      <Text
        fontSize={0.12}
        color="#aaaacc"
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.7}
      >
        {trail}
      </Text>
      {canGoBack && (
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.1}
          color="#6688ff"
          anchorX="left"
          anchorY="middle"
          fillOpacity={0.6}
          onClick={onBack}
          onPointerOver={(e) => {
            (e.object as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: "#88aaff" });
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          ← Back
        </Text>
      )}
    </group>
  );
}

export default function ConceptSpace() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000008" }}>
      <Canvas
        camera={{ position: [0, 5, 25], fov: 60, near: 0.01, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000008" }}
      >
        <fog attach="fog" args={["#000008", 30, 100]} />
        <SceneContent />
      </Canvas>

      {/* 2D UI Overlay */}
      <div style={{
        position: "absolute",
        bottom: 24,
        left: 0,
        right: 0,
        textAlign: "center",
        pointerEvents: "none",
        color: "#667",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
        letterSpacing: "0.05em",
      }}>
        <span style={{ opacity: 0.6 }}>
          Click a concept to select · Double-click to zoom in · Scroll to zoom · Drag to orbit
        </span>
      </div>

      {/* Title */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 24,
        color: "#445",
        fontSize: 11,
        fontFamily: "system-ui, sans-serif",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        opacity: 0.5,
      }}>
        Concept Space
      </div>
    </div>
  );
}
