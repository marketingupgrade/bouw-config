"use client";

import { useMemo } from "react";
import { Canvas, type ThreeElements } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import {
  CLADDINGS,
  FRAME_COLORS,
  ROOFS,
  TERRAS_DEPTH,
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
        color="#bcd4dd"
        roughness={0.12}
        metalness={0.1}
        transparent
        opacity={0.45}
        reflectivity={0.4}
      />
    </mesh>
  );
}

function Frame({ color, ...props }: { color: string } & ThreeElements["mesh"]) {
  return (
    <mesh castShadow {...props}>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
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
  frameColor,
}: {
  width: number;
  height: number;
  z: number;
  schuifpuien: number;
  cladding: CladdingOption;
  frameColor: string;
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
          color={frameColor}
          position={[-glassWidth / 2 + i * paneW, glassHeight / 2 + 0.05, 0.02]}
          scale={[0.05, glassHeight, 0.06]}
        />
      ))}
      {/* sill */}
      <Frame color={frameColor} position={[0, 0.05, 0.02]} scale={[glassWidth, 0.1, 0.08]} />
    </group>
  );
}

function BackWindows({
  width,
  height,
  z,
  ramen,
  cladding,
  frameColor,
}: {
  width: number;
  height: number;
  z: number;
  ramen: number;
  cladding: CladdingOption;
  frameColor: string;
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
          <Frame color={frameColor} scale={[winW + 0.06, winH + 0.06, 0.045]} position={[0, 0, -0.005]} />
        </group>
      ))}
    </group>
  );
}

function Skylights({
  width,
  depth,
  height,
  count,
  roof,
  frameColor,
}: {
  width: number;
  depth: number;
  height: number;
  count: number;
  roof: RoofOption;
  frameColor: string;
}) {
  if (count <= 0) return null;
  const winW = Math.min(0.9, (width - 0.6) / count);
  const winD = Math.min(1.1, depth * 0.45);
  const spacing = width / (count + 1);
  const xs = Array.from({ length: count }, (_, i) => -width / 2 + spacing * (i + 1));
  const rise = 0.6;
  const angle = roof.id === "lessenaar" ? Math.atan2(rise, depth) : 0;
  const baseY = roof.id === "lessenaar" ? height + rise / 2 + 0.08 : height + 0.13;

  return (
    <group position={[0, baseY, 0]} rotation={[-angle, 0, 0]}>
      {xs.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Frame color={frameColor} scale={[winW + 0.08, 0.05, winD + 0.08]} position={[0, -0.02, 0]} />
          <Glass scale={[winW, 0.06, winD]} />
        </group>
      ))}
    </group>
  );
}

function Canopy({ width, depth, height }: { width: number; depth: number; height: number }) {
  const reach = 1.0;
  return (
    <mesh castShadow position={[0, height - 0.05, depth / 2 + reach / 2 - 0.05]}>
      <boxGeometry args={[width + OVERHANG * 2, 0.08, reach]} />
      <meshStandardMaterial color="#2b2b2b" roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

function Deck({ width, depth }: { width: number; depth: number }) {
  const z = depth / 2 + TERRAS_DEPTH / 2 - 0.05;
  return (
    <group>
      <mesh receiveShadow position={[0, 0.04, z]}>
        <boxGeometry args={[width, 0.08, TERRAS_DEPTH]} />
        <meshStandardMaterial color="#8a6a45" roughness={0.85} />
      </mesh>
      {/* plank lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, 0.085, depth / 2 + (i + 0.5) * (TERRAS_DEPTH / 6) - 0.05]}>
          <boxGeometry args={[width, 0.005, 0.015]} />
          <meshStandardMaterial color="#6f5436" roughness={0.9} />
        </mesh>
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
  const frameColor = find(FRAME_COLORS, config.frameColor).color;
  const { width: w, depth: d, height: h } = config;

  return (
    <group position={[0, 0, 0]}>
      {/* floor slab */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[w + 0.1, 0.1, d + 0.1]} />
        <meshStandardMaterial color="#3b3b3b" roughness={0.9} />
      </mesh>

      <BackWindows width={w} height={h} z={-d / 2 + WALL_T / 2} ramen={config.ramen} cladding={cladding} frameColor={frameColor} />
      <Wall width={WALL_T} height={h} thickness={d} position={[-w / 2 + WALL_T / 2, h / 2, 0]} cladding={cladding} />
      <Wall width={WALL_T} height={h} thickness={d} position={[w / 2 - WALL_T / 2, h / 2, 0]} cladding={cladding} />
      <FrontFace width={w} height={h} z={d / 2 - WALL_T / 2} schuifpuien={config.schuifpuien} cladding={cladding} frameColor={frameColor} />

      <Roof width={w} depth={d} height={h} roof={roof} />
      <Skylights width={w} depth={d} height={h} count={config.dakramen} roof={roof} frameColor={frameColor} />
      {config.luifel && <Canopy width={w} depth={d} height={h} />}
      {config.terras && <Deck width={w} depth={d} />}
    </group>
  );
}

export default function Viewer3D() {
  const config = useConfigurator((s) => s.config);
  const span = Math.max(config.width, config.depth);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ preserveDrawingBuffer: true }}
      camera={{ position: [span * 1.4, config.height * 1.3, span * 1.6], fov: 45 }}
    >
      <color attach="background" args={["#dfe7e0"]} />
      <hemisphereLight intensity={0.7} groundColor="#9aa893" color="#ffffff" />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.5} />
      <Building config={config} />
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
