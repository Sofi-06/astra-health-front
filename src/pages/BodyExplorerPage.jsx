import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { Activity, Bone, Brain, CircleDot, Heart, Plus, Radiation, Waves } from 'lucide-react'
import * as THREE from 'three'
import Panel from '../components/ui/Panel'

const systems = [
  { name: 'Cerebro', icon: Brain, status: 'Atención', description: 'El sueño y el aislamiento pueden afectar la concentración.', records: ['Calidad del sueño', 'Concentración'], action: 'Rutina cognitiva programada' },
  { name: 'Corazón', icon: Heart, status: 'Seguimiento', description: 'La microgravedad cambia la forma en que el corazón bombea y se adapta.', records: ['Frecuencia cardíaca', 'Presión arterial'], action: 'Ejercicio cardiovascular programado' },
  { name: 'Pulmones', icon: Waves, status: 'Estable', description: 'La capacidad respiratoria se monitorea durante toda la misión.', records: ['Saturación de oxígeno', 'Frecuencia respiratoria'], action: 'Respiración guiada diaria' },
  { name: 'Huesos', icon: Bone, status: 'Preventivo', description: 'La microgravedad acelera la pérdida de densidad mineral ósea.', records: ['Densidad ósea', 'Carga de ejercicio'], action: 'Resistencia y suplementación' },
  { name: 'Músculos', icon: Activity, status: 'Seguimiento', description: 'La masa muscular requiere estímulo constante en microgravedad.', records: ['Fuerza funcional', 'Tiempo de actividad'], action: 'Ejercicio de resistencia' },
  { name: 'Digestivo', icon: CircleDot, status: 'Estable', description: 'La nutrición y digestión se controlan durante la misión.', records: ['Glucosa', 'Hidratación'], action: 'Plan nutricional de misión' },
  { name: 'Inmunológico', icon: Plus, status: 'Preventivo', description: 'El estrés espacial puede modificar la respuesta inmunológica.', records: ['Temperatura', 'Marcadores inmunes'], action: 'Control médico periódico' },
]

function ExplorerModel() {
  const group = useRef()
  const { scene } = useGLTF('/assets/holograming_man.glb')
  const model = useMemo(() => cloneSkeleton(scene), [scene])

  useEffect(() => {
    model.traverse((node) => {
      if (!node.isMesh) return
      if (node.name.toLowerCase().includes('sphere')) {
        node.visible = false
        return
      }
      const hologramMaterial = node.material.clone()
      hologramMaterial.transparent = true
      hologramMaterial.opacity = .76
      hologramMaterial.depthWrite = true
      hologramMaterial.side = THREE.FrontSide
      node.material = hologramMaterial
    })
    const raisedUpperArm = model.getObjectByName('upper_arm.R_030')
    const raisedForearm = model.getObjectByName('forearm.R_031')
    if (raisedUpperArm) raisedUpperArm.quaternion.set(-.4075, -.6086, .3288, .5962)
    if (raisedForearm) raisedForearm.quaternion.set(.2275, -.1996, .1682, .9381)
  }, [model])

  useFrame((state) => {
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * .22) * .045
  })

  return <primitive ref={group} object={model} scale={1.18} position={[.08, .12, 0]} />
}

function BodyModel() {
  return (
    <div className="body-model-stage">
      <div className="body-orbit body-orbit--one" /><div className="body-orbit body-orbit--two" />
      <div className="body-heart-pulse">♥</div>
      <div className="body-platform"><i /><i /><i /></div>
      <Suspense fallback={<div className="body-model-loading">Sincronizando modelo…</div>}>
        <Canvas camera={{ position: [0, 2.85, 12.8], fov: 31 }} dpr={[1, 1.7]} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={.5} color="#43dcff" />
          <pointLight position={[2, 3, 4]} intensity={8} color="#00bfff" distance={10} />
          <pointLight position={[-2, 0, 3]} intensity={6} color="#70f5ff" distance={9} />
          <ExplorerModel />
          <OrbitControls target={[0, 2.85, .9]} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </Suspense>
      <div className="body-callout body-callout--mood"><small>BIENESTAR</small><strong>Cansado</strong></div>
      <div className="body-callout body-callout--heart"><small>FREC. CARDÍACA</small><strong>88 <em>bpm</em></strong></div>
      <div className="body-callout body-callout--oxygen"><small>SATURACIÓN O₂</small><strong>97<em>%</em></strong></div>
      <div className="body-callout body-callout--activity"><small>ACTIVIDAD</small><strong>25 <em>min</em></strong></div>
    </div>
  )
}

