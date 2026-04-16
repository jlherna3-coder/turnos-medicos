import { useState } from 'react'
import { timeToMin, getLunchBreak } from '../context/AppContext'
import { useDragShift } from '../hooks/useDragShift'

const HANDLE_PX = 10
const LUNCH_DURATION = 30

function getLunchMins(slot) {
  if (slot.lunchStart && slot.lunchEnd) {
    return { start: timeToMin(slot.lunchStart), end: timeToMin(slot.lunchEnd) }
  }
  const lb = getLunchBreak(slot.start, slot.end)
  return { start: timeToMin(lb.start), end: timeToMin(lb.end) }
}

function Tooltip({ text }) {
  return (
    <div
      className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-lg text-xs font-semibold text-white pointer-events-none whitespace-nowrap"
      style={{ background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
    >
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(15,23,42,0.88)' }} />
    </div>
  )
}

export default function DraggableShiftBar({ slot, color, rangeStart, rangeWidth, trackRef, onChange, showLunch, readOnly }) {
  const [hovered, setHovered] = useState(false)
  const { displaySlot, dragMode, startDrag } = useDragShift({ slot, rangeStart, rangeWidth, trackRef, onChange })

  const startMin = timeToMin(displaySlot.start)
  const endMin   = timeToMin(displaySlot.end)
  const duration = endMin - startMin

  const leftPct  = ((startMin - rangeStart) / rangeWidth) * 100
  const widthPct = (duration / rangeWidth) * 100

  const showLunchStripe = showLunch && duration > 60
  const lunch = showLunchStripe ? getLunchMins(displaySlot) : null

  const isDragging = Boolean(dragMode)
  const isHovered  = hovered || isDragging

  // Texto del tooltip según el modo de drag activo
  const tooltip =
    dragMode === 'left'  ? `Entrada: ${displaySlot.start}` :
    dragMode === 'right' ? `Salida: ${displaySlot.end}` :
    dragMode === 'lunch' ? `Colación: ${displaySlot.lunchStart} – ${displaySlot.lunchEnd}` :
    dragMode === 'move'  ? `${displaySlot.start} – ${displaySlot.end}` :
    null

  return (
    <div className="absolute inset-0" style={{ overflow: 'visible' }}>
      {/* ── Barra principal ── */}
      <div
        className="absolute top-1.5 bottom-1.5 rounded-xl select-none"
        style={{
          left:            `${leftPct}%`,
          width:           `${widthPct}%`,
          backgroundColor: color,
          cursor:          readOnly ? 'default' : isDragging && dragMode === 'move' ? 'grabbing' : 'grab',
          userSelect:      'none',
          boxShadow:       isDragging ? `0 4px 16px ${color}60` : isHovered ? `0 2px 8px ${color}40` : 'none',
          transition:      isDragging ? 'box-shadow 0.1s' : 'box-shadow 0.2s',
          zIndex:          isDragging ? 20 : 10,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={readOnly ? undefined : (e) => startDrag(e, 'move')}
      >
        {/* Etiqueta de horas */}
        {widthPct > 10 && (
          <span
            className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold pointer-events-none px-5"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {displaySlot.start} – {displaySlot.end}
          </span>
        )}

        {/* ── Handle izquierdo (entrada) ── */}
        <div
          title="Arrastrar para cambiar hora de entrada"
          className="absolute top-0 bottom-0 left-0 rounded-l-xl flex items-center justify-center gap-0.5 z-20"
          style={{
            width:      HANDLE_PX,
            cursor:     readOnly ? 'default' : 'ew-resize',
            opacity:    readOnly ? 0 : isHovered ? 1 : 0,
            background: 'rgba(0,0,0,0.18)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseDown={readOnly ? undefined : (e) => { e.stopPropagation(); startDrag(e, 'left') }}
        >
          <div className="w-px h-3.5 bg-white/80 rounded-full" />
          <div className="w-px h-3.5 bg-white/80 rounded-full" />
        </div>

        {/* ── Franja de colación ── */}
        {showLunchStripe && lunch && (
          <div
            title="Colación — arrastrar para mover"
            className="absolute top-0 bottom-0 z-10"
            style={{
              left:    `${((lunch.start - startMin) / duration) * 100}%`,
              width:   `${(LUNCH_DURATION / duration) * 100}%`,
              cursor:  readOnly ? 'default' : 'ew-resize',
              background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)',
              borderLeft:  '1.5px solid rgba(255,255,255,0.55)',
              borderRight: '1.5px solid rgba(255,255,255,0.55)',
            }}
            onMouseDown={readOnly ? undefined : (e) => { e.stopPropagation(); startDrag(e, 'lunch') }}
          />
        )}

        {/* ── Handle derecho (salida) ── */}
        <div
          title="Arrastrar para cambiar hora de salida"
          className="absolute top-0 bottom-0 right-0 rounded-r-xl flex items-center justify-center gap-0.5 z-20"
          style={{
            width:      HANDLE_PX,
            cursor:     readOnly ? 'default' : 'ew-resize',
            opacity:    readOnly ? 0 : isHovered ? 1 : 0,
            background: 'rgba(0,0,0,0.18)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseDown={readOnly ? undefined : (e) => { e.stopPropagation(); startDrag(e, 'right') }}
        >
          <div className="w-px h-3.5 bg-white/80 rounded-full" />
          <div className="w-px h-3.5 bg-white/80 rounded-full" />
        </div>
      </div>

      {/* ── Tooltip durante drag ── */}
      {tooltip && (
        <div
          className="absolute"
          style={{ left: `${leftPct + widthPct / 2}%`, top: 0, zIndex: 50, overflow: 'visible' }}
        >
          <Tooltip text={tooltip} />
        </div>
      )}
    </div>
  )
}
