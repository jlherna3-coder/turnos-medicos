import { useState } from 'react'
import { useApp, CATEGORIES, DAYS, timeToMin } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const FTE_FULL_HOURS = 39

function calcFTE(weeklyTemplate) {
  if (!weeklyTemplate) return 0
  const totalMin = Object.values(weeklyTemplate)
    .filter(Boolean)
    .reduce((sum, slot) => {
      const worked = timeToMin(slot.end) - timeToMin(slot.start) - 30 // 30 min colación
      return sum + Math.max(worked, 0)
    }, 0)
  return totalMin / (FTE_FULL_HOURS * 60)
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

const DEFAULT_TEMPLATE = {
  mon: { start: '08:00', end: '17:00' },
  tue: { start: '08:00', end: '17:00' },
  wed: { start: '08:00', end: '17:00' },
  thu: { start: '08:00', end: '17:00' },
  fri: { start: '08:00', end: '17:00' },
  sat: null,
  sun: null,
}

const CATEGORY_BADGE = {
  AP:  { bg: '#dbeafe', text: '#1d4ed8' },
  MDT: { bg: '#d1fae5', text: '#065f46' },
  TMT: { bg: '#fef3c7', text: '#92400e' },
}

// ── Editor de horario semanal ───────────────────────────────────────────────
function WeeklyScheduleEditor({ template, onChange }) {
  const tpl = template ?? DEFAULT_TEMPLATE

  const toggleDay = (key) =>
    onChange({ ...tpl, [key]: tpl[key] ? null : { start: '08:00', end: '17:00' } })

  const setTime = (key, field, val) =>
    onChange({ ...tpl, [key]: { ...tpl[key], [field]: val } })

  return (
    <div className="space-y-1">
      {DAYS.map(({ key, label }) => {
        const active = Boolean(tpl[key])
        return (
          <div key={key} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <label className="flex items-center gap-2.5 w-28 cursor-pointer select-none">
              <div
                onClick={() => toggleDay(key)}
                className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${active ? 'bg-blue-600' : 'bg-white border-2 border-gray-300'}`}
              >
                {active && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{label}</span>
            </label>
            {active ? (
              <div className="flex items-center gap-2">
                <input type="time" value={tpl[key].start}
                  onChange={(e) => setTime(key, 'start', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input type="time" value={tpl[key].end}
                  onChange={(e) => setTime(key, 'end', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Libre</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Config horario del centro ──────────────────────────────────────────────
function CenterScheduleConfig() {
  const { activeCenterSchedule: centerSchedule, setActiveCenterSchedule: setCenterSchedule, activeCentro, activeCanWrite } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f172a, #334155)' }}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Horario del Centro Médico</p>
          <p className="text-xs text-gray-500 mt-0.5">Días y horas de funcionamiento</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {!activeCanWrite && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-4">
              Solo lectura — no tienes permiso de escritura en este centro.
            </p>
          )}
          <div className="mt-4" style={{ pointerEvents: activeCanWrite ? 'auto' : 'none', opacity: activeCanWrite ? 1 : 0.6 }}>
            <WeeklyScheduleEditor
              template={centerSchedule}
              onChange={setCenterSchedule}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Formulario de médico ───────────────────────────────────────────────────
function DoctorForm({ initial, onSave, onCancel, templateMode = false }) {
  const [form, setForm] = useState(
    initial ?? { name: '', category: 'AP', color: '#3b82f6', weeklyTemplate: DEFAULT_TEMPLATE }
  )
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          {initial ? (templateMode ? 'Editar turno' : 'Editar médico') : (templateMode ? 'Nuevo turno' : 'Nuevo médico')}
        </h3>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="p-5 space-y-5">
        {/* Nombre + categoría — nombre oculto en templateMode */}
        <div className={templateMode ? '' : 'grid grid-cols-2 gap-4'}>
          {!templateMode && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
              <input
                required value={form.name} onChange={set('name')}
                placeholder="Ej: Dr. Pérez"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Categoría</label>
            <select
              value={form.category} onChange={set('category')}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Color — oculto en templateMode */}
        {!templateMode && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Color de identificación</label>
            <div className="flex gap-2.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full transition-all duration-150 hover:scale-110"
                  style={{
                    backgroundColor: c,
                    boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Horario */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Horario semanal</label>
          <WeeklyScheduleEditor
            template={form.weeklyTemplate}
            onChange={(tpl) => setForm((f) => ({ ...f, weeklyTemplate: tpl }))}
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-2.5 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 text-sm font-medium rounded-xl text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Tarjeta de médico ──────────────────────────────────────────────────────
const DAYS_ABBR = ['mon','tue','wed','thu','fri','sat','sun']
const DAYS_SHORT = { mon:'L', tue:'M', wed:'X', thu:'J', fri:'V', sat:'S', sun:'D' }

function DoctorCard({ doc, onEdit, onDelete }) {
  const badge = CATEGORY_BADGE[doc.category] ?? { bg: '#f3f4f6', text: '#374151' }
  const catLabel = CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category
  const activeDays = DAYS_ABBR.filter((k) => Boolean(doc.weeklyTemplate?.[k]))
  const firstSlot = doc.weeklyTemplate ? Object.values(doc.weeklyTemplate).find(Boolean) : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-start gap-4 hover:shadow-md transition-shadow">
      {/* Avatar con color */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
        style={{ backgroundColor: doc.color }}
      >
        {doc.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {catLabel}
          </span>
        </div>

        {/* Días activos + FTE */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {DAYS_ABBR.map((key) => {
            const active = Boolean(doc.weeklyTemplate?.[key])
            return (
              <span
                key={key}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold"
                style={active
                  ? { backgroundColor: doc.color, color: 'white' }
                  : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}
                title={active ? `${doc.weeklyTemplate[key].start} – ${doc.weeklyTemplate[key].end}` : 'Libre'}
              >
                {DAYS_SHORT[key]}
              </span>
            )
          })}
          {firstSlot && (
            <span className="text-xs text-gray-400 ml-1">{firstSlot.start} – {firstSlot.end}</span>
          )}
          <span
            className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}
            title="Full Time Equivalent"
          >
            {calcFTE(doc.weeklyTemplate).toFixed(2)} FTE
          </span>
        </div>
      </div>

      {/* Acciones */}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button onClick={onEdit}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Editar">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Eliminar">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Panel principal ────────────────────────────────────────────────────────
const CATEGORY_ORDER = ['AP', 'MDT', 'TMT']

export default function DoctorPanel({
  doctorsOverride,
  addDoctorOverride,
  updateDoctorOverride,
  deleteDoctorOverride,
  showCenterConfig = true,
  templateMode = false,
} = {}) {
  const ctx = useApp()
  const doctors     = doctorsOverride      ?? ctx.doctors
  const addDoctor   = addDoctorOverride    ?? ctx.addDoctor
  const updateDoctor = updateDoctorOverride ?? ctx.updateDoctor
  const deleteDoctor = deleteDoctorOverride ?? ctx.deleteDoctor
  const { activeCentro, activeCanWrite } = ctx
  const canWrite = activeCanWrite
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    label: CATEGORIES.find((c) => c.value === cat)?.label,
    badge: CATEGORY_BADGE[cat],
    docs: doctors.filter((d) => d.category === cat),
  }))

  const totalDocs = doctors.length
  const totalFTE  = doctors.reduce((sum, d) => sum + calcFTE(d.weeklyTemplate), 0)

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORY_ORDER.map((cat) => {
          const catDocs = doctors.filter((d) => d.category === cat)
          const count   = catDocs.length
          const fte     = catDocs.reduce((sum, d) => sum + calcFTE(d.weeklyTemplate), 0)
          const badge   = CATEGORY_BADGE[cat]
          const label   = CATEGORIES.find((c) => c.value === cat)?.label
          return (
            <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: badge.text }}>{label}</p>
              <p className="text-xs text-gray-400 mt-1">{fte.toFixed(2)} FTE</p>
            </div>
          )
        })}
      </div>

      {/* FTE total */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">FTE total del centro</p>
          <p className="text-xs text-gray-400 mt-0.5">Horas semanales trabajadas ÷ 39 hrs (jornada completa)</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{totalFTE.toFixed(2)}</p>
          <p className="text-xs text-gray-400">de {totalDocs} médico{totalDocs !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Horario del centro */}
      {showCenterConfig && <CenterScheduleConfig />}

      {/* Header sección médicos */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Equipo Médico
            {activeCentro && <span className="ml-2 text-xs font-normal text-gray-400">— {activeCentro.name}</span>}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{totalDocs} médico{totalDocs !== 1 ? 's' : ''} registrado{totalDocs !== 1 ? 's' : ''}</p>
        </div>
        {!adding && canWrite && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {templateMode ? 'Agregar turno' : 'Agregar médico'}
          </button>
        )}
      </div>

      {adding && (
        <DoctorForm
          templateMode={templateMode}
          onSave={(f) => { addDoctor(f); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Grupos por categoría */}
      {grouped.map(({ cat, label, badge, docs }) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-2.5">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {label}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">{docs.length}</span>
          </div>

          {docs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-5 py-4 text-center">
              <p className="text-xs text-gray-400">Sin médicos en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) =>
                editingId === doc.id ? (
                  <DoctorForm
                    key={doc.id}
                    initial={doc}
                    templateMode={templateMode}
                    onSave={(f) => { updateDoctor(doc.id, f); setEditingId(null) }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <DoctorCard
                    key={doc.id}
                    doc={doc}
                    onEdit={canWrite ? () => setEditingId(doc.id) : null}
                    onDelete={canWrite ? () => window.confirm(`¿Eliminar a ${doc.name}?`) && deleteDoctor(doc.id) : null}
                  />
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
