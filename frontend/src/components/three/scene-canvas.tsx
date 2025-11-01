"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";

function SpinningBox() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.x += delta * 0.6;
    mesh.rotation.y += delta * 0.4;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="hsl(222 83% 60%)" roughness={0.3} />
    </mesh>
  );
}

export function SceneCanvas() {
  return (
    <Canvas
      shadows
      className="h-64 w-full rounded-xl border border-border/60 bg-gradient-to-br from-background via-background to-secondary/40 shadow-sm"
      camera={{ position: [3, 3, 4], fov: 50 }}
    >
      <color attach="background" args={["transparent"]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Suspense fallback={null}>
        <SpinningBox />
        <OrbitControls enablePan={false} />
      </Suspense>
    </Canvas>
  );
}

export default SceneCanvas;
