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

export const tasks = [
  'Registrar presión arterial (tarde)',
  'Completar evaluación emocional',
  'Rutina de ejercicio programada',
  'Registrar horas de sueño',
]


export const ActivityIcon = Activity
