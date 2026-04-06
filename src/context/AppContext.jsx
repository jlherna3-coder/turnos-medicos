import { createContext, useContext } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ── Catálogos ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { value: 'AP',  label: 'Médico AP' },
  { value: 'MDT', label: 'Médico MDT' },
  { value: 'TMT', label: 'Médico TMT' },
]

export const DAYS = [
  { key: 'mon', label: 'Lunes',     short: 'Lun', jsDay: 1 },
  { key: 'tue', label: 'Martes',    short: 'Mar', jsDay: 2 },
  { key: 'wed', label: 'Miércoles', short: 'Mié', jsDay: 3 },
  { key: 'thu', label: 'Jueves',    short: 'Jue', jsDay: 4 },
  { key: 'fri', label: 'Viernes',   short: 'Vie', jsDay: 5 },
  { key: 'sat', label: 'Sábado',    short: 'Sáb', jsDay: 6 },
  { key: 'sun', label: 'Domingo',   short: 'Dom', jsDay: 0 },
]

// ── Templates por defecto ────────────────────────────────────────────────────

const DEFAULT_DOCTOR_TEMPLATE = {
  mon: { start: '08:00', end: '17:00' },
  tue: { start: '08:00', end: '17:00' },
  wed: { start: '08:00', end: '17:00' },
  thu: { start: '08:00', end: '17:00' },
  fri: { start: '08:00', end: '17:00' },
  sat: null,
  sun: null,
}

const DEFAULT_CENTER_SCHEDULE = {
  mon: { start: '08:00', end: '20:00' },
  tue: { start: '08:00', end: '20:00' },
  wed: { start: '08:00', end: '20:00' },
  thu: { start: '08:00', end: '20:00' },
  fri: { start: '08:00', end: '20:00' },
  sat: null,
  sun: null,
}

// ── Seed: doctores (asociados al primer centro) ──────────────────────────────

const SEED_DOCTORS = [
  { id: '1', name: 'Dra. García',  category: 'AP',  color: '#3b82f6', centroId: 'c1', weeklyTemplate: DEFAULT_DOCTOR_TEMPLATE },
  { id: '2', name: 'Dr. López',    category: 'AP',  color: '#10b981', centroId: 'c1', weeklyTemplate: DEFAULT_DOCTOR_TEMPLATE },
  { id: '3', name: 'Dra. Ruiz',    category: 'MDT', color: '#f59e0b', centroId: 'c1', weeklyTemplate: DEFAULT_DOCTOR_TEMPLATE },
]

// ── Seed: jerarquía de centros ───────────────────────────────────────────────

const TERRITORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b']

const SEED_TERRITORIOS = [
  { id: 't1', name: 'Territorio Norte',   color: TERRITORY_COLORS[0] },
  { id: 't2', name: 'Territorio Sur',     color: TERRITORY_COLORS[1] },
  { id: 't3', name: 'Territorio Oriente', color: TERRITORY_COLORS[2] },
]

const SEED_AGENCIAS = [
  { id: 'a1', name: 'Agencia Norte A',   territorioId: 't1' },
  { id: 'a2', name: 'Agencia Norte B',   territorioId: 't1' },
  { id: 'a3', name: 'Agencia Sur A',     territorioId: 't2' },
  { id: 'a4', name: 'Agencia Sur B',     territorioId: 't2' },
  { id: 'a5', name: 'Agencia Oriente A', territorioId: 't3' },
  { id: 'a6', name: 'Agencia Oriente B', territorioId: 't3' },
]

