"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { conceptGraph } from "@/lib/conceptGraph";
import { generateLayout, LayoutResult } from "@/lib/layoutEngine";
import ConceptThread from "./ConceptThread";
import ConceptCluster from "./ConceptCluster";

interface ZoomLevel {
  conceptId: string | null;
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
    currentTarget.current.lerp(targetRef.current, 0.03);
    const dist = camera.position.distanceTo(currentTarget.current);
    onDistanceChange(dist);
  });

  return null;
}

// Labels rendered as HTML overlays — much more reliable than 3D Text
function ConceptLabel({
  position,
  label,
  isActive,
  cameraDistance,
  onClick,
}: {
  position: THREE.Vector3;
  label: string;
  isActive: boolean;
  cameraDistance: number;
  onClick: () => void;
}) {
  if (cameraDistance > 35) return null;
  const opacity = Math.min(1, Math.max(0, (35 - cameraDistance) / 15));

  return (
    <Html
      position={[position.x, position.y + 0.5, position.z]}
      center
      style={{ pointerEvents: "none" }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          color: isActive ? "#fff" : "#ccd",
          fontSize: isActive ? 13 : 11,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: isActive ? 600 : 400,
          whiteSpace: "nowrap",
          textShadow: "0 0 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)",
          opacity,
          pointerEvents: "auto",
          cursor: "pointer",
          userSelect: "none",
          transform: "translateY(-12px)",
          transition: "all 0.2s ease",
        }}
      >
        {label}
      </div>
    </Html>
  );
}

function SceneContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const [cameraDistance, setCameraDistance] = useState(25);
  const [cameraTarget, setCameraTarget] = useState(() => new THREE.Vector3(0, 0, 0));

  const [zoomStack, setZoomStack] = useState<ZoomLevel[]>(() => {
    const topConcepts = conceptGraph.getTopConcepts(12);
    const layout = generateLayout(topConcepts, new THREE.Vector3(0, 0, 0), 10);
    return [{ conceptId: null, layout, conceptIds: topConcepts }];
  });

  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleFocus = useCallback((conceptId: string, position: THREE.Vector3) => {
    if (transitioning) return;

    if (activeConcept === conceptId) {
      setTransitioning(true);

      const node = conceptGraph.getOrGenerate(conceptId);
      const subConcepts = node.links
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 14)
        .map(l => l.target);

      if (!subConcepts.includes(conceptId)) {
        subConcepts.push(conceptId);
      }

      const subLayout = generateLayout(subConcepts, position, 8, conceptId);

      setZoomStack(prev => [...prev, {
        conceptId,
        layout: subLayout,
        conceptIds: subConcepts,
      }]);

      setCameraTarget(position.clone());
      setActiveConcept(null);

      if (controlsRef.current) {
        const controls = controlsRef.current;
        const targetDist = 12;
        const startDist = cameraDistance;
        const startTime = Date.now();
        const duration = 1200;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - t, 3);
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
      } else {
        setTimeout(() => setTransitioning(false), 1200);
      }
    } else {
      setActiveConcept(conceptId);
    }
  }, [activeConcept, transitioning, cameraDistance]);

  const handleBack = useCallback(() => {
    if (zoomStack.length <= 1 || transitioning) return;
    setTransitioning(true);

    setZoomStack(prev => {
      const next = prev.slice(0, -1);
      const newLevel = next[next.length - 1];
      setCameraTarget(newLevel.layout.center.clone());
      return next;
    });
    setActiveConcept(null);

    setTimeout(() => setTransitioning(false), 800);
  }, [zoomStack.length, transitioning]);

  const breadcrumbs = zoomStack.map((level, i) =>
    i === 0 ? "Overview" : level.conceptId || ""
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[20, 20, 20]} intensity={0.8} />
      <pointLight position={[-15, -10, 15]} intensity={0.4} color="#4488ff" />
      <pointLight position={[0, -20, -10]} intensity={0.3} color="#ff4488" />

      <Stars radius={100} depth={50} count={2000} factor={4} fade speed={0.5} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={80}
        target={cameraTarget}
        makeDefault
      />
      <CameraController target={cameraTarget} onDistanceChange={setCameraDistance} />

      {zoomStack.map((level, levelIndex) => {
        const isCurrentLevel = levelIndex === zoomStack.length - 1;
        const isPreviousLevel = levelIndex === zoomStack.length - 2;
        const opacity = isCurrentLevel ? 1 : isPreviousLevel ? 0.15 : 0;

        if (opacity === 0) return null;

        return (
          <group key={`level-${levelIndex}-${level.conceptId}`}>
            {level.layout.threads.map(thread => (
              <ConceptThread
                key={thread.id}
                thread={thread}
                opacity={opacity}
              />
            ))}

            {level.layout.nodes.map(node => (
              <group key={node.id}>
                <ConceptCluster
                  node={node}
                  onFocus={isCurrentLevel ? handleFocus : () => {}}
                  isActive={activeConcept === node.id && isCurrentLevel}
                  cameraDistance={cameraDistance}
                />
                {isCurrentLevel && (
                  <ConceptLabel
                    position={node.position}
                    label={node.id}
                    isActive={activeConcept === node.id}
                    cameraDistance={cameraDistance}
                    onClick={() => {
                      if (!transitioning) {
                        handleFocus(node.id, node.position);
                      }
                    }}
                  />
                )}
              </group>
            ))}
          </group>
        );
      })}

      <gridHelper
        args={[100, 50, "#111133", "#111133"]}
        position={[0, -15, 0]}
      />

      {/* Breadcrumb HUD as HTML */}
      <Html
        position={[0, 0, 0]}
        fullscreen
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          position: "fixed",
          top: 16,
          left: 20,
          pointerEvents: "auto",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            color: "#667",
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 8,
            opacity: 0.5,
          }}>
            Concept Space
          </div>
          <div style={{
            color: "#aab",
            fontSize: 12,
            marginBottom: 6,
          }}>
            {breadcrumbs.join(" → ")}
          </div>
          {zoomStack.length > 1 && (
            <button
              onClick={handleBack}
              style={{
                background: "rgba(40, 40, 80, 0.6)",
                border: "1px solid rgba(100, 100, 200, 0.3)",
                color: "#88aaff",
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Back
            </button>
          )}
        </div>

        <div style={{
          position: "fixed",
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#556",
          fontSize: 12,
          fontFamily: "system-ui, -apple-system, sans-serif",
          opacity: 0.5,
        }}>
          Tap to select · Tap again to zoom in · Pinch to zoom · Drag to orbit
        </div>
      </Html>
    </>
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
        <fog attach="fog" args={["#000008", 30, 80]} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
