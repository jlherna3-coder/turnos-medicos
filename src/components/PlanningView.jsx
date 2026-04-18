import { useState, useMemo } from 'react'
import { useApp, DAYS, CATEGORIES, timeToMin, minToTime } from '../context/AppContext'

// ── Helpers de fecha ─────────────────────────────────────────────────────────

function getMonday(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addWeeks(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

function dateToStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function strToDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const MONTH_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatDateShort(d) {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

function formatWeekLabel(weekStart) {
  const start = strToDate(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 4) // viernes
  return `${formatDateShort(start)} – ${formatDateShort(end)} ${end.getFullYear()}`
}

function getWeekNumber(weekStart) {
  const d = strToDate(weekStart)
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
}

function generateWeeks() {
  const today = getMonday()
  return Array.from({ length: 28 }, (_, i) => dateToStr(addWeeks(today, i - 4)))
}

// ── FTE ──────────────────────────────────────────────────────────────────────

const FTE_MIN = 39 * 60  // 39 horas en minutos

function calcScheduleFTE(schedule) {
  if (!schedule) return 0
  return Object.values(schedule)
    .filter(Boolean)
    .reduce((sum, s) => {
      if (!s) return sum
      let min = timeToMin(s.end) - timeToMin(s.start) - 30 // colación 30 min
      if (s.absentFrom && s.absentTo) {
        min -= Math.max(timeToMin(s.absentTo) - timeToMin(s.absentFrom), 0)
      }
      return sum + Math.max(min, 0)
    }, 0) / FTE_MIN
}

function calcWeekFTE(effectiveSlots, useEffective = false) {
  return effectiveSlots.reduce((sum, slot) => {
    const sch = useEffective ? slot.effectiveSchedule : slot.schedule
    return sum + calcScheduleFTE(sch)
  }, 0)
}

function formatFTE(n) { return n.toFixed(2) }

function FTEBadge({ baseFTE, effectiveFTE, hasTemplate }) {
  if (!hasTemplate) return <span className="text-xs text-gray-300">—</span>
  const delta = effectiveFTE - baseFTE
  const hasDelta = Math.abs(delta) > 0.001
  return (
    <div className="text-right leading-tight">
      <span className="text-xs font-semibold text-gray-700">{formatFTE(hasDelta ? effectiveFTE : baseFTE)} FTE</span>
      {hasDelta && (
        <div className="text-xs font-medium" style={{ color: delta < 0 ? '#ef4444' : '#10b981' }}>
          {delta > 0 ? '+' : ''}{formatFTE(delta)}
        </div>
      )}
    </div>
  )
}

// ── Formato de override para mostrar ─────────────────────────────────────────

function formatOverrideSlot(slot) {
  if (!slot) return 'Ausente todo el día'
  if (slot.absentFrom && slot.absentTo) {
    return `Ausente ${slot.absentFrom}–${slot.absentTo}`
  }
  return `${slot.start} – ${slot.end}`
}

// ── Estilos por categoría ────────────────────────────────────────────────────

const CATEGORY_COLOR = { AP: '#3b82f6', MDT: '#10b981', TMT: '#f59e0b' }
const CATEGORY_STYLE = {
  AP:  { bg: '#dbeafe', text: '#1d4ed8' },
  MDT: { bg: '#d1fae5', text: '#065f46' },
  TMT: { bg: '#fef3c7', text: '#92400e' },
}

const DEFAULT_SLOT_SCHEDULE = {
  mon: { start: '08:00', end: '17:00' },
  tue: { start: '08:00', end: '17:00' },
  wed: { start: '08:00', end: '17:00' },
  thu: { start: '08:00', end: '17:00' },
  fri: { start: '08:00', end: '17:00' },
  sat: null,
  sun: null,
}

// ── Editor de horario por día ─────────────────────────────────────────────────

function SlotScheduleEditor({ schedule, onChange }) {
  return (
    <div className="space-y-1.5 mt-2">
      {DAYS.map(({ key, short }) => {
        const slot = schedule[key]
        const active = Boolean(slot)
        return (
          <div key={key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...schedule, [key]: active ? null : { start: '08:00', end: '17:00' } })}
              className="w-10 h-6 rounded text-xs font-semibold transition-colors flex-shrink-0"
              style={active ? { backgroundColor: '#4F8DF7', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}
            >
              {short}
            </button>
            {active ? (
              <div className="flex items-center gap-1.5">
                <input type="time" value={slot.start}
                  onChange={e => onChange({ ...schedule, [key]: { ...slot, start: e.target.value } })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-22 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                <span className="text-gray-400 text-xs">–</span>
                <input type="time" value={slot.end}
                  onChange={e => onChange({ ...schedule, [key]: { ...slot, end: e.target.value } })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-22 focus:outline-none focus:ring-1 focus:ring-blue-300" />
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Cerrado</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Editor de semana tipo ─────────────────────────────────────────────────────

function TemplateEditor({ centroId, initialTemplate, allTemplates, allSlots, onDone,
  addTemplate, addTemplateSlot, updateTemplateSlot, deleteTemplateSlot }) {

  const isEditing = Boolean(initialTemplate)
  const [step, setStep]             = useState(isEditing ? 2 : 1)
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? null)
  const [name, setName]             = useState(initialTemplate?.name ?? '')
  const [sourceId, setSourceId]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [expandedSlot, setExpandedSlot] = useState(null)

  const slots = allSlots.filter((s) => s.templateId === templateId)
  const centroTemplates = allTemplates.filter((t) => t.centroId === centroId && t.id !== templateId)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    const id = await addTemplate(centroId, name.trim(), sourceId || null)
    setSaving(false)
    if (id) { setTemplateId(id); setStep(2) }
  }

  if (step === 1) {
    return (
      <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50/30 space-y-4">
        <h3 className="font-semibold text-gray-900">Nueva semana tipo</h3>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
          <input autoFocus type="text" placeholder="ej: Semana Normal, Semana Verano…"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        {centroTemplates.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Copiar turnos desde</label>
            <select value={sourceId} onChange={e => setSourceId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="">En blanco</option>
              {centroTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleCreate} disabled={!name.trim() || saving}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#4F8DF7,#3C6AD4)' }}>
            {saving ? 'Creando…' : 'Continuar →'}
          </button>
          <button onClick={onDone} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50/30 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{isEditing ? initialTemplate.name : name}</h3>
        <button onClick={onDone} className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#4F8DF7,#3C6AD4)' }}>
          Listo
        </button>
      </div>

      {['AP', 'MDT', 'TMT'].map(cat => {
        const catSlots = slots.filter((s) => s.category === cat)
        const style = CATEGORY_STYLE[cat]
        const label = CATEGORIES.find((c) => c.value === cat)?.label ?? cat
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: style.bg, color: style.text }}>{label}</span>
              <button onClick={() => addTemplateSlot(templateId, cat, DEFAULT_SLOT_SCHEDULE)}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                + Agregar turno
              </button>
            </div>
            {catSlots.length === 0 && <p className="text-xs text-gray-400 italic ml-1">Sin turnos</p>}
            {catSlots.map((slot, idx) => (
              <div key={slot.id} className="ml-1 mb-2 bg-white border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Turno {idx + 1}</span>
                  <div className="flex gap-3">
                    <button onClick={() => setExpandedSlot(expandedSlot === slot.id ? null : slot.id)}
                      className="text-xs text-blue-500 hover:text-blue-700">
                      {expandedSlot === slot.id ? 'Cerrar' : 'Editar'}
                    </button>
                    <button onClick={() => deleteTemplateSlot(slot.id)}
                      className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                  </div>
                </div>
                {expandedSlot === slot.id ? (
                  <SlotScheduleEditor schedule={slot.schedule}
                    onChange={(s) => updateTemplateSlot(slot.id, { schedule: s })} />
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {DAYS.filter((d) => slot.schedule[d.key]).map((d) => d.short).join(' · ') || 'Sin días activos'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Tarjeta de semana tipo ────────────────────────────────────────────────────

function TemplateCard({ template, slots, onEdit, onDelete, onRename }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(template.name)
  const counts = { AP: 0, MDT: 0, TMT: 0 }
  slots.forEach((s) => { if (counts[s.category] !== undefined) counts[s.category]++ })

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      {renaming ? (
        <div className="flex gap-2 mb-3">
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(name); setRenaming(false) } if (e.key === 'Escape') { setName(template.name); setRenaming(false) } }}
            className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none" />
          <button onClick={() => { onRename(name); setRenaming(false) }} className="text-xs text-blue-600 font-medium">Ok</button>
          <button onClick={() => { setName(template.name); setRenaming(false) }} className="text-xs text-gray-400">✕</button>
        </div>
      ) : (
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => setRenaming(true)} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">Renombrar</button>
            <button onClick={onEdit} className="text-xs text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50">Editar</button>
            <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50">Eliminar</button>
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([cat, n]) => n > 0 && (
          <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: CATEGORY_STYLE[cat].bg, color: CATEGORY_STYLE[cat].text }}>
            {n} {cat}
          </span>
        ))}
        {Object.values(counts).every((n) => n === 0) && (
          <span className="text-xs text-gray-400 italic">Sin turnos</span>
        )}
      </div>
    </div>
  )
}

// ── Diagrama de cobertura de semana ──────────────────────────────────────────

function WeekCoverageChart({ effectiveSlots, centerSlot }) {
  const rangeStart = centerSlot ? timeToMin(centerSlot.start) : 7 * 60
  const rangeEnd   = centerSlot ? timeToMin(centerSlot.end)   : 22 * 60
  const rangeWidth = Math.max(rangeEnd - rangeStart, 60)

  // Show Monday's schedule (or first active day)
  const getBarForSlot = (slot) => {
    const day = DAYS.find((d) => slot.effectiveSchedule?.[d.key])
    if (!day) return null
    const s = slot.effectiveSchedule[day.key]
    if (!s) return null
    return { start: s.start, end: s.end, day: day.short }
  }

  const grouped = ['AP', 'MDT', 'TMT']
    .map((cat) => ({ cat, slots: effectiveSlots.filter((s) => s.category === cat) }))
    .filter((g) => g.slots.length > 0)

  if (grouped.length === 0) return <p className="text-xs text-gray-400 italic text-center py-4">Sin turnos definidos</p>

  const hourTicks = []
  const firstHour = Math.ceil(rangeStart / 60) * 60
  for (let m = firstHour; m <= rangeEnd; m += 60) {
    hourTicks.push({ m, left: ((m - rangeStart) / rangeWidth) * 100 })
  }

  return (
    <div className="mt-2">
      <div className="relative h-6 ml-28 mr-2">
        {hourTicks.map(({ m, left }) => (
          <div key={m} className="absolute flex flex-col items-center" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
            <div className="w-px h-2 bg-gray-300" />
            <span className="text-xs text-gray-400">{minToTime(m)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 mt-1">
        {grouped.map(({ cat, slots }) =>
          slots.map((slot, idx) => {
            const bar = getBarForSlot(slot)
            const leftPct  = bar ? ((timeToMin(bar.start) - rangeStart) / rangeWidth) * 100 : 0
            const widthPct = bar ? ((timeToMin(bar.end) - timeToMin(bar.start)) / rangeWidth) * 100 : 0
            return (
              <div key={slot.id} className="flex items-center gap-2">
                <div className="w-28 flex-shrink-0 flex items-center gap-1.5">
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ backgroundColor: CATEGORY_STYLE[cat].bg, color: CATEGORY_STYLE[cat].text }}>
                    {cat} {idx + 1}
                  </span>
                  {slot.hasOverrides && <span className="text-orange-400 text-xs" title="Tiene cambios">●</span>}
                </div>
                <div className="flex-1 relative rounded-lg border border-gray-100 bg-slate-50" style={{ height: 28 }}>
                  {hourTicks.slice(1).map(({ m, left }) => (
                    <div key={m} className="absolute top-0 bottom-0"
                      style={{ left: `${left}%`, borderLeft: '1px dashed #e2e8f0' }} />
                  ))}
                  {bar ? (
                    <div className="absolute top-1 bottom-1 rounded-md flex items-center justify-center"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: CATEGORY_COLOR[cat] }}>
                      {widthPct > 15 && (
                        <span className="text-white font-medium" style={{ fontSize: 10 }}>
                          {bar.start}–{bar.end}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 italic">Sin turno</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Formulario de cambio puntual ──────────────────────────────────────────────

function OverrideForm({ effectiveSlots, onSave, onCancel }) {
  const [slotId, setSlotId]         = useState('')
  const [day, setDay]               = useState('mon')
  const [type, setType]             = useState('absent')
  const [start, setStart]           = useState('08:00')
  const [end, setEnd]               = useState('17:00')
  const [absentFrom, setAbsentFrom] = useState('12:00')
  const [absentTo, setAbsentTo]     = useState('14:00')
  const [reason, setReason]         = useState('')

  // Al cambiar turno o día, pre-llenar horario desde la plantilla
  const selectedSlot = effectiveSlots.find((s) => s.id === slotId)
  const templateDaySlot = selectedSlot?.schedule?.[day]

  const handleSlotOrDayChange = (newSlotId, newDay) => {
    const s = effectiveSlots.find((x) => x.id === newSlotId)
    const tpl = s?.schedule?.[newDay]
    if (tpl) { setStart(tpl.start); setEnd(tpl.end) }
    if (newSlotId !== slotId) setSlotId(newSlotId)
    if (newDay !== day) setDay(newDay)
  }

  const handleSave = () => {
    if (!slotId) return
    let slot
    if (type === 'absent')       slot = null
    else if (type === 'custom')  slot = { start, end }
    else if (type === 'partial') slot = { start: templateDaySlot?.start ?? start, end: templateDaySlot?.end ?? end, absentFrom, absentTo }
    onSave({ slotId, day, slot, reason })
  }

  const TYPES = [
    { value: 'absent',  label: 'Ausente todo el día' },
    { value: 'partial', label: 'Ausencia parcial' },
    { value: 'custom',  label: 'Horario diferente' },
  ]

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Agregar cambio puntual</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Turno</label>
          <select value={slotId}
            onChange={e => handleSlotOrDayChange(e.target.value, day)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Seleccionar…</option>
            {effectiveSlots.map((slot) => {
              const idx = effectiveSlots.filter((s) => s.category === slot.category).indexOf(slot) + 1
              return <option key={slot.id} value={slot.id}>{slot.category} – Turno {idx}</option>
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Día</label>
          <select value={day}
            onChange={e => handleSlotOrDayChange(slotId, e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
      </div>

      {/* Horario base (referencia) */}
      {templateDaySlot && (
        <p className="text-xs text-gray-400">
          Horario base: <span className="font-medium text-gray-600">{templateDaySlot.start} – {templateDaySlot.end}</span>
        </p>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Tipo de cambio</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((opt) => (
            <button key={opt.value} type="button" onClick={() => setType(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={type === opt.value
                ? { background: '#4F8DF7', color: 'white', borderColor: '#4F8DF7' }
                : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ausencia parcial: horario de la ausencia dentro de la jornada */}
      {type === 'partial' && (
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-500">Ausente entre</label>
          <div className="flex items-center gap-2">
            <input type="time" value={absentFrom} onChange={e => setAbsentFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
            <span className="text-gray-400 text-xs">y</span>
            <input type="time" value={absentTo} onChange={e => setAbsentTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
          </div>
          {templateDaySlot && (
            <p className="text-xs text-gray-400">
              Impacto FTE del día: −{formatFTE((Math.max(timeToMin(absentTo) - timeToMin(absentFrom), 0)) / FTE_MIN)}
            </p>
          )}
        </div>
      )}

      {/* Horario diferente */}
      {type === 'custom' && (
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-500">Nuevo horario</label>
          <div className="flex items-center gap-2">
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
            <span className="text-gray-400">–</span>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
        <input type="text" placeholder="ej: Licencia médica, Capacitación, Citación…"
          value={reason} onChange={e => setReason(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={!slotId}
          className="px-4 py-1.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#4F8DF7,#3C6AD4)' }}>
          Guardar
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Fila de semana (expandible) ───────────────────────────────────────────────

function WeekRow({ weekStart, isCurrentWeek, isPast, plan, templates, effectiveSlots,
  overrides, centerSlot, canWrite, onAssign, onAddOverride, onDeleteOverride }) {

  const [expanded, setExpanded]           = useState(false)
  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const template   = templates.find((t) => t.id === plan?.templateId)
  const baseFTE    = calcWeekFTE(effectiveSlots, false)
  const effectiveFTE = calcWeekFTE(effectiveSlots, true)

  return (
    <div className={`border-b border-gray-100 last:border-0 transition-opacity ${isPast ? 'opacity-55' : ''}`}>
      <div
        className="flex items-center gap-3 py-2.5 px-1 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="w-14 text-center flex-shrink-0">
          {isCurrentWeek
            ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Hoy</span>
            : <span className="text-xs text-gray-400 font-medium">S{getWeekNumber(weekStart)}</span>}
        </div>
        <div className="w-48 flex-shrink-0">
          <span className="text-sm text-gray-700">{formatWeekLabel(weekStart)}</span>
        </div>
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          {canWrite ? (
            <select value={plan?.templateId ?? ''}
              onChange={e => onAssign(e.target.value || null)}
              className="border border-gray-200 rounded-lg px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 max-w-xs">
              <option value="">Sin asignar</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : (
            template
              ? <span className="text-sm text-gray-700">{template.name}</span>
              : <span className="text-sm text-gray-400 italic">Sin asignar</span>
          )}
        </div>
        <div className="w-28 flex-shrink-0 flex justify-end">
          <FTEBadge baseFTE={baseFTE} effectiveFTE={effectiveFTE} hasTemplate={Boolean(plan?.templateId)} />
        </div>
        <div className="w-24 text-center flex-shrink-0">
          {overrides.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              {overrides.length} cambio{overrides.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="w-5 flex-shrink-0 text-gray-400">
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="pb-5 px-3 space-y-4">
          {!plan?.templateId ? (
            <p className="text-sm text-gray-400 italic text-center py-6">
              Sin semana tipo asignada — usa el selector de arriba para asignar una.
            </p>
          ) : (
            <>
              <WeekCoverageChart effectiveSlots={effectiveSlots} centerSlot={centerSlot} />

              {overrides.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cambios puntuales</p>
                  {overrides.map((o) => {
                    const slot = effectiveSlots.find((s) => s.id === o.slotId)
                    const idx  = effectiveSlots.filter((s) => s.category === slot?.category).indexOf(slot) + 1
                    const dayLabel = DAYS.find((d) => d.key === o.day)?.label
                    return (
                      <div key={o.id} className="flex items-center gap-2 text-sm bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_STYLE[slot?.category]?.bg, color: CATEGORY_STYLE[slot?.category]?.text }}>
                          {slot?.category} {idx}
                        </span>
                        <span className="text-gray-600 flex-shrink-0">{dayLabel}:</span>
                        <span className="font-medium text-gray-800">
                          {formatOverrideSlot(o.slot)}
                        </span>
                        {o.reason && <span className="text-gray-400 text-xs truncate">({o.reason})</span>}
                        {canWrite && (
                          <button onClick={() => onDeleteOverride(o.id)} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {canWrite && !showOverrideForm && (
                <button onClick={() => setShowOverrideForm(true)}
                  className="text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar cambio puntual
                </button>
              )}
              {showOverrideForm && (
                <OverrideForm
                  effectiveSlots={effectiveSlots}
                  onSave={(data) => { onAddOverride(data); setShowOverrideForm(false) }}
                  onCancel={() => setShowOverrideForm(false)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────

export default function PlanningView() {
  const {
    activeCentroId, activeCentro, activeCenterSchedule, activeCanWrite,
    centerTemplates, templateSlots, weekPlans, weekOverrides,
    setWeekPlan, upsertWeekOverride, deleteWeekOverride,
    getEffectiveWeekSlots,
  } = useApp()

  const centroId        = activeCentroId
  const centroTemplates = centerTemplates.filter((t) => t.centroId === centroId)
  const weeks           = useMemo(() => generateWeeks(), [])
  const currentWeek     = dateToStr(getMonday())
  const centerSlot      = activeCenterSchedule?.mon ?? null

  return (
    <div className="space-y-5">

      {/* ── Calendario ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">Calendario de planificación</h2>
          <p className="text-xs text-gray-400 mt-0.5">4 semanas anteriores · semana actual · 23 semanas futuras</p>
        </div>

        {centroTemplates.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-6">
            Ve a <strong>Semanas Tipo</strong> y crea al menos una para poder planificar semanas.
          </p>
        ) : (
          <>
            {/* Cabecera de tabla */}
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100 px-1">
              <div className="w-14 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sem.</div>
              <div className="w-48 text-xs font-semibold text-gray-400 uppercase tracking-wide">Periodo</div>
              <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Semana tipo</div>
              <div className="w-28 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">FTE</div>
              <div className="w-24 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Cambios</div>
              <div className="w-5" />
            </div>

            {weeks.map((weekStart) => {
              const plan          = weekPlans.find((p) => p.centroId === centroId && p.weekStart === weekStart)
              const effectiveSlots = getEffectiveWeekSlots(centroId, weekStart)
              const overrides     = weekOverrides.filter((o) => o.centroId === centroId && o.weekStart === weekStart)
              return (
                <WeekRow
                  key={weekStart}
                  weekStart={weekStart}
                  isCurrentWeek={weekStart === currentWeek}
                  isPast={weekStart < currentWeek}
                  plan={plan}
                  templates={centroTemplates}
                  effectiveSlots={effectiveSlots}
                  overrides={overrides}
                  centerSlot={centerSlot}
                  canWrite={activeCanWrite}
                  onAssign={(templateId) => setWeekPlan(centroId, weekStart, templateId)}
                  onAddOverride={({ slotId, day, slot, reason }) =>
                    upsertWeekOverride(centroId, weekStart, slotId, day, slot, reason)}
                  onDeleteOverride={deleteWeekOverride}
                />
              )
            })}
          </>
        )}
      </div>

    </div>
  )
}
