"use client";

import { Suspense, useMemo } from "react";
import { Canvas, type ThreeElements } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  Grid,
} from "@react-three/drei";
import * as THREE from "three";
import {
  CLADDINGS,
  ROOFS,
  type CladdingOption,
  type Configuration,
  type RoofOption,
} from "@/lib/config";
import { useConfigurator } from "@/lib/store";

const WALL_T = 0.12;
const OVERHANG = 0.15;

function find<T extends { id: string }>(items: T[], id: string): T {
  return items.find((i) => i.id === id) ?? items[0];
}

function Glass(props: ThreeElements["mesh"]) {
  return (
    <mesh {...props}>
      <boxGeometry />
      <meshPhysicalMaterial
        color="#cfe3ec"
        transmission={0.95}
        thickness={0.05}
        roughness={0.05}
        ior={1.4}
        transparent
        opacity={0.6}
        metalness={0}
      />
    </mesh>
  );
}

function Frame(props: ThreeElements["mesh"]) {
  return (
    <mesh castShadow {...props}>
      <boxGeometry />
      <meshStandardMaterial color="#222628" roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

/** Solid cladded wall as a thin box. */
function Wall({
  width,
  height,
  thickness,
  position,
  cladding,
}: {
  width: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  cladding: CladdingOption;
}) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={[width, height, thickness]} />
      <meshStandardMaterial
        color={cladding.color}
        roughness={cladding.roughness}
        metalness={0.05}
      />
    </mesh>
  );
}

function FrontFace({
  width,
  height,
  z,
  schuifpuien,
  cladding,
}: {
  width: number;
  height: number;
  z: number;
  schuifpuien: number;
  cladding: CladdingOption;
}) {
  const glassWidth = schuifpuien > 0 ? Math.min(schuifpuien * 2.2, width - 0.3) : 0;
  const glassHeight = height - 0.25;

  if (glassWidth <= 0) {
    return <Wall width={width} height={height} thickness={WALL_T} position={[0, height / 2, z]} cladding={cladding} />;
  }

  const sideW = (width - glassWidth) / 2;
  const headerH = height - glassHeight;
  const panes = Math.max(1, schuifpuien * 2);
  const paneW = glassWidth / panes;

  return (
    <group position={[0, 0, z]}>
      {sideW > 0.01 && (
        <>
          <Wall width={sideW} height={height} thickness={WALL_T} position={[-(glassWidth / 2 + sideW / 2), height / 2, 0]} cladding={cladding} />
          <Wall width={sideW} height={height} thickness={WALL_T} position={[glassWidth / 2 + sideW / 2, height / 2, 0]} cladding={cladding} />
        </>
      )}
      {/* header above the glazing */}
      <Wall width={glassWidth} height={headerH} thickness={WALL_T} position={[0, glassHeight + headerH / 2, 0]} cladding={cladding} />
      {/* glazing */}
      <Glass position={[0, glassHeight / 2 + 0.05, 0]} scale={[glassWidth - 0.06, glassHeight - 0.06, 0.04]} />
      {/* vertical mullions */}
      {Array.from({ length: panes + 1 }).map((_, i) => (
        <Frame
          key={i}
          position={[-glassWidth / 2 + i * paneW, glassHeight / 2 + 0.05, 0.02]}
          scale={[0.05, glassHeight, 0.06]}
        />
      ))}
      {/* sill */}
      <Frame position={[0, 0.05, 0.02]} scale={[glassWidth, 0.1, 0.08]} />
    </group>
  );
}

function BackWindows({
  width,
  height,
  z,
  ramen,
  cladding,
}: {
  width: number;
  height: number;
  z: number;
  ramen: number;
  cladding: CladdingOption;
}) {
  const winW = 0.7;
  const winH = 0.9;
  const capacity = Math.max(0, Math.floor((width - 0.4) / (winW + 0.4)));
  const count = Math.min(ramen, capacity);
  const positions = useMemo(() => {
    if (count <= 0) return [];
    const spacing = width / (count + 1);
    return Array.from({ length: count }, (_, i) => -width / 2 + spacing * (i + 1));
  }, [count, width]);

  return (
    <group position={[0, 0, z]}>
      <Wall width={width} height={height} thickness={WALL_T} position={[0, height / 2, 0]} cladding={cladding} />
      {positions.map((x, i) => (
        <group key={i} position={[x, height * 0.55, 0]}>
          <Glass scale={[winW, winH, 0.05]} />
          <Frame scale={[winW + 0.06, winH + 0.06, 0.045]} position={[0, 0, -0.005]} />
        </group>
      ))}
    </group>
  );
}

