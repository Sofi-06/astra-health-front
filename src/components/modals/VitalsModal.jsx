import { useState } from 'react'
import {
  Activity,
  ArrowLeft,
  Check,
  Droplet,
  Gauge,
  HeartPulse,
  Moon,
  Thermometer,
  X,
} from 'lucide-react'
import { confirmPending, discardPending, sendMessage } from '../../api/client'
import { METRIC_LABELS, formatValue, formatWhen } from '../../data/format'

const INDICATORS = [
  { code: 'heart_rate', label: 'Pulso', description: 'Latidos por minuto', unit: 'lpm', icon: HeartPulse },
  { code: 'blood_pressure', label: 'Presión', description: 'Sistólica y diastólica', unit: 'mmHg', icon: Activity },
  { code: 'temperature', label: 'Temperatura', description: 'En °C o °F', units: ['°C', '°F'], icon: Thermometer },
  { code: 'oxygen_saturation', label: 'Saturación', description: 'Porcentaje de SpO₂', unit: '%', icon: Gauge },
  { code: 'glucose', label: 'Glucosa', description: 'Elige la unidad medida', units: ['mg/dL', 'mmol/L'], icon: Droplet },
  { code: 'sleep', label: 'Sueño', description: 'Horas y minutos declarados', unit: 'h', icon: Moon },
]

const EMPTY_DRAFT = {
  value: '',
  systolic: '',
  diastolic: '',
  hours: '',
  minutes: '',
  unit: '',
  origin: '',
  context: '',
  measuredAt: '',
}

function localDateTimeNow() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

