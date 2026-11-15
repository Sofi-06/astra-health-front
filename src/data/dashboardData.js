import {
  Activity,
  BookOpen,
  Brain,
  LayoutDashboard,
  ShieldAlert,
  Star,
  UserRoundSearch,
} from 'lucide-react'

export const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Mind Tracker', icon: Brain },
  { label: 'Body Explorer', icon: UserRoundSearch },
  { label: 'Smart Alerts', icon: ShieldAlert },
  { label: 'Mission Challenges', icon: Star },
  { label: 'Wellness Guide', icon: BookOpen },
]

// Pendientes de registro: se marcan solos cuando el indicador tiene un
// registro confirmado con fecha de hoy (sin estados completados inventados).
export const tasks = [
  { label: 'Registrar pulso', metric: 'heart_rate' },
  { label: 'Registrar presión arterial', metric: 'blood_pressure' },
  { label: 'Registrar horas de sueño', metric: 'sleep' },
  { label: 'Registrar temperatura', metric: 'temperature' },
]

export const ActivityIcon = Activity
