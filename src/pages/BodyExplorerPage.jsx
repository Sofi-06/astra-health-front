import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { Activity, Bone, Brain, CircleDot, Heart, Plus, Radiation, Waves } from 'lucide-react'
import * as THREE from 'three'
import Panel from '../components/ui/Panel'
import Skeleton, { SkeletonGroup } from '../components/ui/Skeleton'
import { listEntries, getHistory } from '../api/client'
import { formatDay, formatValue, formatWhen } from '../data/format'

// Cada sistema muestra solo los indicadores que el backend registra de verdad.
// Sin datos reales se dice "Sin registros"; no se simulan estados clínicos.
const SYSTEM_DEFS = [
  { name: 'Cerebro', icon: Brain, description: 'El sueño y el aislamiento pueden afectar la concentración.', metrics: [{ code: 'sleep', label: 'Sueño declarado' }], action: 'Rutina cognitiva programada' },
  { name: 'Corazón', icon: Heart, description: 'La microgravedad cambia la forma en que el corazón bombea y se adapta.', metrics: [{ code: 'heart_rate', label: 'Frecuencia cardíaca' }, { code: 'blood_pressure', label: 'Presión arterial' }], action: 'Ejercicio cardiovascular programado' },
  { name: 'Pulmones', icon: Waves, description: 'La capacidad respiratoria se monitorea durante toda la misión.', metrics: [{ code: 'oxygen_saturation', label: 'Saturación de oxígeno' }], action: 'Respiración guiada diaria' },
  { name: 'Huesos', icon: Bone, description: 'La microgravedad acelera la pérdida de densidad mineral ósea.', metrics: [], action: 'Resistencia y suplementación' },
  { name: 'Músculos', icon: Activity, description: 'La masa muscular requiere estímulo constante en microgravedad.', metrics: [], action: 'Ejercicio de resistencia' },
  { name: 'Digestivo', icon: CircleDot, description: 'La nutrición y digestión se controlan durante la misión.', metrics: [{ code: 'glucose', label: 'Glucosa' }], action: 'Plan nutricional de misión' },
  { name: 'Inmunológico', icon: Plus, description: 'El estrés espacial puede modificar la respuesta inmunológica.', metrics: [{ code: 'temperature', label: 'Temperatura' }], action: 'Control médico periódico' },
]

function buildSystems(latest) {
  return SYSTEM_DEFS.map((def) => {
    const records = def.metrics.map(({ code, label }) => {
      const entry = latest?.[code]
      return entry
        ? `${label}: ${formatValue(entry.candidate)} ${entry.candidate.unit} · ${formatWhen(entry.measured_at)}`
        : `${label}: sin registros`
    })
    const hasData = def.metrics.some(({ code }) => latest?.[code])
    return {
      ...def,
      status: def.metrics.length === 0 ? 'Sin indicador conectado' : hasData ? 'Con registros' : 'Sin registros',
      records: records.length ? records : ['Este prototipo no registra un indicador de este sistema'],
    }
  })
}

const bodyHitZones = [
  { id: 'brain', system: 'Cerebro', color: '#b98cff', shape: 'sphere', position: [0, 5.55, 0.3], markerPosition: [0, 6.02, 0.68], scale: [0.48, 0.58, 0.48] },
  { id: 'immune', system: 'Inmunológico', color: '#68f5a7', shape: 'sphere', position: [0, 4.92, 0.45], markerPosition: [0, 5.02, 0.72], scale: [0.28, 0.3, 0.28] },
  { id: 'lungs', system: 'Pulmones', color: '#56a8ff', shape: 'box', position: [0.12, 4.42, 0.35], markerPosition: [0.38, 4.43, 0.74], scale: [0.92, 0.58, 0.5] },
  { id: 'heart', system: 'Corazón', color: '#ff718b', shape: 'sphere', position: [-0.24, 4.34, 0.82], markerPosition: [-0.25, 4.58, 0.9], scale: [0.3, 0.34, 0.28] },
  { id: 'digestive', system: 'Digestivo', color: '#ffb45e', shape: 'box', position: [0, 3.62, 0.42], markerPosition: [0, 3.7, 0.7], scale: [0.82, 0.78, 0.5] },
  { id: 'muscle-arm-left', system: 'Músculos', color: '#48e5ed', shape: 'box', position: [-0.88, 4.18, 0.18], rotation: [0, 0, -0.82], scale: [0.34, 1.25, 0.34] },
  { id: 'muscle-arm-right', system: 'Músculos', color: '#48e5ed', shape: 'box', position: [0.84, 3.72, 0.12], markerPosition: [0.82, 4.14, 0.58], rotation: [0, 0, -0.08], scale: [0.34, 1.45, 0.34] },
  { id: 'bone-leg-left', system: 'Huesos', color: '#f6dc68', shape: 'box', position: [-0.34, 1.55, 0.02], rotation: [0, 0, -0.04], scale: [0.38, 2.25, 0.42] },
  { id: 'bone-leg-right', system: 'Huesos', color: '#f6dc68', shape: 'box', position: [0.34, 1.55, 0.02], markerPosition: [0.34, 1.55, 0.38], rotation: [0, 0, 0.04], scale: [0.38, 2.25, 0.42] },
]

