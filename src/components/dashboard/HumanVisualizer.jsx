import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Html, Line, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { formatValue } from '../../data/format'

const BODY_POINTS = [
  {
    code: 'sleep', label: 'SUEÑO',
    anchor: [0, 5.55, 0.58], labelPosition: [1.75, 5.72, 0.56],
  },
  {
    code: 'oxygen_saturation', label: 'SATURACIÓN',
    anchor: [-0.92, 4.72, 1.86], labelPosition: [-2.05, 4.98, 1.1],
  },
  {
    code: 'blood_pressure', label: 'PRESIÓN',
    anchor: [0.7, 4.68, 0.25], labelPosition: [1.95, 4.67, 0.48],
  },
  {
    code: 'heart_rate', label: 'PULSO',
    anchor: [0.18, 4.3, 0.58], labelPosition: [1.9, 3.88, 0.62],
  },
  {
    code: 'temperature', label: 'TEMPERATURA',
    anchor: [-0.18, 3.95, 0.55], labelPosition: [-1.9, 3.72, 0.55],
  },
  {
    code: 'glucose', label: 'GLUCOSA',
    anchor: [0, 3.48, 0.55], labelPosition: [1.8, 3.02, 0.58],
  },
]

function BodyMetric({ point, entry }) {
  const candidate = entry.candidate
  return (
    <>
      <Line
        points={[point.anchor, point.labelPosition]}
        color="#65e9ff"
        lineWidth={1}
        transparent
        opacity={0.7}
        depthTest={false}
        renderOrder={12}
      />
      <mesh position={point.anchor} renderOrder={13}>
        <sphereGeometry args={[0.045, 14, 14]} />
        <meshBasicMaterial color="#d8ffff" depthTest={false} />
      </mesh>
      <Html position={point.labelPosition} center zIndexRange={[12, 1]} className="body-metric-html">
        <div className="body-metric-card">
          <span>{point.label}</span>
          <strong>{formatValue(candidate)} <small>{candidate.unit}</small></strong>
        </div>
      </Html>
    </>
  )
}

function HologramModel({ latest }) {
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
      <group ref={group} scale={0.92}>
        <primitive object={model} />
        {BODY_POINTS.map((point) => {
          const entry = latest[point.code]
          return entry ? <BodyMetric key={point.code} point={point} entry={entry} /> : null
        })}
      </group>
    </Float>
  )
}

function HologramFallback() {
  return <div className="model-loading"><span /><p>Sincronizando modelo biométrico…</p></div>
}

export default function HumanVisualizer({ latest }) {
  const registeredCount = Object.keys(latest).length
  return (
    <section className="human-visualizer" aria-label={`Modelo biométrico 3D con ${registeredCount} indicadores registrados`}>
      <div className="scan-line" />
      <div className="hologram-ring hologram-ring--one" />
      <div className="hologram-ring hologram-ring--two" />
      <Suspense fallback={<HologramFallback />}>
        <Canvas camera={{ position: [0, 2.85, 16], fov: 31 }} dpr={[1, 1.7]} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.35} color="#31d8ff" />
          <pointLight position={[2, 2, 3]} intensity={7} color="#00aeff" distance={9} />
          <pointLight position={[-2, 0, 2]} intensity={5} color="#6ef9ff" distance={8} />
          <HologramModel latest={latest} />
          <OrbitControls target={[0, 2.85, 0.92]} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </Suspense>
      {!registeredCount && <p className="body-metrics-empty">Registra un indicador para ubicarlo en el modelo</p>}
      <p className="rotate-hint">Arrastra para explorar el modelo</p>
    </section>
  )
}

useGLTF.preload('/assets/holograming_man.glb')
