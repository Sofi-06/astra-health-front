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
      node.material = new THREE.MeshPhysicalMaterial({
        color: '#0bbcff',
        emissive: '#0077ff',
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: 0.5,
        roughness: 0.12,
        metalness: 0.08,
        transmission: 0.12,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        depthWrite: false,
      })
    })
  }, [model])

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.28) * 0.08
  })

  return (
    <Float speed={1.4} rotationIntensity={0} floatIntensity={0.12}>
      <primitive ref={group} object={model} scale={0.92} />
    </Float>
  )
}

function HologramFallback() {
  return <div className="model-loading"><span /><p>Sincronizando modelo biométrico…</p></div>
}

const dataPoints = [
  { label: 'SUEÑO', value: '4.6', unit: 'h', className: 'bio-label--sleep' },
  { label: 'FREC. CARDÍACA', value: '88', unit: 'bpm', className: 'bio-label--heart' },
  { label: 'ACTIVIDAD', value: '25', unit: 'min', className: 'bio-label--activity' },
]

export default function HumanVisualizer() {
  return (
    <section className="human-visualizer" aria-label="Modelo biométrico 3D interactivo">
      <div className="scan-line" />
      <div className="hologram-ring hologram-ring--one" />
      <div className="hologram-ring hologram-ring--two" />
      <Suspense fallback={<HologramFallback />}>
        <Canvas camera={{ position: [0, 2.85, 16], fov: 31 }} dpr={[1, 1.7]} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.35} color="#31d8ff" />
          <pointLight position={[2, 2, 3]} intensity={7} color="#00aeff" distance={9} />
          <pointLight position={[-2, 0, 2]} intensity={5} color="#6ef9ff" distance={8} />
          <HologramModel />
          <OrbitControls target={[0, 2.85, 0.92]} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </Suspense>
      {dataPoints.map((point) => (
        <div key={point.label} className={`bio-label ${point.className}`}>
          <span>{point.label}</span>
          <strong>{point.value} <small>{point.unit}</small></strong>
        </div>
      ))}
      <p className="rotate-hint">Arrastra para explorar el modelo</p>
    </section>
  )
}

useGLTF.preload('/assets/holograming_man.glb')