const SEED_CENTROS = [
  { id: 'c1',  name: 'CESFAM El Bosque',     agenciaId: 'a1', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c2',  name: 'CESFAM Los Pinos',     agenciaId: 'a1', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c3',  name: 'CESFAM La Araucaria',  agenciaId: 'a2', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c4',  name: 'CESFAM Villa Alemana', agenciaId: 'a2', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c5',  name: 'CESFAM San Joaquín',   agenciaId: 'a3', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c6',  name: 'CESFAM La Pintana',    agenciaId: 'a3', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c7',  name: 'CESFAM El Roble',      agenciaId: 'a4', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c8',  name: 'CESFAM Los Quillayes', agenciaId: 'a4', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c9',  name: 'CESFAM Peñalolén',     agenciaId: 'a5', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c10', name: 'CESFAM La Reina',      agenciaId: 'a5', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c11', name: 'CESFAM Macul',         agenciaId: 'a6', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c12', name: 'CESFAM Ñuñoa',         agenciaId: 'a6', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
]

// ── Utilidades de tiempo ─────────────────────────────────────────────────────

export function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minToTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getLunchBreak(start, end) {
  const s = timeToMin(start)
  const e = timeToMin(end)
  const mid = Math.round((s + e) / 2)
  const lunchStart = Math.round(mid / 5) * 5
  const lunchEnd = lunchStart + 30
  return { start: minToTime(lunchStart), end: minToTime(lunchEnd) }
}

// ── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [doctors, setDoctors]   = useLocalStorage('doctors_v4', SEED_DOCTORS)
  const [territorios, setTerritorios] = useLocalStorage('territorios_v1', SEED_TERRITORIOS)
  const [agencias, setAgencias]       = useLocalStorage('agencias_v1', SEED_AGENCIAS)
  const [centros, setCentros]         = useLocalStorage('centros_v1', SEED_CENTROS)

  // Centro activo: persiste entre sesiones
  const [activeCentroId, setActiveCentroId] = useLocalStorage('activeCentro_v1', SEED_CENTROS[0].id)

  // Derivado: objeto del centro activo
  const activeCentro = centros.find((c) => c.id === activeCentroId) ?? centros[0] ?? null

  // Doctores del centro activo
  const activeDoctors = doctors.filter((d) => d.centroId === activeCentroId)

  // ── CRUD doctores (siempre asociados al centro activo) ──
  const addDoctor    = (d) => setDoctors((p) => [...p, { ...d, id: uuidv4(), centroId: activeCentroId, weeklyTemplate: DEFAULT_DOCTOR_TEMPLATE }])
  const updateDoctor = (id, data) => setDoctors((p) => p.map((d) => d.id === id ? { ...d, ...data } : d))
  const deleteDoctor = (id) => setDoctors((p) => p.filter((d) => d.id !== id))

  // Horario del centro activo (read/write a través de updateCentro)
  const activeCenterSchedule = activeCentro?.schedule ?? null
  const setActiveCenterSchedule = (schedule) => {
    if (activeCentro) updateCentro(activeCentro.id, { schedule })
  }

  // ── CRUD territorios (cascade) ──
  const addTerritorio    = (t) => setTerritorios((p) => [...p, { ...t, id: uuidv4() }])
  const updateTerritorio = (id, data) => setTerritorios((p) => p.map((t) => t.id === id ? { ...t, ...data } : t))
  const deleteTerritorio = (id) => {
    const agIds = agencias.filter((a) => a.territorioId === id).map((a) => a.id)
    const centroIds = centros.filter((c) => agIds.includes(c.agenciaId)).map((c) => c.id)
    setDoctors((p) => p.filter((d) => !centroIds.includes(d.centroId)))
    setCentros((p) => p.filter((c) => !agIds.includes(c.agenciaId)))
    setAgencias((p) => p.filter((a) => a.territorioId !== id))
    setTerritorios((p) => p.filter((t) => t.id !== id))
  }

  // ── CRUD agencias (cascade) ──
  const addAgencia    = (a) => setAgencias((p) => [...p, { ...a, id: uuidv4() }])
  const updateAgencia = (id, data) => setAgencias((p) => p.map((a) => a.id === id ? { ...a, ...data } : a))
  const deleteAgencia = (id) => {
    const centroIds = centros.filter((c) => c.agenciaId === id).map((c) => c.id)
    setDoctors((p) => p.filter((d) => !centroIds.includes(d.centroId)))
    setCentros((p) => p.filter((c) => c.agenciaId !== id))
    setAgencias((p) => p.filter((a) => a.id !== id))
  }

  // ── CRUD centros ──
  const addCentro    = (c) => setCentros((p) => [...p, { ...c, id: uuidv4(), schedule: DEFAULT_CENTER_SCHEDULE }])
  const updateCentro = (id, data) => setCentros((p) => p.map((c) => c.id === id ? { ...c, ...data } : c))
  const deleteCentro = (id) => {
    setDoctors((p) => p.filter((d) => d.centroId !== id))
    setCentros((p) => p.filter((c) => c.id !== id))
  }

  return (
    <AppContext.Provider value={{
      // Centro activo
      activeCentroId, setActiveCentroId,
      activeCentro,
      activeCenterSchedule, setActiveCenterSchedule,
      // Doctores del centro activo
      doctors: activeDoctors,
      addDoctor, updateDoctor, deleteDoctor,
      // Jerarquía
      territorios, agencias, centros,
      addTerritorio, updateTerritorio, deleteTerritorio,
      addAgencia,    updateAgencia,    deleteAgencia,
      addCentro,     updateCentro,     deleteCentro,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