function FlatRoof({
  width,
  depth,
  height,
  roof,
}: {
  width: number;
  depth: number;
  height: number;
  roof: RoofOption;
}) {
  return (
    <mesh castShadow receiveShadow position={[0, height + 0.06, 0]}>
      <boxGeometry args={[width + OVERHANG * 2, 0.12, depth + OVERHANG * 2]} />
      <meshStandardMaterial color={roof.color} roughness={roof.id === "sedum" ? 0.95 : 0.6} />
    </mesh>
  );
}

function LessenaarRoof({
  width,
  depth,
  height,
  roof,
}: {
  width: number;
  depth: number;
  height: number;
  roof: RoofOption;
}) {
  const rise = 0.6;
  const angle = Math.atan2(rise, depth);
  const slabLen = Math.sqrt(depth * depth + rise * rise) + OVERHANG * 2;
  const gable = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-depth / 2, 0);
    shape.lineTo(depth / 2, 0);
    shape.lineTo(-depth / 2, rise);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false });
  }, [depth]);

  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={gable}
          castShadow
          position={[s * (width / 2 - WALL_T / 2), height, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#d8d4cb" roughness={0.9} />
        </mesh>
      ))}
      <mesh castShadow receiveShadow position={[0, height + rise / 2, 0]} rotation={[-angle, 0, 0]}>
        <boxGeometry args={[width + OVERHANG * 2, 0.12, slabLen]} />
        <meshStandardMaterial color={roof.color} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Roof(props: { width: number; depth: number; height: number; roof: RoofOption }) {
  return props.roof.id === "lessenaar" ? <LessenaarRoof {...props} /> : <FlatRoof {...props} />;
}

function Building({ config }: { config: Configuration }) {
  const cladding = find(CLADDINGS, config.cladding);
  const roof = find(ROOFS, config.roof);
  const { width: w, depth: d, height: h } = config;

  return (
    <group position={[0, 0, 0]}>
      {/* floor slab */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[w + 0.1, 0.1, d + 0.1]} />
        <meshStandardMaterial color="#3b3b3b" roughness={0.9} />
      </mesh>

      <BackWindows width={w} height={h} z={-d / 2 + WALL_T / 2} ramen={config.ramen} cladding={cladding} />
      <Wall width={WALL_T} height={h} thickness={d} position={[-w / 2 + WALL_T / 2, h / 2, 0]} cladding={cladding} />
      <Wall width={WALL_T} height={h} thickness={d} position={[w / 2 - WALL_T / 2, h / 2, 0]} cladding={cladding} />
      <FrontFace width={w} height={h} z={d / 2 - WALL_T / 2} schuifpuien={config.schuifpuien} cladding={cladding} />

      <Roof width={w} depth={d} height={h} roof={roof} />
    </group>
  );
}

export default function Viewer3D() {
  const config = useConfigurator((s) => s.config);
  const span = Math.max(config.width, config.depth);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [span * 1.4, config.height * 1.3, span * 1.6], fov: 45 }}
    >
      <color attach="background" args={["#dfe7e0"]} />
      <hemisphereLight intensity={0.5} groundColor="#b9b29e" />
      <directionalLight
        position={[6, 9, 5]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <Suspense fallback={null}>
        <Building config={config} />
        <Environment preset="city" />
      </Suspense>
      <ContactShadows
        position={[0, -0.09, 0]}
        opacity={0.45}
        scale={Math.max(20, span * 3)}
        blur={2.5}
        far={6}
      />
      <Grid
        position={[0, -0.1, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#bcc9bd"
        sectionSize={5}
        sectionColor="#a6b8a8"
        fadeDistance={32}
        infiniteGrid
      />
      <OrbitControls
        target={[0, config.height / 2, 0]}
        enablePan={false}
        minDistance={3}
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
