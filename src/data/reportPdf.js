import { formatValue, localDateKey, METRIC_LABELS } from './format'

const CHART_METRICS = [
  { code: 'heart_rate', color: [34, 211, 238] },
  { code: 'blood_pressure', color: [251, 146, 60] },
  { code: 'oxygen_saturation', color: [247, 199, 106] },
  { code: 'temperature', color: [242, 135, 183] },
  { code: 'glucose', color: [192, 132, 252] },
  { code: 'sleep', color: [56, 189, 248] },
  { code: 'muscle_mass', color: [72, 229, 237] },
]

const METRIC_LABELS_EN = {
  heart_rate: 'Heart rate',
  blood_pressure: 'Blood pressure',
  oxygen_saturation: 'Oxygen saturation',
  temperature: 'Temperature',
  glucose: 'Glucose',
  sleep: 'Reported sleep',
  muscle_mass: 'Muscles',
}
const METRIC_EN = {
  heart_rate: 'Heart rate', blood_pressure: 'Blood pressure', oxygen_saturation: 'Oxygen saturation',
  temperature: 'Temperature', glucose: 'Glucose', sleep: 'Sleep', muscle_mass: 'Muscles',
}
const MOOD_EN = { Cansado: 'Tired', Tranquilo: 'Calm', Tenso: 'Tense', 'Con energía': 'Energetic', Nostálgico: 'Nostalgic' }
const SCALES = [
  ['stress', 'Estrés', 'Stress'], ['isolation', 'Aislamiento', 'Isolation'], ['concentration', 'Concentración', 'Concentration'],
  ['energy', 'Energía', 'Energy'], ['sleep_difficulty', 'Dificultad para dormir', 'Trouble sleeping'],
]

const clean = (text) => Array.from(String(text ?? ''))
  .filter((ch) => { const c = ch.charCodeAt(0); return c === 10 || (c >= 32 && c <= 126) || (c >= 161 && c <= 255) })
  .join('').replace(/\s+/g, ' ').trim()
const pad2 = (n) => String(n).padStart(2, '0')

function periodStart(range, now) {
  if (range === 1) return now - 24 * 3600000
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (range - 1))
  return d.getTime()
}

