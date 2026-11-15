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

export function formatDay(iso) {
  // Una fecha sin hora (aaaa-mm-dd) se interpreta al mediodía local para no
  // desplazarla al día anterior por la zona horaria.
  const value = typeof iso === 'string' && iso.length === 10 ? `${iso}T12:00:00` : iso
  return new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
}

// Clave de fecha local (aaaa-mm-dd) para agrupar registros por día.
export function localDateKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
