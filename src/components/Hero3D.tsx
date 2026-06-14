import { Suspense, lazy, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sphere, MeshDistortMaterial, Torus } from "@react-three/drei";
import * as THREE from "three";

function Shield({ locked }: { locked: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    ref.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.15;
  });
  const color = locked ? "#34e89e" : "#facc15";
  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
        {/* Shield body */}
        <mesh>
          <icosahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} emissive={color} emissiveIntensity={0.35} />
        </mesh>
        {/* Inner SIM card */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.85, 1.05, 0.08]} />
          <meshStandardMaterial color="#0e1424" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 0.1]}>
          <boxGeometry args={[0.45, 0.32, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
        </mesh>
      </Float>
      {/* Rings */}
      <Torus args={[1.7, 0.015, 16, 100]} rotation={[Math.PI / 2.4, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </Torus>
      <Torus args={[2.1, 0.01, 16, 100]} rotation={[Math.PI / 2.8, Math.PI / 4, 0]}>
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.7} />
      </Torus>
    </group>
  );
}

function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 3 + Math.random() * 4;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(p) * Math.cos(t);
    positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    positions[i * 3 + 2] = r * Math.cos(p);
  }
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.05;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#7dd3fc" transparent opacity={0.7} />
    </points>
  );
}

function Pulse() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = (s.clock.getElapsedTime() % 2) / 2;
    ref.current.scale.setScalar(1 + t * 1.5);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - t);
  });
  return (
    <mesh ref={ref}>
      <ringGeometry args={[1.4, 1.46, 64]} />
      <meshBasicMaterial color="#34e89e" transparent />
    </mesh>
  );
}

export function Hero3D({ locked = true }: { locked?: boolean }) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#22d3ee" />
        <pointLight position={[-5, -3, 3]} intensity={0.8} color="#a78bfa" />
        <Suspense fallback={null}>
          <Stars radius={50} depth={50} count={2500} factor={3} fade speed={0.4} />
          <DataParticles />
          <Shield locked={locked} />
          {locked && <Pulse />}
          <Sphere args={[6, 32, 32]}>
            <MeshDistortMaterial color="#0b1226" transparent opacity={0.15} distort={0.4} speed={1} side={THREE.BackSide} />
          </Sphere>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Hero3D;