// Cubetas para la gráfica de síntomas: 24 horas por hora, o un día por cubeta.
function buildBins(range, now) {
  if (range === 1) {
    return Array.from({ length: 24 }, (_, i) => {
      const end = now - (23 - i) * 3600000
      return { start: end - 3600000, end, label: pad2(new Date(end).getHours()) + 'h', count: 0 }
    })
  }
  return Array.from({ length: range }, (_, i) => {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (range - 1 - i))
    const start = d.getTime()
    return { start, end: start + 86400000, label: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`, count: 0 }
  })
}

export async function downloadReportPdf({ entries, range, language = 'es', userName = '', checkIns = [] }) {
  const { jsPDF } = await import('jspdf')
  const en = language === 'en'
  const tr = (es, enText) => clean(en ? enText : es)
  const now = Date.now()
  const start = periodStart(range, now)
  const periodLabel = range === 1 ? tr('Últimas 24 horas', 'Last 24 hours') : tr(`Últimos ${range} días`, `Last ${range} days`)

  const inPeriod = entries.filter((e) => new Date(e.measured_at).getTime() >= start)
  const symptoms = inPeriod.filter((e) => e.candidate?.kind === 'symptom')
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
  const measurements = inPeriod.filter((e) => e.candidate?.kind === 'measurement')
  const latestByMetric = new Map()
  measurements.forEach((entry) => {
    const code = entry.candidate.metric
    if (!latestByMetric.has(code) || entry.measured_at > latestByMetric.get(code).measured_at) latestByMetric.set(code, entry)
  })
  const latestMeasurements = CHART_METRICS.map(({ code, color }) => ({ code, color, entry: latestByMetric.get(code) })).filter((item) => item.entry)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const M = 15
  const CW = W - M * 2
  let y = M

  const ensure = (needed) => {
    if (y + needed > 285) { doc.addPage(); y = M }
  }
  const heading = (text) => {
    ensure(14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(14, 80, 120)
    doc.text(clean(text), M, y)
    doc.setDrawColor(14, 80, 120); doc.setLineWidth(0.3); doc.line(M, y + 1.5, W - M, y + 1.5)
    y += 8
  }
  const paragraph = (text, size = 9.5, color = [60, 60, 60]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...color)
    const lines = doc.splitTextToSize(clean(text), CW)
    lines.forEach((line) => { ensure(5); doc.text(line, M, y); y += 4.6 })
  }

  // Encabezado
  doc.setFillColor(8, 33, 62); doc.rect(0, 0, W, 30, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  doc.text('ASTRA HEALTH', M, 14)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text(tr('Informe de salud en el espacio', 'Space health report'), M, 21)
  doc.setFontSize(8.5)
  doc.text(`${periodLabel} · ${tr('Generado', 'Generated')} ${new Date(now).toLocaleString(en ? 'en-US' : 'es-CO')}${userName ? ` · ${clean(userName)}` : ''}`, M, 26.5)
  y = 40

  // Resumen
  heading(tr('Resumen del periodo', 'Period summary'))
  paragraph(tr(
    `Mediciones confirmadas: ${measurements.length}. Síntomas o contextos declarados: ${symptoms.length}.`,
    `Confirmed measurements: ${measurements.length}. Reported symptoms or context: ${symptoms.length}.`,
  ))
  y += 3

  // Tarjetas con la lectura más reciente de cada indicador.
  heading(tr('Métricas actuales', 'Current metrics'))
  if (latestMeasurements.length === 0) {
    paragraph(tr('No hay métricas confirmadas en este periodo.', 'No confirmed metrics in this period.'))
  } else {
    const columns = 3
    const gap = 4
    const cardW = (CW - gap * (columns - 1)) / columns
    const cardH = 25
    const rows = Math.ceil(latestMeasurements.length / columns)
    ensure(rows * (cardH + gap) + 2)
    latestMeasurements.forEach(({ code, color, entry }, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      const x = M + col * (cardW + gap)
      const top = y + row * (cardH + gap)
      const label = en ? METRIC_LABELS_EN[code] || code : METRIC_LABELS[code] || code
      doc.setFillColor(246, 250, 253)
      doc.setDrawColor(...color)
      doc.setLineWidth(0.45)
      doc.roundedRect(x, top, cardW, cardH, 2.2, 2.2, 'FD')
      doc.setFillColor(...color)
      doc.roundedRect(x + 4, top + 4, 3, 3, 0.7, 0.7, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(55, 75, 90)
      doc.text(clean(label).toUpperCase(), x + 9, top + 7)
      doc.setFontSize(14); doc.setTextColor(...color)
      doc.text(`${clean(formatValue(entry.candidate))} ${clean(entry.candidate.unit)}`, x + 4, top + 15)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(110, 125, 135)
      doc.text(`${tr('Registrado', 'Recorded')} ${new Date(entry.measured_at).toLocaleString(en ? 'en-US' : 'es-CO', { dateStyle: 'short', timeStyle: 'short' })}`, x + 4, top + 21)
    })
    y += rows * (cardH + gap) + 1
  }
  y += 3

  heading(tr('Recomendaciones y seguimiento', 'Recommendations and follow-up'))
  const recommendations = latestMeasurements.filter(({ entry }) => entry.recommendation?.text || entry.recommendation?.text_en)
  if (recommendations.length === 0) {
    paragraph(tr('Continúa registrando tus mediciones con su contexto para mantener un historial útil.', 'Continue recording measurements with their context to maintain a useful history.'))
  } else {
    recommendations.forEach(({ code, entry }) => {
      const label = en ? METRIC_LABELS_EN[code] || code : METRIC_LABELS[code] || code
      const text = en ? entry.recommendation.text_en || entry.recommendation.text : entry.recommendation.text
      const color = entry.recommendation.out_of_range ? [180, 72, 32] : [35, 95, 120]
      paragraph(`${label}: ${text}`, 8.8, color)
      y += 1.5
    })
  }
  paragraph(tr('Orientación general basada en reglas visibles; no es un diagnóstico.', 'General guidance based on visible rules; it is not a diagnosis.'), 7.8, [120, 120, 120])
  // Resumen de lo observado: descripción calculada solo con los registros del periodo.
  const num = (n) => { const v = String(Math.round(n * 10) / 10); return en ? v : v.replace('.', ',') }
  const dayLabel = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(en ? 'en-US' : 'es-CO', { day: '2-digit', month: '2-digit' })
  const bullet = (text, color = [50, 50, 50]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...color)
    const lines = doc.splitTextToSize(clean(text), CW - 5)
    lines.forEach((line, i) => { ensure(5); if (i === 0) doc.text('-', M, y); doc.text(line, M + 4, y); y += 4.6 })
    y += 0.8
  }

  heading(tr('Resumen de lo observado', 'What was observed'))
  const recordedDays = new Set([...inPeriod.map((e) => localDateKey(e.measured_at))])
  paragraph(range === 1
    ? tr(`En las últimas 24 horas registraste ${measurements.length} lecturas y ${symptoms.length} síntomas o comentarios.`,
      `In the last 24 hours you recorded ${measurements.length} readings and ${symptoms.length} symptoms or comments.`)
    : tr(`En ${periodLabel.toLowerCase()} registraste ${measurements.length} lecturas y ${symptoms.length} síntomas o comentarios, en ${recordedDays.size} de ${range} días. Los días sin registro no se estiman.`,
      `Over the ${periodLabel.toLowerCase()} you recorded ${measurements.length} readings and ${symptoms.length} symptoms or comments, on ${recordedDays.size} of ${range} days. Days without records are not estimated.`))
  y += 1.5

  const flaggedMetrics = []
  const emptyMetrics = []
  CHART_METRICS.forEach(({ code }) => {
    const label = clean(en ? METRIC_EN[code] : METRIC_LABELS[code] || code)
    const rows = measurements.filter((e) => e.candidate.metric === code)
      .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
    if (rows.length === 0) { emptyMetrics.push(label); return }
    const unit = [...rows.reduce((m, e) => m.set(e.candidate.unit, (m.get(e.candidate.unit) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0][0]
    const same = rows.filter((e) => e.candidate.unit === unit)
    const first = same.map((e) => Number(e.candidate.values[0])).filter(Number.isFinite)
    if (!first.length) return
    const mean = first.reduce((a, b) => a + b, 0) / first.length
    let main = `${num(mean)} ${clean(unit)}`
    if (code === 'blood_pressure') {
      const dia = same.map((e) => Number(e.candidate.values[1])).filter(Number.isFinite)
      main = `${num(mean)}/${num(dia.reduce((a, b) => a + b, 0) / Math.max(1, dia.length))} ${clean(unit)}`
    }
    let text = tr(`${label}: ${same.length} lecturas, promedio ${main} (mínimo ${num(Math.min(...first))}, máximo ${num(Math.max(...first))}).`,
      `${label}: ${same.length} readings, average ${main} (minimum ${num(Math.min(...first))}, maximum ${num(Math.max(...first))}).`)
    if (first.length >= 3) {
      const change = first.at(-1) - first[0]
      const steady = Math.abs(change) <= Math.abs(mean) * 0.01
      text += steady
        ? tr(' Entre la primera y la última lectura se mantuvo sin cambios relevantes.', ' Between the first and last reading it stayed essentially unchanged.')
        : change > 0
          ? tr(` Entre la primera y la última lectura subió ${num(change)} ${clean(unit)}.`, ` Between the first and last reading it rose ${num(change)} ${clean(unit)}.`)
          : tr(` Entre la primera y la última lectura bajó ${num(Math.abs(change))} ${clean(unit)}.`, ` Between the first and last reading it fell ${num(Math.abs(change))} ${clean(unit)}.`)
    } else {
      text += tr(' Con menos de 3 lecturas no se describe un cambio.', ' With fewer than 3 readings no change is described.')
    }
    const outOfRange = same.filter((e) => e.recommendation?.out_of_range)
    if (outOfRange.length) {
      flaggedMetrics.push(label)
      const last = outOfRange.at(-1).recommendation
      text += tr(` ${outOfRange.length} de ${same.length} lecturas quedaron fuera del rango de referencia (última: ${last.reason || 'fuera de rango'}).`,
        ` ${outOfRange.length} of ${same.length} readings were outside the reference range (latest: ${last.reason_en || last.reason || 'out of range'}).`)
    }
    bullet(text, outOfRange.length ? [190, 80, 20] : [50, 50, 50])
  })

  if (symptoms.length) {
    const perDay = new Map()
    symptoms.forEach((e) => { const k = localDateKey(e.measured_at); perDay.set(k, (perDay.get(k) || 0) + 1) })
    const [topDay, topCount] = [...perDay.entries()].sort((a, b) => b[1] - a[1])[0]
    const latest = clean(symptoms[0].candidate.original_text).slice(0, 110)
    bullet(tr(`Síntomas o comentarios: ${symptoms.length} en ${perDay.size} día(s). El día con más fue el ${dayLabel(topDay)} (${topCount}). El más reciente: "${latest}".`,
      `Symptoms or comments: ${symptoms.length} on ${perDay.size} day(s). The busiest day was ${dayLabel(topDay)} (${topCount}). Most recent: "${latest}".`))
  } else {
    bullet(tr('No declaraste síntomas en este periodo.', 'You did not report any symptoms in this period.'))
  }

  const startKey = localDateKey(new Date(start).toISOString())
  const mind = checkIns.filter((item) => item.date >= startKey)
  if (mind.length) {
    const avg = (key) => {
      const v = mind.map((item) => Number(item[key])).filter((n) => Number.isFinite(n) && n >= 1)
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
    }
    const words = mind.reduce((m, item) => m.set(item.mood_word, (m.get(item.mood_word) || 0) + 1), new Map())
    const topWord = [...words.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const low = [...mind].sort((a, b) => a.mood_score - b.mood_score)[0]
    const scaleText = SCALES.map(([key, es, enName]) => { const v = avg(key); return v == null ? null : `${en ? enName : es} ${num(v)}` }).filter(Boolean).join(', ')
    bullet(tr(`Bienestar emocional: ${mind.length} check-in(s), ánimo promedio ${num(avg('mood_score'))} de 5; la palabra más frecuente fue "${topWord}". Día con ánimo más bajo: ${dayLabel(low.date)} (${low.mood_score}/5).${scaleText ? ` Escalas promedio (1 a 5): ${scaleText}.` : ''}`,
      `Emotional wellbeing: ${mind.length} check-in(s), average mood ${num(avg('mood_score'))} out of 5; the most frequent word was "${MOOD_EN[topWord] || topWord}". Lowest-mood day: ${dayLabel(low.date)} (${low.mood_score}/5).${scaleText ? ` Average scales (1 to 5): ${scaleText}.` : ''}`))
  } else {
    bullet(tr('Sin check-ins de bienestar emocional en este periodo.', 'No emotional wellbeing check-ins in this period.'))
  }

  if (emptyMetrics.length) bullet(tr(`Sin registros en el periodo: ${emptyMetrics.join(', ')}.`, `No records in the period: ${emptyMetrics.join(', ')}.`), [120, 120, 120])
  bullet(flaggedMetrics.length
    ? tr(`Para revisar con atención: ${flaggedMetrics.join(', ')} tuvieron lecturas fuera del rango de referencia.`, `To review carefully: ${flaggedMetrics.join(', ')} had readings outside the reference range.`)
    : tr('Ninguna lectura del periodo quedó fuera del rango de referencia.', 'No reading in the period was outside the reference range.'), flaggedMetrics.length ? [190, 80, 20] : [30, 120, 70])
  paragraph(tr('Descripción automática basada solo en tus registros; no es un diagnóstico ni una evaluación médica.', 'Automatic description based only on your records; it is not a diagnosis or medical evaluation.'), 8, [120, 120, 120])
  y += 4

  // Historial de síntomas: gráfica de barras + listado
  heading(tr('Historial de síntomas', 'Symptom history'))
  const bins = buildBins(range, now)
  symptoms.forEach((e) => {
    const t = new Date(e.measured_at).getTime()
    const bin = bins.find((b) => t >= b.start && t < b.end) || (t >= bins.at(-1).end ? bins.at(-1) : null)
    if (bin) bin.count += 1
  })
  const cx = M + 8
  const cw = CW - 8
  if (symptoms.length === 0) {
    paragraph(tr('No hay síntomas registrados en este periodo; por eso no se dibuja una gráfica vacía.', 'No symptoms were recorded in this period, so an empty chart is not displayed.'))
  } else {
    const chartH = 42
    ensure(chartH + 12)
    const cy = y + 2
    const maxCount = Math.max(1, ...bins.map((b) => b.count))
    doc.setDrawColor(215, 220, 225); doc.setLineWidth(0.2)
    doc.setFontSize(7); doc.setTextColor(120, 120, 120); doc.setFont('helvetica', 'normal')
    ;[0, 0.5, 1].forEach((f) => {
      const gy = cy + chartH - f * chartH
      doc.line(cx, gy, cx + cw, gy)
      doc.text(String(Math.round(maxCount * f * 10) / 10), cx - 2, gy + 1, { align: 'right' })
    })
    const slot = cw / bins.length
    const labelEvery = Math.ceil(bins.length / 8)
    bins.forEach((b, i) => {
      const bh = (b.count / maxCount) * chartH
      if (b.count > 0) { doc.setFillColor(240, 120, 60); doc.rect(cx + i * slot + slot * 0.15, cy + chartH - bh, slot * 0.7, bh, 'F') }
      if (i % labelEvery === 0 || i === bins.length - 1) doc.text(b.label, cx + i * slot + slot / 2, cy + chartH + 4, { align: 'center' })
    })
    y = cy + chartH + 9
    paragraph(range === 1
      ? tr('Síntomas declarados por hora en las últimas 24 horas.', 'Symptoms reported per hour over the last 24 hours.')
      : tr('Síntomas declarados por día.', 'Symptoms reported per day.'), 8, [120, 120, 120])
    y += 2
    symptoms.slice(0, 40).forEach((e) => {
      ensure(10)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(14, 80, 120)
      doc.text(new Date(e.measured_at).toLocaleString(en ? 'en-US' : 'es-CO', { dateStyle: 'short', timeStyle: 'short' }), M, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50)
      const lines = doc.splitTextToSize(clean(e.candidate.original_text).slice(0, 300), CW - 32)
      lines.forEach((line, i) => { if (i > 0) ensure(5); doc.text(line, M + 32, y); y += 4.4 })
      y += 1.2
    })
    if (symptoms.length > 40) paragraph(tr(`… y ${symptoms.length - 40} más.`, `… and ${symptoms.length - 40} more.`), 8.5)
  }
  y += 4

  // Gráficas de indicadores
  heading(range === 1 ? tr('Seguimiento de 24 horas por indicador', '24-hour tracking by metric') : tr('Evolución por indicador', 'Trend by metric'))
  const metricsWithData = CHART_METRICS.filter(({ code }) => measurements.some((entry) => entry.candidate.metric === code))
  if (metricsWithData.length === 0) paragraph(tr('No hay métricas para graficar en este periodo.', 'There are no metrics to chart in this period.'))
  metricsWithData.forEach(({ code, color }) => {
    const rows = measurements.filter((e) => e.candidate.metric === code)
      .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
    const label = clean(en ? METRIC_LABELS_EN[code] || code : METRIC_LABELS[code] || code)
    const unit = rows.length ? [...rows.reduce((m, e) => m.set(e.candidate.unit, (m.get(e.candidate.unit) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0][0] : ''
    const pts = rows.filter((e) => e.candidate.unit === unit).map((e) => ({ t: new Date(e.measured_at).getTime(), v: Number(e.candidate.values?.[0]) }))
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    const h = 30
    ensure(h + 16)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(40, 40, 40)
    const latest = rows.at(-1)
    doc.text(`${label}${unit ? ` (${clean(unit)})` : ''}`, M, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90, 90, 90)
    doc.text(latest ? `${tr('Último', 'Latest')}: ${clean(formatValue(latest.candidate))} ${clean(latest.candidate.unit)}  ·  ${pts.length} ${tr('lecturas', 'readings')}` : tr('Sin registros', 'No records'), W - M, y, { align: 'right' })
    y += 3
    doc.setDrawColor(215, 220, 225); doc.setLineWidth(0.2); doc.rect(cx, y, cw, h)
    if (pts.length > 0) {
      const vals = pts.map((p) => p.v)
      let lo = Math.min(...vals); let hi = Math.max(...vals)
      if (lo === hi) { lo -= 1; hi += 1 }
      const px = (t) => cx + ((t - start) / (now - start)) * cw
      const py = (v) => y + h - 3 - ((v - lo) / (hi - lo)) * (h - 6)
      doc.setFontSize(7); doc.setTextColor(120, 120, 120)
      doc.text(String(Math.round(hi * 10) / 10), cx - 2, y + 3, { align: 'right' })
      doc.text(String(Math.round(lo * 10) / 10), cx - 2, y + h, { align: 'right' })
      doc.setDrawColor(...color); doc.setLineWidth(0.6)
      for (let i = 1; i < pts.length; i += 1) doc.line(px(pts[i - 1].t), py(pts[i - 1].v), px(pts[i].t), py(pts[i].v))
      doc.setFillColor(...color)
      pts.forEach((p) => doc.circle(px(p.t), py(p.v), 0.9, 'F'))
    } else {
      doc.setFontSize(8); doc.setTextColor(150, 150, 150)
      doc.text(tr('Sin registros en este periodo', 'No records in this period'), cx + cw / 2, y + h / 2, { align: 'center' })
    }
    doc.setFontSize(7); doc.setTextColor(120, 120, 120)
    const ticks = range === 1 ? 6 : Math.min(range, 6)
    for (let i = 0; i <= ticks; i += 1) {
      const t = start + ((now - start) * i) / ticks
      const d = new Date(t)
      const txt = range === 1 ? `${pad2(d.getHours())}:00` : `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`
      doc.text(txt, cx + (cw * i) / ticks, y + h + 4, { align: i === 0 ? 'left' : i === ticks ? 'right' : 'center' })
    }
    y += h + 11
  })

  // Recomendaciones fuera de rango
  const flagged = CHART_METRICS.map(({ code }) => measurements.filter((e) => e.candidate.metric === code).sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0])
    .filter((e) => e?.recommendation?.out_of_range)
  if (flagged.length) {
    heading(tr('Valores fuera del rango de referencia', 'Values outside the reference range'))
    flagged.forEach((e) => {
      const label = en ? METRIC_LABELS_EN[e.candidate.metric] || e.candidate.metric : METRIC_LABELS[e.candidate.metric] || e.candidate.metric
      paragraph(`${label}: ${formatValue(e.candidate)} ${e.candidate.unit}${e.recommendation.reason ? ` (${en ? e.recommendation.reason_en || e.recommendation.reason : e.recommendation.reason})` : ''}`, 9.5, [190, 80, 20])
      paragraph(en && e.recommendation.text_en ? e.recommendation.text_en : e.recommendation.text, 9)
      y += 1.5
    })
  }

  y += 3
  ensure(16)
  paragraph(tr(
    'Este informe resume solo datos confirmados por la persona. No es un diagnóstico ni una evaluación médica y no se envía automáticamente a nadie.',
    'This report summarizes only data confirmed by the person. It is not a diagnosis or medical evaluation and is not sent automatically to anyone.',
  ), 8, [120, 120, 120])

  const fileName = `astra-health-informe-${localDateKey(new Date(now).toISOString())}.pdf`
  // Descarga explícita con un enlace temporal: funciona aunque doc.save() sea bloqueado.
  const url = URL.createObjectURL(doc.output('blob'))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => { link.remove(); URL.revokeObjectURL(url) }, 4000)
}
