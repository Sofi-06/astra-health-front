import { useEffect, useRef, useState } from 'react'
import { Ear, Mic, MicOff, Power, Volume2, VolumeX, X } from 'lucide-react'
import { createAstraVoice, STATUS } from '../../voice/astraVoice'
import { createBrowserSpeech } from '../../voice/speech'
import { confirmPending, discardPending, sendMessage } from '../../api/client'

const MUTE_KEY = 'astra-voice-muted'

const STATUS_LABEL = {
  [STATUS.OFF]: 'Astra voz apagada',
  [STATUS.UNSUPPORTED]: 'Voz no disponible aquí',
  [STATUS.STARTING]: 'Preparando el micrófono…',
  [STATUS.WAKE]: 'Escuchando: di "Astra"',
  [STATUS.GREETING]: 'Astra te responde…',
  [STATUS.LISTENING]: 'Escuchando tu turno…',
  [STATUS.THINKING]: 'Astra está procesando…',
  [STATUS.SPEAKING]: 'Astra está hablando…',
  [STATUS.AWAIT_ORIGIN]: 'Falta el instrumento u origen',
  [STATUS.AWAIT_CONFIRM]: 'Confirma por voz: sí o no',
  [STATUS.ERROR]: 'Error de voz',
}

const ACTIVE = new Set([
  STATUS.WAKE, STATUS.GREETING, STATUS.LISTENING, STATUS.THINKING,
  STATUS.SPEAKING, STATUS.AWAIT_ORIGIN, STATUS.AWAIT_CONFIRM,
])

// Panel de la conversación de voz de Astra. El micrófono solo se usa mientras
// el modo está activo y la pestaña abierta; ninguna lectura se guarda sin la
// confirmación hablada de la usuaria (origen + sí explícito).
export default function AstraVoicePanel({ onNotify, onSaved }) {
  const [open, setOpen] = useState(false)
  const [snap, setSnap] = useState({ status: STATUS.OFF, detail: '', lastUserText: '', lastAstraText: '' })
  const [muted, setMuted] = useState(() => {
    try { return sessionStorage.getItem(MUTE_KEY) === '1' } catch { return false }
  })
  const engineRef = useRef(null)
  const mutedRef = useRef(muted)
  const onSavedRef = useRef(onSaved)

  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { onSavedRef.current = onSaved }, [onSaved])

  useEffect(() => {
    const speech = createBrowserSpeech({ isMuted: () => mutedRef.current })
    const engine = createAstraVoice({
      speech,
      api: { sendMessage, confirmPending, discardPending },
      onUpdate: setSnap,
      onSaved: (count) => onSavedRef.current?.(count),
    })
    engineRef.current = engine
    return () => {
      engine.stop()
      engineRef.current = null
    }
  }, [])

  const toggleMuted = () => {
    const next = !muted
    setMuted(next)
    try { sessionStorage.setItem(MUTE_KEY, next ? '1' : '0') } catch { /* sin almacenamiento */ }
    if (next) engineRef.current?.skipSpeech()
  }

  const activate = () => {
    setOpen(true)
    engineRef.current?.start()
  }

  const deactivate = () => {
    engineRef.current?.stop()
    onNotify?.('Astra voz apagada. El micrófono quedó libre.')
  }

  const isActive = ACTIVE.has(snap.status)
  const speakingNow = snap.status === STATUS.SPEAKING || snap.status === STATUS.GREETING

  return (
    <div className={`astra-voice ${isActive ? 'astra-voice--active' : ''}`}>
      {open && (
        <section className="astra-voice__panel glass-panel" aria-label="Conversación de voz con Astra">
          <header className="astra-voice__head">
            <strong>Astra voz</strong>
            <button type="button" className="astra-voice__icon-btn" onClick={() => setOpen(false)} aria-label="Ocultar panel de voz">
              <X size={14} />
            </button>
          </header>

          <p className={`astra-voice__status astra-voice__status--${snap.status}`} role="status">
            <span className="astra-voice__dot" aria-hidden="true" />
            {STATUS_LABEL[snap.status] || snap.status}
          </p>
          {snap.detail && <p className="astra-voice__detail">{snap.detail}</p>}

          {(snap.lastUserText || snap.lastAstraText) && (
            <div className="astra-voice__exchange" aria-live="polite">
              {snap.lastUserText && <p><span>Tú:</span> {snap.lastUserText}</p>}
              {snap.lastAstraText && <p><span>Astra:</span> {snap.lastAstraText}</p>}
            </div>
          )}

          {snap.pendingSummary && (
            <p className="astra-voice__pending">Pendiente de tu confirmación: {snap.pendingSummary}</p>
          )}

          <div className="astra-voice__controls">
            {snap.status === STATUS.OFF && (
              <button type="button" className="primary-button astra-voice__main" onClick={activate}>
                <Mic size={14} /> Activar Astra
              </button>
            )}
            {snap.status === STATUS.ERROR && (
              <button type="button" className="primary-button astra-voice__main" onClick={activate}>
                <Mic size={14} /> Reintentar
              </button>
            )}
            {isActive && (
              <>
                <button
                  type="button"
                  className="secondary-button astra-voice__ctrl"
                  onClick={() => engineRef.current?.talk()}
                  disabled={snap.status === STATUS.THINKING}
                >
                  <Ear size={13} /> Hablar ahora
                </button>
                {speakingNow && (
                  <button type="button" className="secondary-button astra-voice__ctrl" onClick={() => engineRef.current?.skipSpeech()}>
                    <VolumeX size={13} /> Silenciar
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button astra-voice__ctrl"
                  onClick={toggleMuted}
                  aria-pressed={muted}
                >
                  {muted ? <VolumeX size={13} /> : <Volume2 size={13} />} {muted ? 'Voz apagada' : 'Voz activa'}
                </button>
                <button type="button" className="secondary-button astra-voice__ctrl astra-voice__ctrl--off" onClick={deactivate}>
                  <Power size={13} /> Apagar Astra
                </button>
              </>
            )}
          </div>

          <p className="astra-voice__hint">
            Escucha solo con esta pestaña abierta y la pantalla activa; no escucha con la pestaña
            cerrada ni el celular bloqueado. El reconocimiento lo hace el servicio de voz del
            navegador y puede necesitar internet. Nada se guarda sin tu confirmación por voz, y
            las urgencias no se derivan solas: Astra solo avisa, no alerta a nadie.
          </p>
        </section>
      )}

      <button
        type="button"
        className={`astra-voice__fab ${isActive ? 'is-on' : ''}`}
        onClick={() => (open ? setOpen(false) : (isActive ? setOpen(true) : activate()))}
        aria-label={isActive ? 'Abrir panel de voz de Astra' : 'Activar Astra por voz'}
        aria-expanded={open}
      >
        {isActive ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
    </div>
  )
}