function DetailTrend({ color = '#ff9d83' }) {
  return (
    <svg className="body-detail-chart" viewBox="0 0 270 125" role="img" aria-label="Evolución del sistema">
      <defs><linearGradient id="bodyDetailFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".38" /><stop offset="1" stopColor={color} stopOpacity=".02" /></linearGradient></defs>
      {[14, 42, 70, 98].map((y, index) => <g key={y}><line x1="27" x2="266" y1={y} y2={y} className="body-detail-grid" /><text x="1" y={y + 4} className="body-detail-label">{100 - index * 10}</text></g>)}
      <path d="M27 79 L50 76 L72 71 L95 69 L117 66 L140 53 L163 50 L185 43 L207 41 L230 34 L266 29 L266 98 L27 98 Z" fill="url(#bodyDetailFill)" />
      <path d="M27 79 L50 76 L72 71 L95 69 L117 66 L140 53 L163 50 L185 43 L207 41 L230 34 L266 29" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="266" cy="29" r="8" fill={color} opacity=".25" /><circle cx="266" cy="29" r="4" fill="#fff" stroke={color} strokeWidth="2" />
      {['D139', 'D141', 'D143', 'D145'].map((label, index) => <text key={label} x={28 + index * 79} y="120" textAnchor="middle" className="body-detail-label">{label}</text>)}
    </svg>
  )
}

export default function BodyExplorerPage({ onNotify }) {
  const [selected, setSelected] = useState('Corazón')
  const detail = systems.find((system) => system.name === selected)

  const chooseSystem = (name) => {
    setSelected(name)
    onNotify(`Explorando sistema: ${name}.`)
  }

  return (
    <section className="body-explorer" aria-label="Explorador del cuerpo humano">
      <div className="body-main-grid">
        <Panel className="body-systems-card">
          <span className="body-kicker">SISTEMAS</span>
          <nav>{systems.map(({ name, icon: Icon }) => <button key={name} className={selected === name ? 'is-active' : ''} onClick={() => chooseSystem(name)}><Icon size={20} strokeWidth={1.45} /><span>{name}</span></button>)}</nav>
        </Panel>

        <BodyModel />

        <Panel className="body-detail-card">
          <span className="body-kicker">DETALLE</span>
          <h2>{detail.name}</h2>
          <span className="body-status-chip">{detail.status}</span>
          <DetailTrend color={selected === 'Corazón' ? '#ff9d83' : '#50e6ff'} />
          <h3>EN EL ESPACIO</h3><p>{detail.description}</p>
          <h3>QUÉ SE REGISTRA</h3>
          <ul>{detail.records.map((record) => <li key={record}>{record}</li>)}</ul>
          <h3>ACCIONES PREVENTIVAS</h3>
          <ul><li>{detail.action}</li></ul>
        </Panel>
      </div>

      <Panel className="body-knowledge-card">
        <div className="body-knowledge-intro"><h2>Conoce tu cuerpo</h2><p>Cómo la microgravedad, la radiación y el aislamiento afectan cada sistema.</p></div>
        <button onClick={() => onNotify('Abriendo efectos de la radiación.')}><Radiation size={19} /><strong>Radiación</strong><small>Efectos y seguimiento</small></button>
        <button onClick={() => onNotify('Abriendo efectos de la microgravedad.')}><span className="body-down-arrow">⬇</span><strong>Microgravedad</strong><small>Hueso, músculo, corazón</small></button>
        <button onClick={() => onNotify('Abriendo efectos del aislamiento.')}><CircleDot size={18} /><strong>Aislamiento</strong><small>Sueño y ánimo</small></button>
      </Panel>
    </section>
  )
}

useGLTF.preload('/assets/holograming_man.glb')
