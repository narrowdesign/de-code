"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Three.js
const ConceptSpace = dynamic(() => import("@/components/ConceptSpace"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#000008",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#334",
      fontFamily: "system-ui, sans-serif",
      fontSize: 14,
      letterSpacing: "0.1em",
    }}>
      Loading concept space...
    </div>
  ),
});

export default function Home() {
  return <ConceptSpace />;
}
