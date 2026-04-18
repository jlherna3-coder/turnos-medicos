import { createContext, useContext, useEffect, useCallback, useState, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

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

function mapCenterTemplate(t) {
  return { id: t.id, centroId: t.centro_id, name: t.name, createdAt: t.created_at }
}

function mapTemplateSlot(s) {
  return { id: s.id, templateId: s.template_id, category: s.category, schedule: s.schedule }
}

function mapWeekPlan(w) {
  return { id: w.id, centroId: w.centro_id, weekStart: w.week_start, templateId: w.template_id }
}

function mapWeekOverride(o) {
  return { id: o.id, centroId: o.centro_id, weekStart: o.week_start, slotId: o.slot_id, day: o.day, slot: o.slot, reason: o.reason }
}

// ── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { role, canAccessCentro, canWriteCentro } = useAuth()

  const [territorios, setTerritorios] = useState([])
  const [agencias, setAgencias]       = useState([])
  const [centros, setCentros]         = useState([])
  const [doctors, setDoctors]             = useState([])
  const [centerTemplates, setCenterTemplates] = useState([])
  const [templateSlots, setTemplateSlots]     = useState([])
  const [weekPlans, setWeekPlans]             = useState([])
  const [weekOverrides, setWeekOverrides]     = useState([])
  const [loading, setLoading]             = useState(true)

  // Centro activo persiste en localStorage (es solo una preferencia de UI)
  const [activeCentroId, setActiveCentroId] = useState(
    () => localStorage.getItem('activeCentro_v1') ?? 'c1'
  )

  // Persistir activeCentroId en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('activeCentro_v1', activeCentroId)
  }, [activeCentroId])

  // ── Cargar datos desde Supabase ──
  const loadData = useCallback(async () => {
    const [
      { data: tData, error: tErr },
      { data: aData, error: aErr },
      { data: cData, error: cErr },
      { data: dData, error: dErr },
      { data: ctData },
      { data: tsData },
      { data: wpData },
      { data: woData },
    ] = await Promise.all([
      supabase.from('territorios').select('*').order('name'),
      supabase.from('agencias').select('*').order('name'),
      supabase.from('centros').select('*').order('name'),
      supabase.from('doctors').select('*').order('name'),
      supabase.from('center_templates').select('*').order('name'),
      supabase.from('template_slots').select('*'),
      supabase.from('week_plans').select('*').order('week_start'),
      supabase.from('week_overrides').select('*').order('created_at'),
    ])

    if (tErr || aErr || cErr || dErr) {
      console.error('Error cargando datos:', { tErr, aErr, cErr, dErr })
      return
    }

    // Si las tablas están vacías, insertar seed
    if (!tData || tData.length === 0) {
      const [r1, r2, r3, r4] = await Promise.all([
        supabase.from('territorios').insert(SEED_TERRITORIOS),
        supabase.from('agencias').insert(SEED_AGENCIAS),
        supabase.from('centros').insert(SEED_CENTROS),
        supabase.from('doctors').insert(SEED_DOCTORS),
      ])
      if (r1.error || r2.error || r3.error || r4.error) {
        console.error('Error insertando seed:', { r1: r1.error, r2: r2.error, r3: r3.error, r4: r4.error })
      }
      setTerritorios(SEED_TERRITORIOS)
      setAgencias(SEED_AGENCIAS.map(mapAgencia))
      setCentros(SEED_CENTROS.map(mapCentro))
      setDoctors(SEED_DOCTORS.map(mapDoctor))
      setCenterTemplates([])
      setTemplateSlots([])
      setWeekPlans([])
      setWeekOverrides([])
    } else {
      setTerritorios(tData)
      setAgencias((aData ?? []).map(mapAgencia))
      setCentros((cData ?? []).map(mapCentro))
      setDoctors((dData ?? []).map(mapDoctor))
      setCenterTemplates((ctData ?? []).map(mapCenterTemplate))
      setTemplateSlots((tsData ?? []).map(mapTemplateSlot))
      setWeekPlans((wpData ?? []).map(mapWeekPlan))
      setWeekOverrides((woData ?? []).map(mapWeekOverride))
    }
  }, [])

  // Carga inicial + realtime
  useEffect(() => {
    loadData().then(() => setLoading(false))

    // Suscripción realtime: recarga la tabla afectada cuando cualquier
    // cliente hace un cambio
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' },
        async () => {
          const { data } = await supabase.from('doctors').select('*').order('name')
          if (data) setDoctors(data.map(mapDoctor))
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'centros' },
        async () => {
          const { data } = await supabase.from('centros').select('*').order('name')
          if (data) setCentros(data.map(mapCentro))
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agencias' },
        async () => {
          const { data } = await supabase.from('agencias').select('*').order('name')
          if (data) setAgencias(data.map(mapAgencia))
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territorios' },
        async () => {
          const { data } = await supabase.from('territorios').select('*').order('name')
          if (data) setTerritorios(data)
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'center_templates' },
        async () => {
          const { data } = await supabase.from('center_templates').select('*').order('name')
          if (data) setCenterTemplates(data.map(mapCenterTemplate))
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'template_slots' },
        async () => {
          const { data } = await supabase.from('template_slots').select('*')
          if (data) setTemplateSlots(data.map(mapTemplateSlot))
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'week_plans' },
        async () => {
          const { data } = await supabase.from('week_plans').select('*').order('week_start')
          if (data) setWeekPlans(data.map(mapWeekPlan))
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'week_overrides' },
        async () => {
          const { data } = await supabase.from('week_overrides').select('*').order('created_at')
          if (data) setWeekOverrides(data.map(mapWeekOverride))
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  // ── Derivados ──

  // Centros a los que el usuario tiene acceso (admins ven todos)
  const accessibleCentros = useMemo(() => {
    if (role === 'admin') return centros
    return centros.filter((c) => canAccessCentro(c.id, centros, agencias))
  }, [centros, agencias, role, canAccessCentro])

  // Si el centro activo dejó de ser accesible, usar el primero disponible
  const resolvedCentroId = accessibleCentros.some((c) => c.id === activeCentroId)
    ? activeCentroId
    : (accessibleCentros[0]?.id ?? activeCentroId)

  const activeCentro = centros.find((c) => c.id === resolvedCentroId) ?? null
  const activeDoctors = doctors.filter((d) => d.centroId === resolvedCentroId)
  const activeCenterSchedule = activeCentro?.schedule ?? null

  // ¿Puede el usuario escribir en el centro activo?
  const activeCanWrite = canWriteCentro(resolvedCentroId, centros, agencias)

  const setActiveCenterSchedule = (schedule) => {
    if (activeCentro && activeCanWrite) updateCentro(activeCentro.id, { schedule })
  }

  // ── Helper: log y alerta de errores DB ──
  const dbErr = (op, error) => {
    if (!error) return false
    console.error(`[Supabase] ${op}:`, error)
    alert(`Error guardando datos (${op}): ${error.message}`)
    return true
  }

  // ── CRUD doctores ──
  const addDoctor = async (d) => {
    const newDoc = {
      id: uuidv4(),
      name: d.name,
      category: d.category,
      color: d.color,
      centro_id: activeCentroId,
      weekly_template: DEFAULT_DOCTOR_TEMPLATE,
    }
    const { error } = await supabase.from('doctors').insert(newDoc)
    if (dbErr('addDoctor', error)) return
    setDoctors((p) => [...p, mapDoctor(newDoc)])
  }

  const updateDoctor = async (id, data) => {
    const dbData = {}
    if (data.name     !== undefined) dbData.name            = data.name
    if (data.category !== undefined) dbData.category        = data.category
    if (data.color    !== undefined) dbData.color           = data.color
    if (data.weeklyTemplate !== undefined) dbData.weekly_template = data.weeklyTemplate
    const { error } = await supabase.from('doctors').update(dbData).eq('id', id)
    if (dbErr('updateDoctor', error)) return
    setDoctors((p) => p.map((d) => d.id === id ? { ...d, ...data } : d))
  }

  const deleteDoctor = async (id) => {
    const { error } = await supabase.from('doctors').delete().eq('id', id)
    if (dbErr('deleteDoctor', error)) return
    setDoctors((p) => p.filter((d) => d.id !== id))
  }

  // ── CRUD center templates ──
  const addTemplate = async (centroId, name, sourceTemplateId = null) => {
    const newTemplate = { id: uuidv4(), centro_id: centroId, name }
    const { error } = await supabase.from('center_templates').insert(newTemplate)
    if (dbErr('addTemplate', error)) return null
    const mapped = mapCenterTemplate(newTemplate)
    setCenterTemplates((p) => [...p, mapped])
    if (sourceTemplateId) {
      const sourceSlots = templateSlots.filter((s) => s.templateId === sourceTemplateId)
      if (sourceSlots.length > 0) {
        const newSlots = sourceSlots.map((s) => ({
          id: uuidv4(), template_id: mapped.id, category: s.category, schedule: s.schedule,
        }))
        const { error: sErr } = await supabase.from('template_slots').insert(newSlots)
        if (!sErr) setTemplateSlots((p) => [...p, ...newSlots.map(mapTemplateSlot)])
      }
    }
    return mapped.id
  }

  const updateTemplate = async (id, data) => {
    const { error } = await supabase.from('center_templates').update({ name: data.name }).eq('id', id)
    if (dbErr('updateTemplate', error)) return
    setCenterTemplates((p) => p.map((t) => t.id === id ? { ...t, ...data } : t))
  }

  const deleteTemplate = async (id) => {
    const { error } = await supabase.from('center_templates').delete().eq('id', id)
    if (dbErr('deleteTemplate', error)) return
    const slotIds = templateSlots.filter((s) => s.templateId === id).map((s) => s.id)
    setWeekOverrides((p) => p.filter((o) => !slotIds.includes(o.slotId)))
    setTemplateSlots((p) => p.filter((s) => s.templateId !== id))
    setWeekPlans((p) => p.map((w) => w.templateId === id ? { ...w, templateId: null } : w))
    setCenterTemplates((p) => p.filter((t) => t.id !== id))
  }

  // ── CRUD template slots ──
  const addTemplateSlot = async (templateId, category, schedule) => {
    const newSlot = { id: uuidv4(), template_id: templateId, category, schedule }
    const { error } = await supabase.from('template_slots').insert(newSlot)
    if (dbErr('addTemplateSlot', error)) return
    setTemplateSlots((p) => [...p, mapTemplateSlot(newSlot)])
  }

  const updateTemplateSlot = async (id, data) => {
    const dbData = {}
    if (data.schedule  !== undefined) dbData.schedule  = data.schedule
    if (data.category  !== undefined) dbData.category  = data.category
    const { error } = await supabase.from('template_slots').update(dbData).eq('id', id)
    if (dbErr('updateTemplateSlot', error)) return
    setTemplateSlots((p) => p.map((s) => s.id === id ? { ...s, ...data } : s))
  }

  const deleteTemplateSlot = async (id) => {
    const { error } = await supabase.from('template_slots').delete().eq('id', id)
    if (dbErr('deleteTemplateSlot', error)) return
    setWeekOverrides((p) => p.filter((o) => o.slotId !== id))
    setTemplateSlots((p) => p.filter((s) => s.id !== id))
  }

  // ── Week plans ──
  const setWeekPlan = async (centroId, weekStart, templateId) => {
    if (!templateId) {
      const existing = weekPlans.find((w) => w.centroId === centroId && w.weekStart === weekStart)
      if (existing) {
        const { error } = await supabase.from('week_plans').delete().eq('id', existing.id)
        if (dbErr('clearWeekPlan', error)) return
        setWeekPlans((p) => p.filter((w) => w.id !== existing.id))
      }
      return
    }
    const row = { centro_id: centroId, week_start: weekStart, template_id: templateId }
    const { data, error } = await supabase.from('week_plans')
      .upsert(row, { onConflict: 'centro_id,week_start' }).select().single()
    if (dbErr('setWeekPlan', error)) return
    const mapped = mapWeekPlan(data)
    setWeekPlans((p) => {
      const exists = p.find((w) => w.centroId === centroId && w.weekStart === weekStart)
      return exists ? p.map((w) => (w.centroId === centroId && w.weekStart === weekStart) ? mapped : w) : [...p, mapped]
    })
  }

  // ── Week overrides ──
  const upsertWeekOverride = async (centroId, weekStart, slotId, day, slot, reason = '') => {
    const row = { centro_id: centroId, week_start: weekStart, slot_id: slotId, day, slot, reason }
    const { data, error } = await supabase.from('week_overrides')
      .upsert(row, { onConflict: 'slot_id,week_start,day' }).select().single()
    if (dbErr('upsertWeekOverride', error)) return
    const mapped = mapWeekOverride(data)
    setWeekOverrides((p) => {
      const exists = p.find((o) => o.slotId === slotId && o.weekStart === weekStart && o.day === day)
      return exists
        ? p.map((o) => (o.slotId === slotId && o.weekStart === weekStart && o.day === day) ? mapped : o)
        : [...p, mapped]
    })
  }

  const deleteWeekOverride = async (id) => {
    const { error } = await supabase.from('week_overrides').delete().eq('id', id)
    if (dbErr('deleteWeekOverride', error)) return
    setWeekOverrides((p) => p.filter((o) => o.id !== id))
  }

  // ── Helper: horario efectivo de una semana (template + overrides) ──
  const getEffectiveWeekSlots = (centroId, weekStart) => {
    const plan = weekPlans.find((p) => p.centroId === centroId && p.weekStart === weekStart)
    if (!plan?.templateId) return []
    const slots = templateSlots.filter((s) => s.templateId === plan.templateId)
    const overrides = weekOverrides.filter((o) => o.centroId === centroId && o.weekStart === weekStart)
    return slots.map((slot) => {
      const effectiveSchedule = { ...slot.schedule }
      const slotOverrides = overrides.filter((o) => o.slotId === slot.id)
      slotOverrides.forEach((o) => { effectiveSchedule[o.day] = o.slot })
      return { ...slot, effectiveSchedule, hasOverrides: slotOverrides.length > 0, overrides: slotOverrides }
    })
  }

  // ── CRUD territorios ──
  const addTerritorio = async (t) => {
    const newT = { id: uuidv4(), name: t.name, color: t.color }
    const { error } = await supabase.from('territorios').insert(newT)
    if (dbErr('addTerritorio', error)) return
    setTerritorios((p) => [...p, newT])
  }

  const updateTerritorio = async (id, data) => {
    const { error } = await supabase.from('territorios').update(data).eq('id', id)
    if (dbErr('updateTerritorio', error)) return
    setTerritorios((p) => p.map((t) => t.id === id ? { ...t, ...data } : t))
  }

  const deleteTerritorio = async (id) => {
    const { error } = await supabase.from('territorios').delete().eq('id', id)
    if (dbErr('deleteTerritorio', error)) return
    const agIds = agencias.filter((a) => a.territorioId === id).map((a) => a.id)
    const centroIds = centros.filter((c) => agIds.includes(c.agenciaId)).map((c) => c.id)
    setDoctors((p) => p.filter((d) => !centroIds.includes(d.centroId)))
    setCentros((p) => p.filter((c) => !agIds.includes(c.agenciaId)))
    setAgencias((p) => p.filter((a) => a.territorioId !== id))
    setTerritorios((p) => p.filter((t) => t.id !== id))
  }

  // ── CRUD agencias ──
  const addAgencia = async (a) => {
    const newA = { id: uuidv4(), name: a.name, territorio_id: a.territorioId }
    const { error } = await supabase.from('agencias').insert(newA)
    if (dbErr('addAgencia', error)) return
    setAgencias((p) => [...p, mapAgencia(newA)])
  }

  const updateAgencia = async (id, data) => {
    const { error } = await supabase.from('agencias').update({ name: data.name }).eq('id', id)
    if (dbErr('updateAgencia', error)) return
    setAgencias((p) => p.map((a) => a.id === id ? { ...a, ...data } : a))
  }

  const deleteAgencia = async (id) => {
    const { error } = await supabase.from('agencias').delete().eq('id', id)
    if (dbErr('deleteAgencia', error)) return
    const centroIds = centros.filter((c) => c.agenciaId === id).map((c) => c.id)
    setDoctors((p) => p.filter((d) => !centroIds.includes(d.centroId)))
    setCentros((p) => p.filter((c) => c.agenciaId !== id))
    setAgencias((p) => p.filter((a) => a.id !== id))
  }

  // ── CRUD centros ──
  const addCentro = async (c) => {
    const newC = { id: uuidv4(), name: c.name, agencia_id: c.agenciaId, address: c.address ?? '', schedule: DEFAULT_CENTER_SCHEDULE }
    const { error } = await supabase.from('centros').insert(newC)
    if (dbErr('addCentro', error)) return
    setCentros((p) => [...p, mapCentro(newC)])
  }

  const updateCentro = async (id, data) => {
    const dbData = {}
    if (data.name     !== undefined) dbData.name     = data.name
    if (data.address  !== undefined) dbData.address  = data.address
    if (data.schedule !== undefined) dbData.schedule = data.schedule
    const { error } = await supabase.from('centros').update(dbData).eq('id', id)
    if (dbErr('updateCentro', error)) return
    setCentros((p) => p.map((c) => c.id === id ? { ...c, ...data } : c))
  }

  const deleteCentro = async (id) => {
    const { error } = await supabase.from('centros').delete().eq('id', id)
    if (dbErr('deleteCentro', error)) return
    setDoctors((p) => p.filter((d) => d.centroId !== id))
    setCentros((p) => p.filter((c) => c.id !== id))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4F8DF7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Cargando datos…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{
      activeCentroId: resolvedCentroId, setActiveCentroId,
      activeCentro,
      activeCenterSchedule, setActiveCenterSchedule,
      activeCanWrite,
      doctors: activeDoctors,
      addDoctor, updateDoctor, deleteDoctor,
      territorios, agencias,
      centros: accessibleCentros,   // solo los accesibles para el usuario
      allCentros: centros,          // todos (para PermissionsModal)
      addTerritorio, updateTerritorio, deleteTerritorio,
      addAgencia,    updateAgencia,    deleteAgencia,
      addCentro,     updateCentro,     deleteCentro,
      centerTemplates, templateSlots, weekPlans, weekOverrides,
      addTemplate, updateTemplate, deleteTemplate,
      addTemplateSlot, updateTemplateSlot, deleteTemplateSlot,
      setWeekPlan, upsertWeekOverride, deleteWeekOverride,
      getEffectiveWeekSlots,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
