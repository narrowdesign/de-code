// Force-directed layout engine for positioning concept clusters in 3D space.
// Each concept becomes a point, and threads connect related concepts.
// When you zoom into a concept, its sub-concepts expand into their own layout.

import { conceptGraph, hslToHex } from "./conceptGraph";
import * as THREE from "three";

export interface LayoutNode {
  id: string;
  position: THREE.Vector3;
  color: string;
  size: number; // visual importance
  links: { targetId: string; weight: number }[];
}

export interface ThreadPoint {
  position: THREE.Vector3;
  color: string;
}

export interface ThreadData {
  id: string;
  sourceId: string;
  targetId: string;
  points: ThreadPoint[]; // control points for the curve
  weight: number;
  color: string;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  threads: ThreadData[];
  center: THREE.Vector3;
  radius: number;
}

// Seeded random for deterministic layouts
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  let state = hash;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Generate a 3D layout for a set of concepts
export function generateLayout(
  conceptIds: string[],
  center: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  scale: number = 10,
  focusConcept?: string
): LayoutResult {
  const rng = seededRandom(conceptIds.sort().join(","));

  // Initial random positions on a sphere
  const positions = new Map<string, THREE.Vector3>();
  for (const id of conceptIds) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const r = scale * (0.3 + rng() * 0.7);
    positions.set(id, new THREE.Vector3(
      center.x + r * Math.sin(phi) * Math.cos(theta),
      center.y + r * Math.sin(phi) * Math.sin(theta),
      center.z + r * Math.cos(phi)
    ));
  }

  // If there's a focus concept, put it near center
  if (focusConcept && positions.has(focusConcept)) {
    positions.set(focusConcept, center.clone().add(
      new THREE.Vector3((rng() - 0.5) * scale * 0.2, (rng() - 0.5) * scale * 0.2, (rng() - 0.5) * scale * 0.2)
    ));
  }

  // Simple force-directed simulation (pre-computed, not real-time)
  const iterations = 50;
  const repulsion = scale * scale * 0.5;
  const attraction = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, THREE.Vector3>();
    for (const id of conceptIds) {
      forces.set(id, new THREE.Vector3(0, 0, 0));
    }

    // Repulsion between all pairs
    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        const a = positions.get(conceptIds[i])!;
        const b = positions.get(conceptIds[j])!;
        const delta = new THREE.Vector3().subVectors(a, b);
        const dist = Math.max(delta.length(), 0.1);
        const force = repulsion / (dist * dist);
        const direction = delta.normalize().multiplyScalar(force);
        forces.get(conceptIds[i])!.add(direction);
        forces.get(conceptIds[j])!.sub(direction);
      }
    }

    // Attraction along edges
    for (const id of conceptIds) {
      const node = conceptGraph.getOrGenerate(id);
      for (const link of node.links) {
        if (positions.has(link.target)) {
          const a = positions.get(id)!;
          const b = positions.get(link.target)!;
          const delta = new THREE.Vector3().subVectors(b, a);
          const dist = delta.length();
          const force = dist * attraction * link.weight;
          const direction = delta.normalize().multiplyScalar(force);
          forces.get(id)!.add(direction);
        }
      }
    }

    // Apply forces with cooling
    const cooling = 1 - iter / iterations;
    for (const id of conceptIds) {
      const pos = positions.get(id)!;
      const force = forces.get(id)!;
      const maxDisplacement = scale * 0.1 * cooling;
      if (force.length() > maxDisplacement) {
        force.normalize().multiplyScalar(maxDisplacement);
      }
      pos.add(force);
    }
  }

  // Build layout nodes
  const nodes: LayoutNode[] = conceptIds.map(id => {
    const node = conceptGraph.getOrGenerate(id);
    const connectionCount = node.links.filter(l => conceptIds.includes(l.target)).length;
    return {
      id,
      position: positions.get(id)!,
      color: hslToHex(conceptGraph.getColor(id)),
      size: 0.3 + (connectionCount / conceptIds.length) * 0.7,
      links: node.links
        .filter(l => conceptIds.includes(l.target))
        .map(l => ({ targetId: l.target, weight: l.weight })),
    };
  });

  // Build threads (curved connections between concepts)
  const threads: ThreadData[] = [];
  const addedEdges = new Set<string>();

  for (const node of nodes) {
    for (const link of node.links) {
      const edgeKey = [node.id, link.targetId].sort().join("--");
      if (addedEdges.has(edgeKey)) continue;
      addedEdges.add(edgeKey);

      const sourcePos = positions.get(node.id)!;
      const targetPos = positions.get(link.targetId)!;

      // Create curved thread with some organic wobble
      const midpoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
      const perpendicular = new THREE.Vector3(
        (rng() - 0.5),
        (rng() - 0.5),
        (rng() - 0.5)
      ).normalize().multiplyScalar(sourcePos.distanceTo(targetPos) * 0.15);
      midpoint.add(perpendicular);

      const sourceColor = hslToHex(conceptGraph.getColor(node.id));
      const targetColor = hslToHex(conceptGraph.getColor(link.targetId));

      threads.push({
        id: edgeKey,
        sourceId: node.id,
        targetId: link.targetId,
        points: [
          { position: sourcePos.clone(), color: sourceColor },
          { position: midpoint, color: blendColors(sourceColor, targetColor) },
          { position: targetPos.clone(), color: targetColor },
        ],
        weight: link.weight,
        color: blendColors(sourceColor, targetColor),
      });
    }
  }

  // Compute bounding sphere
  let maxDist = 0;
  for (const node of nodes) {
    const dist = node.position.distanceTo(center);
    if (dist > maxDist) maxDist = dist;
  }

  return { nodes, threads, center: center.clone(), radius: maxDist };
}

function blendColors(a: string, b: string): string {
  const parse = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const ca = parse(a);
  const cb = parse(b);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex((ca.r + cb.r) / 2)}${toHex((ca.g + cb.g) / 2)}${toHex((ca.b + cb.b) / 2)}`;
}
