import { useId, useMemo } from 'react'

export default function MiniChart({ title, data, color, min, max }) {
  const gradientId = useId().replace(/:/g, '')
  const width = 300
  const height = 118
  const padding = 8
  const points = useMemo(() => data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (value - min) / (max - min)) * (height - padding * 2)
    return [x, y]
  }), [data, min, max])
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${path} L ${points.at(-1)[0]} ${height} L ${points[0][0]} ${height} Z`
  const last = points.at(-1)

  return (
    <div className="mini-chart">
      <p>{title}</p>
      <div className="mini-chart__canvas">
        <div className="chart-grid"><i /><i /><i /><i /></div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".38" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0]} cy={last[1]} r="7" fill={color} opacity=".2" />
          <circle cx={last[0]} cy={last[1]} r="3.6" fill="#efffff" stroke={color} strokeWidth="2" />
        </svg>
      </div>
      <div className="chart-labels"><span>D139</span><span>D141</span><span>D143</span><span>D145</span></div>
    </div>
  )
}