function TouchBeacon({ active, color, hovered, position, phase }) {
  const pulse = useRef()

  useFrame(({ clock }) => {
    if (!pulse.current) return
    const wave = (Math.sin(clock.elapsedTime * 2.25 + phase) + 1) / 2
    const emphasis = active ? 0.22 : hovered ? 0.16 : 0.1
    pulse.current.scale.setScalar(1 + wave * emphasis)
  })

  return (
    <group ref={pulse} position={position} renderOrder={30}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[active ? 0.078 : 0.068, 18, 14]} />
        <meshBasicMaterial
          color={hovered ? '#ffffff' : color}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh raycast={() => null} scale={active ? 1.65 : hovered ? 1.55 : 1.42}>
        <sphereGeometry args={[0.1, 18, 14]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={active ? 0.28 : hovered ? 0.23 : 0.16}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function BodyHitZone({ zone, phase, showBeacon, selected, hovered, onPointerDown, onPointerUp, onPointerOver, onPointerOut }) {
  const active = selected === zone.system
  const isHovered = hovered === zone.system

  return (
    <>
      <mesh
        position={zone.position}
        rotation={zone.rotation || [0, 0, 0]}
        scale={zone.scale}
        userData={{ bodySystem: zone.system }}
        onPointerDown={(event) => onPointerDown(event, zone.system)}
        onPointerUp={(event) => onPointerUp(event, zone.system)}
        onPointerCancel={(event) => onPointerOut(event, zone.system)}
        onPointerOver={(event) => onPointerOver(event, zone.system)}
        onPointerOut={(event) => onPointerOut(event, zone.system)}
      >
        {zone.shape === 'sphere'
          ? <sphereGeometry args={[1, 22, 16]} />
          : <boxGeometry args={[1, 1, 1]} />}
        <meshBasicMaterial
          transparent
          opacity={0}
          colorWrite={false}
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {showBeacon && (
        <TouchBeacon active={active} color={zone.color} hovered={isHovered} position={zone.markerPosition} phase={phase} />
      )}
    </>
  )
}

function ExplorerModel({ selected, onSelect }) {
  const group = useRef()
  const gestures = useRef(new Map())
  const [hovered, setHovered] = useState(null)
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
      hologramMaterial.opacity = 0.8
      hologramMaterial.depthWrite = true
      hologramMaterial.side = THREE.FrontSide
      node.material = hologramMaterial
    })
    const raisedUpperArm = model.getObjectByName('upper_arm.R_030')
    const raisedForearm = model.getObjectByName('forearm.R_031')
    if (raisedUpperArm) raisedUpperArm.quaternion.set(-0.4075, -0.6086, 0.3288, 0.5962)
    if (raisedForearm) raisedForearm.quaternion.set(0.2275, -0.1996, 0.1682, 0.9381)
  }, [model])

  useFrame((state) => {
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.045
  })

  const pointerPosition = (event) => event.nativeEvent || event

  const handlePointerDown = (event, system) => {
    const pointer = pointerPosition(event)
    const multiTouch = gestures.current.size > 0
    if (multiTouch) {
      gestures.current.forEach((current) => { current.multiTouch = true })
    }
    gestures.current.set(pointer.pointerId, {
      system,
      x: pointer.clientX,
      y: pointer.clientY,
      multiTouch,
    })
  }

  const handlePointerUp = (event, system) => {
    const pointer = pointerPosition(event)
    const start = gestures.current.get(pointer.pointerId)
    gestures.current.delete(pointer.pointerId)
    if (!start || start.multiTouch || start.system !== system) return
    const moved = Math.hypot(pointer.clientX - start.x, pointer.clientY - start.y)
    if (moved > 8) return
    event.stopPropagation()
    onSelect(system)
  }

  const handlePointerOver = (event, system) => {
    event.stopPropagation()
    setHovered(system)
    const canvas = event.nativeEvent?.target
    if (canvas?.style) canvas.style.cursor = 'pointer'
  }

  const handlePointerOut = (event, system) => {
    const pointer = pointerPosition(event)
    gestures.current.delete(pointer.pointerId)
    setHovered((current) => current === system ? null : current)
    const canvas = event?.nativeEvent?.target
    if (canvas?.style) canvas.style.cursor = 'grab'
  }

  // El modelo es una sola escena: las zonas invisibles viven en este mismo grupo,
  // por lo que mantienen su posición al rotar o acercar la cámara.
  return (
    <group ref={group} scale={0.96} position={[0.08, -0.42, 0]}>
      <primitive object={model} />
      {bodyHitZones.map((zone, index) => (
        <BodyHitZone
          key={zone.id}
          zone={zone}
          phase={index * 0.57}
          showBeacon={Boolean(zone.markerPosition)}
          selected={selected}
          hovered={hovered}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />
      ))}
    </group>
  )
}

