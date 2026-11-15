// Pruebas del motor de voz de Astra con reconocimiento y síntesis simulados.
// Corren con `node --test tests/` (Node 22), sin dependencias nuevas.

/* global setTimeout */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createAstraVoice,
  containsWakeWord,
  describeCandidate,
  isAffirmative,
  isExit,
  isNegative,
  normalize,
  STATUS,
} from '../src/voice/astraVoice.js'

const tick = async (rounds = 8) => {
  for (let i = 0; i < rounds; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

class FakeRec {
  constructor(mode, bag) {
    this.mode = mode
    this.bag = bag
    this.started = false
    this.stopped = false
  }

  start() {
    this.started = true
    this.bag.current = this
  }

  stop() {
    this.stopped = true
  }

  say(text, { isFinal = true } = {}) {
    this.onresult?.({ isFinal, transcript: text })
  }

  end() {
    this.onend?.()
  }

  fail(error) {
    this.onerror?.({ error })
  }
}

function makeWorld({ api = {}, supported = true, reason = '', autoSave = false, settleMs = 0 } = {}) {
  const bag = { current: null, created: [] }
  const spoken = []
  const calls = {
    sendMessage: [],
    confirmPending: [],
    discardPending: 0,
    saved: [],
  }
  const { sendMessage: sendImpl, confirmPending: confirmImpl, discardPending: discardImpl } = api
  const apiDefaults = {
    sendMessage: async (text) => {
      calls.sendMessage.push(text)
      if (sendImpl) return sendImpl(text)
      return { status: 'information', message: 'Respuesta de prueba.' }
    },
    confirmPending: async (payload) => {
      calls.confirmPending.push(payload)
      if (confirmImpl) return confirmImpl(payload)
      return { status: 'recorded', message: 'Registro confirmado en SQLite local.', entries: [{}] }
    },
    discardPending: async () => {
      calls.discardPending += 1
      if (discardImpl) return discardImpl()
    },
  }
  const engine = createAstraVoice({
    speech: {
      supported,
      reason,
      createRecognition: (mode) => {
        const rec = new FakeRec(mode, bag)
        bag.created.push(rec)
        return rec
      },
      speak: async (text) => { spoken.push(text) },
      stopSpeaking: () => {},
    },
    api: apiDefaults,
    onSaved: (count) => calls.saved.push(count),
    wakeRestartMs: 1,
    autoSave,
    settleMs,
  })
  return { engine, bag, spoken, calls }
}

const measurementReply = {
  status: 'needs_confirmation',
  pending_id: '11111111-1111-1111-1111-111111111111',
  message: 'Confirma tu lectura.',
  candidate: { kind: 'measurement', metric: 'heart_rate', values: [82], unit: 'lpm' },
}

test('normalize, wake word y clasificadores de sí/no', () => {
  assert.equal(normalize(' ¡Sí,  guárdalo! '), 'si guardalo')
  assert.ok(containsWakeWord('Astra'))
  assert.ok(containsWakeWord('oye astra, ¿estás ahí?'))
  assert.ok(!containsWakeWord('hasta mañana'))
  assert.ok(!containsWakeWord('astronauta'))
  assert.ok(isAffirmative('sí') && isAffirmative('confirmo') && isAffirmative('sí, guárdalo'))
  assert.ok(!isAffirmative('no') && !isAffirmative('no lo guardes'))
  assert.ok(isNegative('no') && isNegative('descártalo') && isNegative('no lo guardes'))
  assert.ok(isExit('apagar') && isExit('hasta luego') && isExit('apaga Astra'))
  assert.ok(!isExit('pulso ochenta y dos'))
})

test('describeCandidate habla sin evaluar la cifra', () => {
  assert.equal(
    describeCandidate({ kind: 'measurement', metric: 'heart_rate', values: [82], unit: 'lpm' }),
    'pulso 82 latidos por minuto',
  )
  assert.equal(
    describeCandidate({ kind: 'measurement', metric: 'blood_pressure', values: [120, 80], unit: 'mmHg' }),
    'presión arterial 120 sobre 80 milímetros de mercurio',
  )
  assert.match(
    describeCandidate({ kind: 'batch', measurements: [{ kind: 'measurement', metric: 'temperature', values: [37], unit: '°C' }] }),
    /^1 lecturas: temperatura 37 grados Celsius$/,
  )
  assert.match(describeCandidate({ kind: 'symptom', original_text: 'mareo leve' }), /síntoma o comentario/)
})

test('sin soporte de voz lo dice y no intenta escuchar', () => {
  const { engine, bag } = makeWorld({ supported: false, reason: 'sin voz' })
  engine.start()
  assert.equal(engine.getState().status, STATUS.UNSUPPORTED)
  assert.equal(engine.getState().detail, 'sin voz')
  assert.equal(bag.created.length, 0)
})

test('flujo completo: Astra -> lectura -> sí -> guardado (el instrumento es opcional)', async () => {
  const { engine, bag, spoken, calls } = makeWorld({
    api: { sendMessage: async () => measurementReply },
  })
  engine.start()
  await tick()
  assert.equal(engine.getState().status, STATUS.WAKE)

  bag.current.say('Astra')
  await tick()
  assert.equal(spoken[0], 'Lista para escucharte.')
  assert.equal(engine.getState().status, STATUS.LISTENING)

  bag.current.say('pulso ochenta y dos')
  await tick()
  assert.deepEqual(calls.sendMessage, ['pulso ochenta y dos'])
  assert.equal(engine.getState().status, STATUS.AWAIT_CONFIRM)
  assert.match(spoken.at(-1), /pulso 82 latidos por minuto/)
  assert.match(spoken.at(-1), /¿Lo guardo\?/)
  assert.doesNotMatch(spoken.at(-1), /instrumento/)
  assert.equal(calls.confirmPending.length, 0)

  bag.current.say('sí')
  await tick()
  assert.equal(calls.confirmPending.length, 1)
  assert.equal(calls.confirmPending[0].origin, '')
  assert.equal(calls.confirmPending[0].pending_id, measurementReply.pending_id)
  assert.ok(calls.confirmPending[0].measured_at)
  assert.deepEqual(calls.saved, [1])
  assert.match(spoken.at(-1), /Registro confirmado/)
  assert.equal(engine.getState().status, STATUS.LISTENING)
})

test('respuesta "no" descarta y no guarda nada', async () => {
  const { engine, bag, spoken, calls } = makeWorld({
    api: { sendMessage: async () => measurementReply },
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('pulso 82')
  await tick()
  bag.current.say('no')
  await tick()
  assert.equal(calls.confirmPending.length, 0)
  assert.equal(calls.discardPending, 1)
  assert.match(spoken.at(-1), /no guardé nada/)
  assert.equal(engine.getState().status, STATUS.LISTENING)
})

test('si no entiende el sí/no dos veces, descarta por seguridad', async () => {
  const { engine, bag, spoken, calls } = makeWorld({
    api: { sendMessage: async () => measurementReply },
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('pulso 82')
  await tick()
  bag.current.say('quizás')
  await tick()
  assert.equal(calls.confirmPending.length, 0)
  assert.match(spoken.at(-1), /Di sí o no/)
  bag.current.say('no sé')
  await tick()
  assert.equal(calls.discardPending, 1)
  assert.match(spoken.at(-1), /por seguridad no guardé nada/)
})

test('aviso de seguridad se dice tal cual y la conversación sigue', async () => {
  const urgent = 'Si es una emergencia usa el protocolo de la misión. No he avisado a nadie.'
  const { engine, bag, spoken, calls } = makeWorld({
    api: { sendMessage: async () => ({ status: 'safety_notice', message: urgent }) },
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('me duele el pecho y me falta el aire')
  await tick()
  assert.ok(spoken.includes(urgent))
  assert.equal(calls.confirmPending.length, 0)
  assert.equal(engine.getState().status, STATUS.LISTENING)
})

test('aclaración: la respuesta de Astra se escucha y el siguiente audio es otro mensaje', async () => {
  let round = 0
  const { engine, bag, spoken, calls } = makeWorld({
    api: {
      sendMessage: async () => {
        round += 1
        return round === 1
          ? { status: 'needs_clarification', message: '¿En qué unidad mediste?' }
          : measurementReply
      },
    },
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('temperatura 37')
  await tick()
  assert.ok(spoken.includes('¿En qué unidad mediste?'))
  bag.current.say('grados celsius')
  await tick()
  assert.deepEqual(calls.sendMessage, ['temperatura 37', 'grados celsius'])
  assert.equal(engine.getState().status, STATUS.AWAIT_CONFIRM)
})

test('palabra de salida con lectura pendiente la descarta y vuelve al modo Astra', async () => {
  const { engine, bag, spoken, calls } = makeWorld({
    api: { sendMessage: async () => measurementReply },
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('pulso 82')
  await tick()
  bag.current.say('hasta luego')
  await tick()
  assert.equal(calls.discardPending, 1)
  assert.equal(calls.confirmPending.length, 0)
  assert.match(spoken.at(-1), /no guardé nada pendiente/)
  assert.equal(engine.getState().status, STATUS.WAKE)
})

test('apagar libera el micrófono y corta el flujo', async () => {
  const { engine, bag } = makeWorld()
  engine.start()
  await tick()
  const wakeRec = bag.current
  engine.stop()
  assert.equal(engine.getState().status, STATUS.OFF)
  assert.ok(wakeRec.stopped)
  wakeRec.say('Astra')
  await tick()
  assert.equal(engine.getState().status, STATUS.OFF)
})

test('permiso de micrófono denegado se reporta sin reintentar', async () => {
  const { engine, bag } = makeWorld()
  engine.start()
  await tick()
  bag.current.fail('not-allowed')
  await tick()
  assert.equal(engine.getState().status, STATUS.ERROR)
  assert.match(engine.getState().detail, /Permiso de micrófono denegado/)
})

test('confirmación vencida (409) no guarda y vuelve a escuchar', async () => {
  const error = new Error('La propuesta venció.')
  error.status = 409
  const { engine, bag, spoken, calls } = makeWorld({
    api: {
      sendMessage: async () => measurementReply,
      confirmPending: async () => { throw error },
    },
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('pulso 82')
  await tick()
  bag.current.say('sí')
  await tick()
  assert.deepEqual(calls.saved, [])
  assert.match(spoken.at(-1), /venció/)
  assert.match(spoken.at(-1), /no guardé nada/)
  assert.equal(engine.getState().status, STATUS.LISTENING)
})

const fullReply = {
  status: 'needs_confirmation',
  pending_id: '22222222-2222-2222-2222-222222222222',
  message: 'Confirma tu lectura.',
  candidate: {
    kind: 'measurement', metric: 'temperature', values: [40], unit: '°C',
    suggested_origin: 'Termómetro', suggested_measured_at: '2026-11-15T12:42',
    explicit_origin: true, explicit_time: true,
  },
}

test('si dice valor, instrumento y hora, se guarda de una vez sin preguntar', async () => {
  const { engine, bag, spoken, calls } = makeWorld({ api: { sendMessage: async () => fullReply }, autoSave: true })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('tengo una temperatura de 40 grados centígrados con un termómetro a las 12 y 42 pm')
  await tick()
  assert.equal(calls.confirmPending.length, 1)
  assert.equal(calls.confirmPending[0].origin, 'Termómetro')
  assert.equal(calls.confirmPending[0].pending_id, fullReply.pending_id)
  assert.equal(calls.confirmPending[0].measured_at, new Date('2026-11-15T12:42').toISOString())
  assert.deepEqual(calls.saved, [1])
  assert.match(spoken.at(-1), /ya guardé temperatura 40/)
  assert.match(spoken.at(-1), /Termómetro/)
  assert.equal(engine.getState().status, STATUS.LISTENING)
})

test('si dijo el instrumento pero no la hora, solo pide confirmar', async () => {
  const reply = { ...fullReply, candidate: { ...fullReply.candidate, explicit_time: false } }
  const { engine, bag, spoken, calls } = makeWorld({ api: { sendMessage: async () => reply } })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('temperatura 40 grados con un termómetro')
  await tick()
  assert.equal(calls.confirmPending.length, 0)
  assert.equal(engine.getState().status, STATUS.AWAIT_CONFIRM)
  assert.match(spoken.at(-1), /medido con Termómetro\. ¿Lo guardo\?/)
  bag.current.say('sí')
  await tick()
  assert.equal(calls.confirmPending[0].origin, 'Termómetro')
})

test('si guardar de una vez falla por hora futura, sigue con la confirmación normal', async () => {
  const { engine, bag, spoken, calls } = makeWorld({
    autoSave: true,
    api: {
      sendMessage: async () => fullReply,
      confirmPending: async () => { throw Object.assign(new Error('La fecha de medición no puede estar en el futuro.'), { status: 422 }) },
    },
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('temperatura 40 con un termómetro a las 11 pm')
  await tick()
  assert.deepEqual(calls.saved, [])
  assert.equal(engine.getState().status, STATUS.AWAIT_CONFIRM)
  assert.match(spoken.at(-1), /¿Lo guardo\?/)
})

const batchReply = {
  status: 'needs_confirmation',
  pending_id: '33333333-3333-3333-3333-333333333333',
  message: 'Confirma tus lecturas.',
  candidate: {
    kind: 'batch',
    measurements: [
      { kind: 'measurement', metric: 'heart_rate', values: [80], unit: 'lpm' },
      { kind: 'measurement', metric: 'temperature', values: [37], unit: '°C' },
    ],
    explicit_origin: false,
    explicit_time: false,
  },
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('varias lecturas seguidas se juntan tras 3 s de silencio y se guardan de una vez', async () => {
  const { engine, bag, spoken, calls } = makeWorld({
    api: { sendMessage: async () => batchReply },
    autoSave: true,
    settleMs: 60,
  })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()

  bag.current.say('pulso 80 lpm')
  await wait(25)
  assert.equal(calls.sendMessage.length, 0, 'sigue esperando: aún no pasó la ventana de silencio')
  bag.current.say('temperatura 37 grados centígrados')
  await wait(40)
  assert.equal(calls.sendMessage.length, 0, 'hablar de nuevo reinicia la ventana')

  await wait(80)
  await tick()
  assert.deepEqual(calls.sendMessage, ['pulso 80 lpm temperatura 37 grados centígrados'])
  assert.equal(calls.confirmPending.length, 1)
  assert.equal(calls.confirmPending[0].origin, 'Dato declarado por voz')
  assert.deepEqual(calls.saved, [1])
  assert.match(spoken.at(-1), /ya guardé 2 lecturas: pulso 80 latidos por minuto, temperatura 37 grados Celsius/)
  assert.match(spoken.at(-1), /seguir con más mediciones/)
  assert.equal(engine.getState().status, STATUS.LISTENING)
})

test('un síntoma dictado no se guarda solo: pide confirmación, no el instrumento', async () => {
  const symptom = {
    status: 'needs_confirmation',
    pending_id: '44444444-4444-4444-4444-444444444444',
    message: 'Revisa.',
    candidate: { kind: 'symptom', original_text: 'me duele la cabeza' },
  }
  const { engine, bag, calls } = makeWorld({ api: { sendMessage: async () => symptom }, autoSave: true })
  engine.start()
  await tick()
  bag.current.say('Astra')
  await tick()
  bag.current.say('me duele la cabeza')
  await tick()
  assert.equal(calls.confirmPending.length, 0)
  assert.equal(engine.getState().status, STATUS.AWAIT_CONFIRM)
})
