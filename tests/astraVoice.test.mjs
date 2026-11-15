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

function makeWorld({ api = {}, supported = true, reason = '' } = {}) {
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

test('flujo completo: Astra -> lectura -> origen -> sí -> guardado', async () => {
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
  assert.equal(engine.getState().status, STATUS.AWAIT_ORIGIN)
  assert.match(spoken.at(-1), /pulso 82 latidos por minuto/)
  assert.match(spoken.at(-1), /instrumento o de qué origen/)
  assert.equal(calls.confirmPending.length, 0)

  bag.current.say('pulsómetro de muñeca')
  await tick()
  assert.equal(engine.getState().status, STATUS.AWAIT_CONFIRM)
  assert.match(spoken.at(-1), /origen pulsómetro de muñeca/)
  assert.match(spoken.at(-1), /¿Lo confirmas\?/)

  bag.current.say('sí')
  await tick()
  assert.equal(calls.confirmPending.length, 1)
  assert.equal(calls.confirmPending[0].origin, 'pulsómetro de muñeca')
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
  bag.current.say('pulsómetro')
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
  bag.current.say('pulsómetro')
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
  assert.equal(engine.getState().status, STATUS.AWAIT_ORIGIN)
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
  bag.current.say('pulsómetro')
  await tick()
  bag.current.say('sí')
  await tick()
  assert.deepEqual(calls.saved, [])
  assert.match(spoken.at(-1), /venció/)
  assert.match(spoken.at(-1), /no guardé nada/)
  assert.equal(engine.getState().status, STATUS.LISTENING)
})