function requiredNumber(value, label) {
  if (String(value).trim() === '') throw new Error(`Completa ${label}.`)
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} debe ser un número igual o mayor que cero.`)
  return number
}

function createMessage(metric, draft) {
  if (metric === 'blood_pressure') {
    const systolic = requiredNumber(draft.systolic, 'la presión sistólica')
    const diastolic = requiredNumber(draft.diastolic, 'la presión diastólica')
    return `Presión ${systolic}/${diastolic} mmHg`
  }

  if (metric === 'sleep') {
    const hours = draft.hours === '' ? 0 : requiredNumber(draft.hours, 'las horas')
    const minutes = draft.minutes === '' ? 0 : requiredNumber(draft.minutes, 'los minutos')
    if (minutes > 59) throw new Error('Los minutos deben estar entre 0 y 59.')
    if (draft.hours === '' && draft.minutes === '') throw new Error('Completa las horas o los minutos de sueño.')
    const totalHours = Number((hours + minutes / 60).toFixed(2))
    return `Dormí ${totalHours} horas`
  }

  const value = requiredNumber(draft.value, 'el valor')
  if (metric === 'heart_rate') return `Pulso ${value} lpm`
  if (metric === 'oxygen_saturation') return `Saturación ${value} %`
  if (metric === 'temperature') {
    if (!draft.unit) throw new Error('Elige °C o °F.')
    return `Temperatura ${value} ${draft.unit}`
  }
  if (metric === 'glucose') {
    if (!draft.unit) throw new Error('Elige mg/dL o mmol/L.')
    return `Glucosa ${value} ${draft.unit}`
  }
  throw new Error('Elige un indicador para continuar.')
}

function StepIndicator({ step }) {
  return (
    <div className="registration-progress" aria-label={`Paso ${step} de 3`}>
      <div className="registration-progress__dots" aria-hidden="true">
        {[1, 2, 3].map((number) => <span key={number} className={number <= step ? 'is-active' : ''} />)}
      </div>
      <span>Paso {step} de 3</span>
    </div>
  )
}

export default function VitalsModal({ open, onClose, onSaved }) {
  const [step, setStep] = useState(1)
  const [metric, setMetric] = useState('')
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [proposal, setProposal] = useState(null)
  const [reply, setReply] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [savedEntries, setSavedEntries] = useState([])

  if (!open) return null

  const indicator = INDICATORS.find((item) => item.code === metric)
  const candidate = proposal?.candidate
  const lastSaved = savedEntries.at(-1)
  const savedByMetric = Object.fromEntries(savedEntries.map((entry) => [entry.candidate.metric, entry]))
  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }))

  const reset = () => {
    setStep(1)
    setMetric('')
    setDraft(EMPTY_DRAFT)
    setProposal(null)
    setReply(null)
    setError('')
    setBusy(false)
    setSavedEntries([])
  }

  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  const close = async () => {
    if (proposal) await discardPending().catch(() => {})
    reset()
    onClose()
  }

  const chooseMetric = (code) => {
    if (code !== metric) setDraft(EMPTY_DRAFT)
    setMetric(code)
    setReply(null)
    setError('')
    setStep(2)
  }

  const propose = (event) => {
    event.preventDefault()
    run(async () => {
      const text = createMessage(metric, draft)
      const data = await sendMessage(text)
      if (data.status !== 'needs_confirmation' || !data.pending_id) {
        setReply(data)
        return
      }
      setProposal(data)
      setReply(null)
      updateDraft('measuredAt', draft.measuredAt || localDateTimeNow())
      setStep(3)
    })
  }

  const editMeasurement = () => run(async () => {
    await discardPending().catch(() => {})
    setProposal(null)
    setStep(2)
  })

  const confirm = (event) => {
    event.preventDefault()
    run(async () => {
      let saved
      try {
        saved = await confirmPending({
          pending_id: proposal.pending_id,
          origin: draft.origin,
          context: draft.context,
          measured_at: new Date(draft.measuredAt).toISOString(),
        })
      } catch (caught) {
        if (caught.status === 409) {
          setProposal(null)
          setStep(2)
          throw new Error('La confirmación venció. Revisa el dato y vuelve a continuar.')
        }
        throw caught
      }
      setSavedEntries((current) => [...current, saved.entry])
      setStep(1)
      setMetric('')
      setDraft(EMPTY_DRAFT)
      setProposal(null)
      setReply(null)
      setError('')
      await onSaved()
    })
  }

  const renderValueFields = () => {
    if (metric === 'blood_pressure') {
      return (
        <div className="measurement-split">
          <label className="measurement-field">
            <span>Sistólica</span>
            <div><input type="number" min="0" step="any" inputMode="decimal" value={draft.systolic} onChange={(event) => updateDraft('systolic', event.target.value)} required autoFocus /><small>mmHg</small></div>
          </label>
          <span className="measurement-split__divider" aria-hidden="true">/</span>
          <label className="measurement-field">
            <span>Diastólica</span>
            <div><input type="number" min="0" step="any" inputMode="decimal" value={draft.diastolic} onChange={(event) => updateDraft('diastolic', event.target.value)} required /><small>mmHg</small></div>
          </label>
        </div>
      )
    }

    if (metric === 'sleep') {
      return (
        <div className="measurement-split measurement-split--sleep">
          <label className="measurement-field">
            <span>Horas</span>
            <div><input type="number" min="0" step="1" inputMode="numeric" value={draft.hours} onChange={(event) => updateDraft('hours', event.target.value)} autoFocus /><small>h</small></div>
          </label>
          <label className="measurement-field">
            <span>Minutos</span>
            <div><input type="number" min="0" max="59" step="1" inputMode="numeric" value={draft.minutes} onChange={(event) => updateDraft('minutes', event.target.value)} /><small>min</small></div>
          </label>
        </div>
      )
    }

    return (
      <>
        <label className="measurement-value">
          <span className="sr-only">Valor de {indicator.label}</span>
          <input type="number" min="0" step="any" inputMode="decimal" value={draft.value} onChange={(event) => updateDraft('value', event.target.value)} placeholder="—" required autoFocus />
          {indicator.unit && <small>{indicator.unit}</small>}
        </label>
        {indicator.units && (
          <div className="unit-selector" aria-label="Unidad de medida">
            {indicator.units.map((unit) => (
              <button type="button" key={unit} className={draft.unit === unit ? 'is-selected' : ''} aria-pressed={draft.unit === unit} onClick={() => updateDraft('unit', unit)}>{unit}</button>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && close()}>
      <div className="vitals-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="vitals-title">
        <button type="button" className="modal-close" onClick={close} aria-label="Cerrar registro" disabled={busy}><X /></button>

        <span className="section-title">REGISTRO MANUAL</span>
        <StepIndicator step={step} />

        {step === 1 && (
          <section>
            {lastSaved && (
              <div className="registration-success" role="status">
                <Check aria-hidden="true" />
                <span>Se guardó <strong>{METRIC_LABELS[lastSaved.candidate.metric]}</strong>: {formatValue(lastSaved.candidate)} {lastSaved.candidate.unit}</span>
              </div>
            )}
            <h2 id="vitals-title">{savedEntries.length ? '¿Qué más vas a registrar?' : '¿Qué vas a registrar?'}</h2>
            <p className="modal-intro">
              {savedEntries.length
                ? `Llevas ${savedEntries.length} ${savedEntries.length === 1 ? 'dato' : 'datos'} en esta ronda. Puedes añadir otro o terminar.`
                : 'Elige solo los indicadores que quieras registrar. Ninguno es obligatorio.'}
            </p>
            <div className="indicator-options">
              {INDICATORS.map(({ code, label, description, icon: Icon }) => {
                const savedEntry = savedByMetric[code]
                return (
                  <button type="button" key={code} className={savedEntry ? 'is-saved' : ''} onClick={() => chooseMetric(code)}>
                    {savedEntry ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}
                    <span>
                      <strong>{label}</strong>
                      <small>{savedEntry ? `${formatValue(savedEntry.candidate)} ${savedEntry.candidate.unit}` : description}</small>
                    </span>
                  </button>
                )
              })}
            </div>
            {savedEntries.length > 0 && (
              <>
                <button type="button" className="primary-button registration-finish" onClick={close}>Terminar</button>
                <p className="registration-optional">Los indicadores que no elijas quedarán sin registrar.</p>
              </>
            )}
          </section>
        )}

        {step === 2 && indicator && (
          <form onSubmit={propose}>
            <button type="button" className="modal-back" onClick={() => setStep(1)} disabled={busy}><ArrowLeft /> Volver</button>
            <h2 id="vitals-title">{indicator.label}</h2>
            <p className="modal-intro">Escribe exactamente lo que marcó el instrumento. No evaluamos si la cifra es normal.</p>

            <div className="measurement-entry">{renderValueFields()}</div>

            <label className="modal-field">
              <span>Instrumento u origen <b>Obligatorio</b></span>
              <input value={draft.origin} onChange={(event) => updateDraft('origin', event.target.value)} placeholder="Ej.: Pulsómetro, termómetro o dato declarado" minLength="2" maxLength="120" required />
            </label>
            <label className="modal-field">
              <span>Contexto <em>Opcional</em></span>
              <input value={draft.context} onChange={(event) => updateDraft('context', event.target.value)} placeholder="Ej.: En reposo, después de comer…" maxLength="500" />
            </label>

            {reply && <p className="modal-reply" role="status">{reply.message}</p>}
            {error && <p className="modal-error" role="alert">{error}</p>}
            <button className="primary-button modal-submit" type="submit" disabled={busy}>{busy ? 'Preparando revisión…' : 'Continuar'}</button>
          </form>
        )}

        {step === 3 && proposal && candidate && (
          <form onSubmit={confirm}>
            <button type="button" className="modal-back" onClick={editMeasurement} disabled={busy}><ArrowLeft /> Editar dato</button>
            <h2 id="vitals-title">Revisa y confirma</h2>
            <p className="modal-intro">Nada se guarda hasta que presiones “Guardar registro”.</p>

            <dl className="review-card">
              <div><dt>Indicador</dt><dd>{METRIC_LABELS[candidate.metric]}</dd></div>
              <div><dt>Valor</dt><dd>{formatValue(candidate)} {candidate.unit}</dd></div>
              <div><dt>Origen</dt><dd>{draft.origin}</dd></div>
              {draft.context && <div><dt>Contexto</dt><dd>{draft.context}</dd></div>}
              <div><dt>Fecha y hora</dt><dd>{formatWhen(new Date(draft.measuredAt).toISOString())}</dd></div>
            </dl>

            <label className="modal-field modal-field--date">
              <span>¿La medición fue en otro momento?</span>
              <input type="datetime-local" value={draft.measuredAt} max={localDateTimeNow()} onChange={(event) => updateDraft('measuredAt', event.target.value)} required />
            </label>

            {error && <p className="modal-error" role="alert">{error}</p>}
            <div className="modal-actions modal-actions--stacked">
              <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar registro'}</button>
              <button className="secondary-button" type="button" onClick={editMeasurement} disabled={busy}>Editar</button>
            </div>
            <p className="registration-next-hint">Al guardar volverás al menú para añadir otro indicador o terminar.</p>
          </form>
        )}
      </div>
    </div>
  )
}