function BodyModel({ selected, onSelect, latest }) {
  const hr = latest?.heart_rate
  const o2 = latest?.oxygen_saturation
  const temp = latest?.temperature
  const gluc = latest?.glucose
  return (
    <div className="body-model-stage" aria-label={`Modelo corporal interactivo. Zona seleccionada: ${selected}`}>
      <div className="body-orbit body-orbit--one" /><div className="body-orbit body-orbit--two" />
      <div className="body-platform"><i /><i /><i /></div>
      <Suspense fallback={<div className="body-model-loading">Sincronizando modelo…</div>}>
        <Canvas key="body-explorer-fixed-camera" camera={{ position: [0, 2.35, 14.2], fov: 32 }} dpr={[1, 1.7]} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.5} color="#43dcff" />
          <pointLight position={[2, 3, 4]} intensity={8} color="#00bfff" distance={10} />
          <pointLight position={[-2, 0, 3]} intensity={6} color="#70f5ff" distance={9} />
          <ExplorerModel selected={selected} onSelect={onSelect} />
          <OrbitControls target={[0, 2.35, 0.6]} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </Suspense>
      <div className="body-callout body-callout--mood"><small>TEMPERATURA</small><strong>{temp ? <>{formatValue(temp.candidate)} <em>{temp.candidate.unit}</em></> : '—'}</strong></div>
      <div className="body-callout body-callout--heart"><small>FREC. CARDÍACA</small><strong>{hr ? <>{formatValue(hr.candidate)} <em>{hr.candidate.unit}</em></> : '—'}</strong></div>
      <div className="body-callout body-callout--oxygen"><small>SATURACIÓN O₂</small><strong>{o2 ? <>{formatValue(o2.candidate)}<em>{o2.candidate.unit}</em></> : '—'}</strong></div>
      <div className="body-callout body-callout--activity"><small>GLUCOSA</small><strong>{gluc ? <>{formatValue(gluc.candidate)} <em>{gluc.candidate.unit}</em></> : '—'}</strong></div>
    </div>
  )
}

