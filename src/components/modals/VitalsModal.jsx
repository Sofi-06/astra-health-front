import { useState } from 'react'
import { Activity, Droplets, HeartPulse, Thermometer, X } from 'lucide-react'

const fields = [
  { id: 'temperature', label: 'Temperatura', value: '36.8', unit: '°C', icon: Thermometer },
  { id: 'heartRate', label: 'Frecuencia cardiaca', value: '88', unit: 'bpm', icon: HeartPulse },
  { id: 'pressure', label: 'Presión arterial', value: '124/80', unit: 'mmHg', icon: Activity },
  { id: 'oxygen', label: 'Saturación O₂', value: '97', unit: '%', icon: Droplets },
]

export default function VitalsModal({ open, onClose, onSave }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.id, field.value])))
  if (!open) return null

  const submit = (event) => {
    event.preventDefault()
    onSave(values)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="vitals-modal glass-panel" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar"><X /></button>
        <span className="section-title">REGISTRO BIOMÉTRICO</span>
        <h2>Actualizar signos vitales</h2>
        <p>Los datos se sincronizarán con el centro médico de la misión.</p>
        <div className="vitals-grid">
          {fields.map(({ id, label, unit, icon: Icon }) => (
            <label key={id}><span><Icon size={14} /> {label}</span><div><input value={values[id]} onChange={(e) => setValues({ ...values, [id]: e.target.value })} /><small>{unit}</small></div></label>
          ))}
        </div>
        <button className="primary-button modal-submit" type="submit">Guardar registro</button>
      </form>
    </div>
  )
}
