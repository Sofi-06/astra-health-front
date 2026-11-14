export const METRIC_LABELS = {
  heart_rate: 'Pulso', temperature: 'Temperatura', blood_pressure: 'Presión arterial',
  oxygen_saturation: 'Saturación', glucose: 'Glucosa', sleep: 'Sueño declarado',
}

export function formatValue(candidate) {
  const v = candidate.values
  return candidate.metric === 'blood_pressure' ? v.join('/') : String(v[0])
}

export function formatWhen(iso) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}