function DetailTrend({ color = '#ff9d83', points = [], unit = '' }) {
  if (points.length < 2) {
    return <p className="chart-empty">Sin registros suficientes del indicador principal de este sistema para dibujar su evolución.</p>
  }
  const values = points.map((p) => p.values[0])
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) { min -= 1; max += 1 }
  const left = 27
  const right = 266
  const top = 14
  const bottom = 98
  const coords = values.map((v, i) => [
    left + (i / (values.length - 1)) * (right - left),
    top + (1 - (v - min) / (max - min)) * (bottom - top - 20),
  ])
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L ${coords.at(-1)[0]} ${bottom} L ${coords[0][0]} ${bottom} Z`
  const last = coords.at(-1)
  const yLabels = [max, (max + min) / 2, min]
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1]
  return (
    <svg className="body-detail-chart" viewBox="0 0 270 125" role="img" aria-label={`Evolución real del sistema (${unit})`}>
      <defs><linearGradient id="bodyDetailFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".38" /><stop offset="1" stopColor={color} stopOpacity=".02" /></linearGradient></defs>
      {yLabels.map((tick, index) => {
        const y = top + index * ((bottom - top) / 2)
        return <g key={index}><line x1={left} x2={right} y1={y} y2={y} className="body-detail-grid" /><text x="1" y={y + 4} className="body-detail-label">{tick.toFixed(1)}</text></g>
      })}
      <path d={area} fill="url(#bodyDetailFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="8" fill={color} opacity=".25" /><circle cx={last[0]} cy={last[1]} r="4" fill="#fff" stroke={color} strokeWidth="2" />
      {xLabels.map((i) => <text key={i} x={left + (i / Math.max(1, points.length - 1)) * (right - left)} y="120" textAnchor="middle" className="body-detail-label">{formatDay(points[i].t)}</text>)}
    </svg>
  )
}

export default function BodyExplorerPage({ onNotify }) {
  const [selected, setSelected] = useState('Corazón')
  const [latest, setLatest] = useState({})
  const [entriesLoaded, setEntriesLoaded] = useState(false)
  const [loadedMetric, setLoadedMetric] = useState(null) // indicador cuyo historial ya se cargó
  const [detailPoints, setDetailPoints] = useState({ points: [], unit: '' })
  const systems = useMemo(() => buildSystems(latest), [latest])
  const detail = systems.find((system) => system.name === selected)
  const primaryMetric = detail?.metrics?.[0]?.code
  const detailLoading = !entriesLoaded || (primaryMetric && loadedMetric !== primaryMetric)

  useEffect(() => {
    let cancelled = false
    listEntries().then((data) => {
      if (cancelled) return
      const byMetric = {}
      for (const entry of data.entries || []) {
        const code = entry.candidate?.metric
        if (entry.candidate?.kind !== 'measurement' || !code) continue
        if (!byMetric[code] || entry.measured_at > byMetric[code].measured_at) byMetric[code] = entry
      }
      setLatest(byMetric)
    }).catch(() => {}).finally(() => { if (!cancelled) setEntriesLoaded(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const primary = detail?.metrics?.[0]?.code
    if (!primary) {
      setDetailPoints({ points: [], unit: '' })
      return
    }
    let cancelled = false
    getHistory(primary, 30).then((data) => {
      if (cancelled) return
      const series = [...(data?.series ?? [])].sort((a, b) => b.points.length - a.points.length)[0]
      setDetailPoints({ points: series?.points ?? [], unit: series?.unit || '' })
    }).catch(() => setDetailPoints({ points: [], unit: '' }))
      .finally(() => { if (!cancelled) setLoadedMetric(primary) })
    return () => { cancelled = true }
  }, [detail?.metrics])

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

        <BodyModel selected={selected} onSelect={chooseSystem} latest={latest} />

        <Panel className="body-detail-card">
          <span className="body-kicker">DETALLE</span>
          <h2>{detail.name}</h2>
          {entriesLoaded ? <span className="body-status-chip">{detail.status}</span> : <Skeleton w={120} h={22} radius="14px" />}
          {detailLoading ? (
            <SkeletonGroup label="Cargando evolución del sistema…">
              <Skeleton w="100%" h={100} />
            </SkeletonGroup>
          ) : (
            <DetailTrend color={selected === 'Corazón' ? '#ff9d83' : '#50e6ff'} points={detailPoints.points} unit={detailPoints.unit} />
          )}
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
