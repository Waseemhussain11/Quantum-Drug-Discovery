import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- Sub-component: Drug Molecule (Ball and Stick) ---
const DrugMolecule = () => {
  const groupRef = useRef();
  
  // Create a simple molecular structure (6 atoms)
  const atoms = [
    { pos: [0, 0, 0], color: '#06b6d4' },    // Central atom
    { pos: [0.8, 0.4, 0.2], color: '#a855f7' },
    { pos: [-0.6, -0.6, 0.3], color: '#a855f7' },
    { pos: [0.3, -0.7, -0.5], color: '#06b6d4' },
    { pos: [-0.9, 0.2, -0.4], color: '#06b6d4' },
    { pos: [0.2, 0.9, -0.1], color: '#a855f7' },
  ];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      groupRef.current.rotation.z += 0.005;
    }
  });

  return (
    <group ref={groupRef} scale={0.4}>
      {atoms.map((atom, i) => (
        <group key={i}>
          <mesh position={atom.pos}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={atom.color} emissive={atom.color} emissiveIntensity={2} />
          </mesh>
          {/* Bonds to central atom */}
          {i > 0 && (
            <mesh position={[atom.pos[0]/2, atom.pos[1]/2, atom.pos[2]/2]} 
                  quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...atom.pos).normalize())}>
              <cylinderGeometry args={[0.05, 0.05, Math.sqrt(atom.pos[0]**2 + atom.pos[1]**2 + atom.pos[2]**2)]} />
              <meshStandardMaterial color="#fff" opacity={0.6} transparent />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

// --- Sub-component: Anatomical Particle Brain ---
const AnatomicalBrain = ({ isHealthy }) => {
  const pointsRef = useRef();

  const particleCount = isHealthy ? 8000 : 3500;
  
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const szs = new Float32Array(particleCount);

    const baseColor = isHealthy ? new THREE.Color('#06b6d4') : new THREE.Color('#94a3b8');
    const altColor = isHealthy ? new THREE.Color('#a855f7') : new THREE.Color('#475569');

    for (let i = 0; i < particleCount; i++) {
        const hemisphere = Math.random() > 0.5 ? 1 : -1;
        
        // Use spherical coords with anatomical scaling
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        let r = 2.2 + Math.random() * 0.7;
        
        // Brain scaling (wider, longer, slightly shorter)
        let x = r * Math.sin(phi) * Math.cos(theta); // width
        let y = r * Math.sin(phi) * Math.sin(theta); // height
        let z = r * Math.cos(phi);                  // length
        
        // Shape into hemispheres
        x *= 0.75;  // side squash
        y *= 0.65;  // vertical squash
        z *= 1.1;   // front-back stretch

        // Add hemisphere separation (Central Sulcus)
        x += hemisphere * 0.3;
        if (Math.abs(x) < 0.25) {
          x += hemisphere * 0.2; // exaggerate gap
        }

        // --- Folds (Gyrus/Sulcus Simulation) ---
        // Use trigonometric noise to create "folds"
        const foldStrength = isHealthy ? 0.25 : 0.15;
        const folds = Math.sin(x * 4) * Math.cos(y * 4) * Math.sin(z * 4);
        x += folds * foldStrength;
        y += folds * foldStrength;
        z += folds * foldStrength;

        // Alzheimer's Decay: Create gaps/holes
        if (!isHealthy && Math.random() > 0.8) {
           // Skip or push far away (decayed areas)
           x *= 1.4; y *= 1.4; z *= 1.4;
        }

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        // Colors
        const mixed = baseColor.clone().lerp(altColor, Math.random());
        if (!isHealthy && Math.random() > 0.6) {
           mixed.multiplyScalar(0.4); // darkened dead areas
        }
        
        cols[i * 3] = mixed.r;
        cols[i * 3 + 1] = mixed.g;
        cols[i * 3 + 2] = mixed.b;

        szs[i] = Math.random() * (isHealthy ? 1.4 : 0.9);
    }
    return { positions: pos, colors: cols, sizes: szs };
  }, [isHealthy]);

  useFrame((state) => {
    if (pointsRef.current) {
        pointsRef.current.rotation.y += isHealthy ? 0.0025 : 0.001;
        pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={isHealthy ? 0.065 : 0.05}
        vertexColors
        transparent
        opacity={isHealthy ? 0.45 : 0.25} // Ghost mode for healthy brain
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default function Brain3D({ isHealthy }) {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 60 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={isHealthy ? 1.0 : 0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <AnatomicalBrain isHealthy={isHealthy} />
        {isHealthy && <DrugMolecule />} 
      </Float>

      {isHealthy && <Stars radius={50} depth={50} count={1200} factor={4} saturation={0} fade speed={1.5} />}
      {!isHealthy && <Stars radius={50} depth={50} count={400} factor={2} saturation={0} fade speed={0.4} color="#475569" />}
      
      <OrbitControls 
        enableZoom={true} 
        enablePan={false} 
        autoRotate={true} 
        autoRotateSpeed={isHealthy ? 1.8 : 0.6} 
        minDistance={3}
        maxDistance={15}
      />
    </Canvas>
  );
}
