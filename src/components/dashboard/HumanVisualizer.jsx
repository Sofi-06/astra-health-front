import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function HologramModel() {
  const group = useRef()
  const { scene } = useGLTF('/assets/holograming_man.glb')
  const model = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    model.traverse((node) => {
      if (!node.isMesh) return
      if (node.name.toLowerCase().includes('sphere')) {
        node.visible = false
        return
      }
      // Material holográfico wireframe azul brillante
      node.material = new THREE.MeshPhysicalMaterial({
        color: '#00c3ff',
        emissive: '#0095ff',
        emissiveIntensity: 1.6,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
        metalness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    })
  }, [model])

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.06
  })

  return (
    <Float speed={1.2} rotationIntensity={0} floatIntensity={0.08}>
      <group ref={group} scale={1.05} position={[0, -0.2, 0]}>
        <primitive object={model} />
      </group>
    </Float>
  )
}

function HologramFallback() {
  return (
    <div className="model-loading">
      <span />
      <p>Sincronizando modelo biométrico…</p>
    </div>
  )
}

export default function HumanVisualizer() {
  return (
    <section className="human-visualizer-pro" aria-label="Visualizador biométrico 3D">
      {/* HUD holográfico lateral derecho */}
      <div className="hud-side-arcs" aria-hidden="true">
        <svg viewBox="0 0 100 200" fill="none" className="hud-side-arcs-svg">
          <path d="M 60 20 A 90 90 0 0 1 60 180" stroke="rgba(49, 220, 255, 0.45)" strokeWidth="1.8" />
          <path d="M 80 40 A 80 80 0 0 1 80 160" stroke="rgba(24, 150, 255, 0.3)" strokeWidth="1.2" strokeDasharray="6 4" />
          <path d="M 95 65 A 70 70 0 0 1 95 135" stroke="rgba(49, 220, 255, 0.6)" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Anillos orbitales en la cadera */}
      <div className="hip-orbital-ring" aria-hidden="true" />
      <div className="hip-orbital-ring hip-orbital-ring--outer" aria-hidden="true" />

      {/* Pedestal de anillos concéntricos HUD en los pies */}
      <div className="feet-pedestal-platform" aria-hidden="true">
        <div className="pedestal-ring pedestal-ring--1" />
        <div className="pedestal-ring pedestal-ring--2" />
        <div className="pedestal-ring pedestal-ring--3" />
        <div className="pedestal-ring pedestal-ring--ticks" />
        <div className="pedestal-glow" />
      </div>

      <div className="scan-line" />

      <Suspense fallback={<HologramFallback />}>
        <Canvas
          camera={{ position: [0, 2.7, 13.5], fov: 32 }}
          dpr={[1, 1.8]}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.5} color="#00e5ff" />
          <pointLight position={[2, 3, 4]} intensity={9} color="#00b4ff" distance={12} />
          <pointLight position={[-2, 1, 3]} intensity={7} color="#45f3ff" distance={10} />
          <HologramModel />
          <OrbitControls
            target={[0, 2.7, 0.5]}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </Suspense>
    </section>
  )
}

useGLTF.preload('/assets/holograming_man.glb')
