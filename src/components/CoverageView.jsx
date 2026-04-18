import { useState, useRef } from 'react'
import { useApp, CATEGORIES, DAYS, timeToMin, minToTime } from '../context/AppContext'
import DraggableShiftBar from './DraggableShiftBar'

const CATEGORY_ORDER = ['AP', 'MDT', 'TMT']

const CATEGORY_STYLE = {
  AP:  { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  MDT: { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  TMT: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
}

// ── Grid y eje de tiempo ────────────────────────────────────────────────────

function GridLines({ rangeStart, rangeEnd, rangeWidth }) {
  const lines = []
  const firstHour = Math.ceil(rangeStart / 60) * 60
  for (let m = firstHour; m < rangeEnd; m += 60) {
    const left = ((m - rangeStart) / rangeWidth) * 100
    lines.push(
      <div key={m} className="absolute top-0 bottom-0"
        style={{ left: `${left}%`, borderLeft: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
    )
  }
  return <>{lines}</>
}

function TimeAxis({ rangeStart, rangeEnd, rangeWidth }) {
  const ticks = []
  const firstHour = Math.ceil(rangeStart / 60) * 60
  for (let m = firstHour; m <= rangeEnd; m += 60) {
    const left = ((m - rangeStart) / rangeWidth) * 100
    ticks.push(
      <div key={m} className="absolute flex flex-col items-center"
        style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
        <div className="w-px h-2 bg-gray-300 mb-0.5" />
        <span className="text-xs font-medium text-gray-400">{minToTime(m)}</span>
      </div>
    )
  }
  return (
    <div className="relative h-8 ml-44 mr-2">
      {ticks}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
    </div>
  )
}

// ── Fila del centro (no editable) ──────────────────────────────────────────

function CenterRow({ slot, rangeStart, rangeWidth }) {
  if (!slot) return null
  const s = timeToMin(slot.start)
  const e = timeToMin(slot.end)
  const leftPct  = ((s - rangeStart) / rangeWidth) * 100
  const widthPct = ((e - s) / rangeWidth) * 100

  return (
    <div className="flex items-center gap-3">
      <div className="w-44 flex-shrink-0 flex items-center gap-2.5 pr-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-700" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Centro</p>
        </div>
      </div>
      <div className="flex-1 relative rounded-xl border border-slate-200"
        style={{ height: 40, backgroundColor: '#f8fafc' }}>
        <GridLines rangeStart={rangeStart} rangeEnd={rangeStart + rangeWidth} rangeWidth={rangeWidth} />
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl flex items-center justify-center"
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: '#1e293b' }}
        >
          {widthPct > 8 && (
            <span className="text-white text-xs font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {slot.start} – {slot.end}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Fila de médico (editable con drag) ─────────────────────────────────────

function DoctorRow({ doc, selectedDay, rangeStart, rangeWidth, onSlotChange }) {
  const trackRef = useRef(null)
  const slot = doc.weeklyTemplate?.[selectedDay]

  return (
    <div className="flex items-center gap-3 group">
      <div className="w-44 flex-shrink-0 flex items-center gap-2.5 pr-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: slot ? doc.color : '#cbd5e1' }}
        />
        <p className={`text-sm truncate ${slot ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          {doc.name}
        </p>
      </div>

      <div
        ref={trackRef}
        className="flex-1 relative rounded-xl border transition-shadow"
        style={{
          height: 40,
          backgroundColor: '#f8fafc',
          borderColor: '#e2e8f0',
          overflow: 'visible',   // necesario para el tooltip -top-8
        }}
      >
        <GridLines rangeStart={rangeStart} rangeEnd={rangeStart + rangeWidth} rangeWidth={rangeWidth} />

        {slot ? (
          <DraggableShiftBar
            slot={slot}
            color={doc.color}
            rangeStart={rangeStart}
            rangeWidth={rangeWidth}
            trackRef={trackRef}
            showLunch
            onChange={onSlotChange ?? (() => {})}
            readOnly={!onSlotChange}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-400 italic">Sin turno este día</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Vista principal ─────────────────────────────────────────────────────────

export default function CoverageView({ doctorsOverride, updateDoctorOverride } = {}) {
  const ctx = useApp()
  const doctors     = doctorsOverride      ?? ctx.doctors
  const updateDoctor = updateDoctorOverride ?? ctx.updateDoctor
  const { activeCenterSchedule: centerSchedule, activeCentro, activeCanWrite } = ctx
  const [selectedDay, setSelectedDay] = useState('mon')

  const centerSlot = centerSchedule?.[selectedDay]
  const rangeStart = centerSlot ? timeToMin(centerSlot.start) : 7 * 60
  const rangeEnd   = centerSlot ? timeToMin(centerSlot.end)   : 22 * 60
  const rangeWidth = Math.max(rangeEnd - rangeStart, 60)

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    style: CATEGORY_STYLE[cat],
    label: CATEGORIES.find((c) => c.value === cat)?.label ?? cat,
    docs:  doctors.filter((d) => d.category === cat),
  }))

  const totalActive = doctors.filter((d) => Boolean(d.weeklyTemplate?.[selectedDay])).length
  const uncovered   = grouped.filter(({ docs }) =>
    docs.length > 0 && !docs.some((d) => Boolean(d.weeklyTemplate?.[selectedDay]))
  )

  const handleSlotChange = (docId, newSlot) => {
    const doc = doctors.find((d) => d.id === docId)
    if (!doc) return
    updateDoctor(docId, {
      weeklyTemplate: { ...doc.weeklyTemplate, [selectedDay]: newSlot },
    })
  }

  return (
    <div className="space-y-5">

      {/* ── Selector de día ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {DAYS.map(({ key, short, label }) => {
            const hasCenter = Boolean(centerSchedule?.[key])
            const active    = selectedDay === key
            const slot      = centerSchedule?.[key]
            return (
              <button
                key={key}
                onClick={() => hasCenter && setSelectedDay(key)}
                disabled={!hasCenter}
                title={slot ? `${label}: ${slot.start} – ${slot.end}` : `${label} — Centro cerrado`}
                className="flex flex-col items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? { background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color:'white', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }
                    : hasCenter
                    ? { background:'#f8fafc', color:'#475569', border:'1px solid #e2e8f0' }
                    : { background:'#f1f5f9', color:'#cbd5e1', cursor:'not-allowed', border:'1px solid transparent' }
                }
              >
                <span className="font-semibold">{short}</span>
                {slot && (
                  <span className={`text-xs mt-0.5 ${active ? 'text-blue-100' : 'text-gray-400'}`}>
                    {slot.start}
                  </span>
                )}
              </button>
            )
          })}

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {activeCentro?.name ?? 'Sin centro'}
              </p>
              <p className="text-xs text-gray-400">
                {totalActive} activo{totalActive !== 1 ? 's' : ''} · {centerSlot ? `${centerSlot.start} – ${centerSlot.end}` : 'Cerrado'}
              </p>
            </div>
            {uncovered.length > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-1.5 rounded-xl">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Sin cobertura: {uncovered.map((g) => g.cat).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Diagrama ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
        <p className="md:hidden text-xs text-gray-400 mb-3 text-center">← Desliza para ver el diagrama →</p>
        <div className="overflow-x-auto" style={{ overflow: 'visible' }}>

        <TimeAxis rangeStart={rangeStart} rangeEnd={rangeEnd} rangeWidth={rangeWidth} />

        <div className="mt-3 space-y-2">

          {/* Fila del centro */}
          <CenterRow slot={centerSlot} rangeStart={rangeStart} rangeWidth={rangeWidth} />

          <div className="ml-44 border-t border-dashed border-gray-200 my-3" />

          {/* Grupos por categoría */}
          {grouped.map(({ cat, style, label, docs }) => {
            const activeDocs = docs.filter((d) => Boolean(d.weeklyTemplate?.[selectedDay]))
            const hasAlert   = docs.length > 0 && activeDocs.length === 0

            return (
              <div key={cat} className="space-y-1.5">
                {/* Cabecera de categoría */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-44 flex-shrink-0" />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: style.bg, color: style.text }}>
                      {label}
                    </span>
                    {hasAlert && (
                      <span className="text-xs text-red-500 font-medium">⚠ Sin cobertura</span>
                    )}
                    {activeDocs.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {activeDocs.length}/{docs.length} activo{activeDocs.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {docs.length === 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-44 flex-shrink-0" />
                    <p className="text-xs text-gray-400 italic">Sin médicos en esta categoría</p>
                  </div>
                ) : (
                  docs.map((doc) => (
                    <DoctorRow
                      key={doc.id}
                      doc={doc}
                      selectedDay={selectedDay}
                      rangeStart={rangeStart}
                      rangeWidth={rangeWidth}
                      onSlotChange={activeCanWrite ? (newSlot) => handleSlotChange(doc.id, newSlot) : null}
                    />
                  ))
                )}

                <div className="ml-44 border-t border-gray-100 mt-2" />
              </div>
            )
          })}
        </div>

        {/* ── Leyenda ── */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#1e293b' }} />
            <span className="text-xs text-gray-500">Horario del centro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded bg-blue-400" />
            <span className="text-xs text-gray-500">Turno médico (arrastrar para mover)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded"
              style={{ background: 'repeating-linear-gradient(45deg,#94a3b8 0px,#94a3b8 2px,#e2e8f0 2px,#e2e8f0 5px)' }} />
            <span className="text-xs text-gray-500">Colación (arrastrar para ajustar)</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-gray-400">Bordes = ajustar entrada/salida</span>
          </div>
        </div>
        </div>{/* cierre overflow-x-auto */}
      </div>
    </div>
  )
}
