import { useState } from 'react'
import { X } from 'lucide-react'
import { confirmPending, discardPending, sendMessage } from '../../api/client'
import { METRIC_LABELS, formatValue } from '../../data/format'

const EXAMPLES = ['Pulso 82 lpm', 'Presión 120/80 mmHg', 'Temperatura 37,2 °C', 'Saturación 97 %', 'Glucosa 90 mg/dL', 'Dormí 6 horas']

const EMPTY_REVIEW = { origin: '', context: '', measuredAt: '' }

export default function VitalsModal({ open, onClose, onSaved }) {
  const [text, setText] = useState('')
  const [proposal, setProposal] = useState(null) // respuesta de /messages con candidato pendiente
  const [reply, setReply] = useState(null) // aviso, aclaración o información sin candidato
  const [review, setReview] = useState(EMPTY_REVIEW)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return null

  const reset = () => {
    setText(''); setProposal(null); setReply(null); setReview(EMPTY_REVIEW); setError('')
  }

  const run = async (action) => {
    setBusy(true)
    setError('')
    try { await action() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const close = async () => {
    // Una propuesta sin confirmar no se guarda: se descarta también en el servidor.
    if (proposal) await discardPending().catch(() => {})
    reset()
    onClose()
  }

  const propose = (event) => {
    event.preventDefault()
    run(async () => {
      const data = await sendMessage(text)
      if (data.status === 'needs_confirmation' && data.pending_id) { setProposal(data); setReply(null) }
      else { setProposal(null); setReply(data) }
    })
  }

  const confirm = (event) => {
    event.preventDefault()
    run(async () => {
      try {
        await confirmPending({
          pending_id: proposal.pending_id,
          origin: review.origin,
          context: review.context,
          ...(review.measuredAt ? { measured_at: new Date(review.measuredAt).toISOString() } : {}),
        })
      } catch (e) {
        if (e.status === 409) { setProposal(null); throw new Error(`${e.message}`) }
        throw e
      }
      reset()
      onClose()
      await onSaved()
    })
  }

  const discard = () => run(async () => {
    await discardPending()
    setProposal(null)
    setReply({ status: 'information', message: 'Propuesta descartada. No se guardó nada.' })
  })

  const candidate = proposal?.candidate

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="vitals-modal glass-panel" role="dialog" aria-modal="true" aria-labelledby="vitals-title">
        <button type="button" className="modal-close" onClick={close} aria-label="Cerrar"><X /></button>
        <span className="section-title">{proposal ? 'REVISIÓN ANTES DE GUARDAR' : 'REGISTRO MANUAL'}</span>
        <h2 id="vitals-title">{proposal ? 'Confirma el registro' : 'Registrar un indicador'}</h2>

        {!proposal && (
          <form onSubmit={propose}>
            <p>Escribe la lectura real de un instrumento. Nada se guarda hasta que lo revises y confirmes.</p>
            <input
              className="modal-text" value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Ej.: Pulso 82 lpm" maxLength={2000} required autoFocus
            />
            <div className="modal-examples">
              {EXAMPLES.map((example) => <button type="button" key={example} onClick={() => setText(example)}>{example}</button>)}
            </div>
            {reply && <p className={`modal-reply ${reply.status === 'safety_notice' ? 'modal-reply--urgent' : ''}`} role="status">{reply.message}</p>}
            <button className="primary-button modal-submit" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Revisar'}</button>
          </form>
        )}

        {proposal && (
          <form onSubmit={confirm}>
            <p>Texto original: «{candidate.original_text}». Este prototipo no valida si la cifra es normal.</p>
            <dl className="review-card">
              <div><dt>Indicador</dt><dd>{METRIC_LABELS[candidate.metric] ?? 'Síntoma'}</dd></div>
              {candidate.kind === 'measurement' && (
                <div><dt>Valor</dt><dd>{formatValue(candidate)} {candidate.unit}</dd></div>
              )}
            </dl>
            <label className="modal-field"><span>Origen de la lectura (obligatorio)</span>
              <input value={review.origin} onChange={(e) => setReview({ ...review, origin: e.target.value })} placeholder="Ej.: Pulsómetro ficticio" minLength={2} maxLength={120} required />
            </label>
            <label className="modal-field"><span>Contexto (opcional)</span>
              <input value={review.context} onChange={(e) => setReview({ ...review, context: e.target.value })} maxLength={500} />
            </label>
            <label className="modal-field"><span>Fecha de medición (opcional; por defecto, ahora)</span>
              <input type="datetime-local" value={review.measuredAt} onChange={(e) => setReview({ ...review, measuredAt: e.target.value })} />
            </label>
            <div className="modal-actions">
              <button className="primary-button" type="submit" disabled={busy}>Confirmar y guardar</button>
              <button className="secondary-button" type="button" onClick={discard} disabled={busy}>Descartar</button>
            </div>
          </form>
        )}

        {error && <p className="modal-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}
