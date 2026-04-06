import { createContext, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'

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

export const DEFAULT_DOCTOR_TEMPLATE = {
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

// ── Seed ─────────────────────────────────────────────────────────────────────

const SEED_TERRITORIOS = [
  { id: 't1', name: 'Territorio Norte',   color: '#3b82f6' },
  { id: 't2', name: 'Territorio Sur',     color: '#10b981' },
  { id: 't3', name: 'Territorio Oriente', color: '#f59e0b' },
]

const SEED_AGENCIAS = [
  { id: 'a1', name: 'Agencia Norte A',   territorio_id: 't1' },
  { id: 'a2', name: 'Agencia Norte B',   territorio_id: 't1' },
  { id: 'a3', name: 'Agencia Sur A',     territorio_id: 't2' },
  { id: 'a4', name: 'Agencia Sur B',     territorio_id: 't2' },
  { id: 'a5', name: 'Agencia Oriente A', territorio_id: 't3' },
  { id: 'a6', name: 'Agencia Oriente B', territorio_id: 't3' },
]

const SEED_CENTROS = [
  { id: 'c1',  name: 'CESFAM El Bosque',     agencia_id: 'a1', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c2',  name: 'CESFAM Los Pinos',     agencia_id: 'a1', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c3',  name: 'CESFAM La Araucaria',  agencia_id: 'a2', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c4',  name: 'CESFAM Villa Alemana', agencia_id: 'a2', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c5',  name: 'CESFAM San Joaquín',   agencia_id: 'a3', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c6',  name: 'CESFAM La Pintana',    agencia_id: 'a3', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c7',  name: 'CESFAM El Roble',      agencia_id: 'a4', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c8',  name: 'CESFAM Los Quillayes', agencia_id: 'a4', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c9',  name: 'CESFAM Peñalolén',     agencia_id: 'a5', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c10', name: 'CESFAM La Reina',      agencia_id: 'a5', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c11', name: 'CESFAM Macul',         agencia_id: 'a6', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
  { id: 'c12', name: 'CESFAM Ñuñoa',         agencia_id: 'a6', address: '', schedule: DEFAULT_CENTER_SCHEDULE },
]

const SEED_DOCTORS = [
  { id: 'd1', name: 'Dra. García',  category: 'AP',  color: '#3b82f6', centro_id: 'c1', weekly_template: DEFAULT_DOCTOR_TEMPLATE },
  { id: 'd2', name: 'Dr. López',    category: 'AP',  color: '#10b981', centro_id: 'c1', weekly_template: DEFAULT_DOCTOR_TEMPLATE },
  { id: 'd3', name: 'Dra. Ruiz',    category: 'MDT', color: '#f59e0b', centro_id: 'c1', weekly_template: DEFAULT_DOCTOR_TEMPLATE },
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

// ── Helpers para mapear snake_case (DB) ↔ camelCase (app) ───────────────────

function mapDoctor(d) {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    color: d.color,
    centroId: d.centro_id,
    weeklyTemplate: d.weekly_template,
  }
}

function mapCentro(c) {
  return {
    id: c.id,
    name: c.name,
    agenciaId: c.agencia_id,
    address: c.address,
    schedule: c.schedule,
  }
}

function mapAgencia(a) {
  return {
    id: a.id,
    name: a.name,
    territorioId: a.territorio_id,
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [territorios, setTerritorios] = useState([])
  const [agencias, setAgencias]       = useState([])
  const [centros, setCentros]         = useState([])
  const [doctors, setDoctors]         = useState([])
  const [loading, setLoading]         = useState(true)

  // Centro activo persiste en localStorage (es solo una preferencia de UI)
  const [activeCentroId, setActiveCentroId] = useState(
    () => localStorage.getItem('activeCentro_v1') ?? 'c1'
  )

  // Persistir activeCentroId en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('activeCentro_v1', activeCentroId)
  }, [activeCentroId])

  // ── Cargar datos iniciales desde Supabase ──
  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const [{ data: tData }, { data: aData }, { data: cData }, { data: dData }] =
        await Promise.all([
          supabase.from('territorios').select('*').order('name'),
          supabase.from('agencias').select('*').order('name'),
          supabase.from('centros').select('*').order('name'),
          supabase.from('doctors').select('*').order('name'),
        ])

      // Si las tablas están vacías, insertar seed
      if (!tData || tData.length === 0) {
        await supabase.from('territorios').insert(SEED_TERRITORIOS)
        await supabase.from('agencias').insert(SEED_AGENCIAS)
        await supabase.from('centros').insert(SEED_CENTROS)
        await supabase.from('doctors').insert(SEED_DOCTORS)

        setTerritorios(SEED_TERRITORIOS)
        setAgencias(SEED_AGENCIAS.map(mapAgencia))
        setCentros(SEED_CENTROS.map(mapCentro))
        setDoctors(SEED_DOCTORS.map(mapDoctor))
      } else {
        setTerritorios(tData)
        setAgencias((aData ?? []).map(mapAgencia))
        setCentros((cData ?? []).map(mapCentro))
        setDoctors((dData ?? []).map(mapDoctor))
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // ── Derivados ──
  const activeCentro = centros.find((c) => c.id === activeCentroId) ?? centros[0] ?? null
  const activeDoctors = doctors.filter((d) => d.centroId === activeCentroId)
  const activeCenterSchedule = activeCentro?.schedule ?? null

  const setActiveCenterSchedule = (schedule) => {
    if (activeCentro) updateCentro(activeCentro.id, { schedule })
  }

  // ── CRUD doctores ──
  const addDoctor = async (d) => {
    const newDoc = { ...d, id: uuidv4(), centro_id: activeCentroId, weekly_template: DEFAULT_DOCTOR_TEMPLATE }
    await supabase.from('doctors').insert(newDoc)
    setDoctors((p) => [...p, mapDoctor(newDoc)])
  }

  const updateDoctor = async (id, data) => {
    const dbData = {}
    if (data.name)           dbData.name = data.name
    if (data.category)       dbData.category = data.category
    if (data.color)          dbData.color = data.color
    if (data.weeklyTemplate) dbData.weekly_template = data.weeklyTemplate
    await supabase.from('doctors').update(dbData).eq('id', id)
    setDoctors((p) => p.map((d) => d.id === id ? { ...d, ...data } : d))
  }

  const deleteDoctor = async (id) => {
    await supabase.from('doctors').delete().eq('id', id)
    setDoctors((p) => p.filter((d) => d.id !== id))
  }

  // ── CRUD territorios (cascade manejado por DB) ──
  const addTerritorio = async (t) => {
    const newT = { ...t, id: uuidv4() }
    await supabase.from('territorios').insert(newT)
    setTerritorios((p) => [...p, newT])
  }

  const updateTerritorio = async (id, data) => {
    await supabase.from('territorios').update(data).eq('id', id)
    setTerritorios((p) => p.map((t) => t.id === id ? { ...t, ...data } : t))
  }

  const deleteTerritorio = async (id) => {
    // Cascade: la DB borra agencias → centros → doctors automáticamente
    await supabase.from('territorios').delete().eq('id', id)
    const agIds = agencias.filter((a) => a.territorioId === id).map((a) => a.id)
    const centroIds = centros.filter((c) => agIds.includes(c.agenciaId)).map((c) => c.id)
    setDoctors((p) => p.filter((d) => !centroIds.includes(d.centroId)))
    setCentros((p) => p.filter((c) => !agIds.includes(c.agenciaId)))
    setAgencias((p) => p.filter((a) => a.territorioId !== id))
    setTerritorios((p) => p.filter((t) => t.id !== id))
  }

  // ── CRUD agencias ──
  const addAgencia = async (a) => {
    const newA = { ...a, id: uuidv4(), territorio_id: a.territorioId }
    await supabase.from('agencias').insert(newA)
    setAgencias((p) => [...p, mapAgencia(newA)])
  }

  const updateAgencia = async (id, data) => {
    await supabase.from('agencias').update(data).eq('id', id)
    setAgencias((p) => p.map((a) => a.id === id ? { ...a, ...data } : a))
  }

  const deleteAgencia = async (id) => {
    await supabase.from('agencias').delete().eq('id', id)
    const centroIds = centros.filter((c) => c.agenciaId === id).map((c) => c.id)
    setDoctors((p) => p.filter((d) => !centroIds.includes(d.centroId)))
    setCentros((p) => p.filter((c) => c.agenciaId !== id))
    setAgencias((p) => p.filter((a) => a.id !== id))
  }

  // ── CRUD centros ──
  const addCentro = async (c) => {
    const newC = { ...c, id: uuidv4(), agencia_id: c.agenciaId, schedule: DEFAULT_CENTER_SCHEDULE }
    await supabase.from('centros').insert(newC)
    setCentros((p) => [...p, mapCentro(newC)])
  }

  const updateCentro = async (id, data) => {
    const dbData = {}
    if (data.name)     dbData.name = data.name
    if (data.address !== undefined) dbData.address = data.address
    if (data.schedule) dbData.schedule = data.schedule
    await supabase.from('centros').update(dbData).eq('id', id)
    setCentros((p) => p.map((c) => c.id === id ? { ...c, ...data } : c))
  }

  const deleteCentro = async (id) => {
    await supabase.from('centros').delete().eq('id', id)
    setDoctors((p) => p.filter((d) => d.centroId !== id))
    setCentros((p) => p.filter((c) => c.id !== id))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Cargando datos…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{
      activeCentroId, setActiveCentroId,
      activeCentro,
      activeCenterSchedule, setActiveCenterSchedule,
      doctors: activeDoctors,
      addDoctor, updateDoctor, deleteDoctor,
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
