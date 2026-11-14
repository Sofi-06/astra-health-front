import {
  Activity,
  BarChart3,
  Brain,
  HeartPulse,
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
  Star,
  UserRoundSearch,
} from 'lucide-react'

export const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Health Monitor', icon: HeartPulse },
  { label: 'Mind Tracker', icon: Brain },
  { label: 'Body Explorer', icon: UserRoundSearch },
  { label: 'Space Health Insights', icon: Sparkles },
  { label: 'Smart Alerts', icon: ShieldAlert },
  { label: 'Mission Challenges', icon: Star },
  { label: 'Health Analytics', icon: BarChart3 },
]

export const metrics = [
  { id: 'heart', label: 'Frecuencia cardiaca', value: '88', unit: 'bpm', tone: 'warning', progress: 67 },
  { id: 'sleep', label: 'Sueño', value: '4.6', unit: 'h', tone: 'warning', progress: 43 },
  { id: 'pressure', label: 'Presión arterial', value: '124/80', unit: 'mmHg', tone: 'good', progress: 82 },
  { id: 'oxygen', label: 'Saturación O₂', value: '97', unit: '%', tone: 'good', progress: 94 },
]

export const tasks = [
  'Registrar presión arterial (tarde)',
  'Completar evaluación emocional',
  'Rutina de ejercicio programada',
  'Registrar horas de sueño',
]

export const quickStats = [
  { label: 'Temperatura', value: '36.8 °C' },
  { label: 'Glucosa', value: '94 mg/dL' },
  { label: 'Actividad física', value: '25 min' },
]

export const statusRows = [
  { label: 'Sueño ↓ · Fatiga ↑', tag: 'Preventivo', tone: 'warning' },
  { label: 'Actividad ↓', tag: 'Preventivo', tone: 'warning' },
  { label: 'Check-in pendiente', tag: 'Info', tone: 'info' },
]

export const sleepTrend = [7.2, 7, 6.8, 6.2, 6.1, 5.7, 5.6, 5.2, 5.1, 4.9, 4.8, 4.7, 4.6]
export const heartTrend = [72, 73, 75, 76, 77, 80, 81, 84, 85, 87, 88]

export const ActivityIcon = Activity
