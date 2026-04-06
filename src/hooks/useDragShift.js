import { useRef, useState, useEffect, useCallback } from 'react'
import { timeToMin, minToTime, getLunchBreak } from '../context/AppContext'

const SNAP = 15
const MIN_DURATION = 60
const LUNCH_DURATION = 30

function snap(min) {
  return Math.round(min / SNAP) * SNAP
}

function getLunchMins(slot) {
  if (slot.lunchStart && slot.lunchEnd) {
    return { start: timeToMin(slot.lunchStart), end: timeToMin(slot.lunchEnd) }
  }
  const lb = getLunchBreak(slot.start, slot.end)
  return { start: timeToMin(lb.start), end: timeToMin(lb.end) }
}

export function useDragShift({ slot, rangeStart, rangeWidth, trackRef, onChange }) {
  const [liveSlot, setLiveSlot] = useState(null)
  const [dragMode, setDragMode] = useState(null)

  // Toda la info de drag se guarda en ref para evitar stale closures
  const drag = useRef(null)

  const startDrag = useCallback((e, mode) => {
    e.preventDefault()
    e.stopPropagation()

    const lunch = getLunchMins(slot)

    drag.current = {
      mode,
      originX:        e.clientX,
      initStart:      timeToMin(slot.start),
      initEnd:        timeToMin(slot.end),
      initLunchStart: lunch.start,
      initLunchEnd:   lunch.end,
      rangeStart,
      rangeWidth,
    }

    setDragMode(mode)
    setLiveSlot({
      ...slot,
      lunchStart: minToTime(lunch.start),
      lunchEnd:   minToTime(lunch.end),
    })
  }, [slot, rangeStart, rangeWidth])

  useEffect(() => {
    if (!dragMode) return

    const onMove = (e) => {
      const d = drag.current
      if (!d || !trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      const deltaMin = snap(((e.clientX - d.originX) / rect.width) * d.rangeWidth)

      let { initStart: s, initEnd: en, initLunchStart: ls, initLunchEnd: le } = d

      if (d.mode === 'move') {
        const dur = en - s
        let newS = Math.max(d.rangeStart, Math.min(d.rangeStart + d.rangeWidth - dur, s + deltaMin))
        let newE = newS + dur
        const lOffset = ls - s
        ls = newS + lOffset
        le = ls + LUNCH_DURATION
        s = newS
        en = newE

      } else if (d.mode === 'left') {
        s = Math.max(d.rangeStart, Math.min(en - MIN_DURATION, s + deltaMin))
        // Colación no puede quedar antes del inicio
        if (ls < s + SNAP) { ls = s + SNAP; le = ls + LUNCH_DURATION }

      } else if (d.mode === 'right') {
        en = Math.min(d.rangeStart + d.rangeWidth, Math.max(s + MIN_DURATION, en + deltaMin))
        // Colación no puede quedar después del fin
        if (le > en - SNAP) { le = en - SNAP; ls = le - LUNCH_DURATION }

      } else if (d.mode === 'lunch') {
        const lDur = le - ls
        ls = Math.max(s + SNAP, Math.min(en - lDur - SNAP, ls + deltaMin))
        le = ls + LUNCH_DURATION
      }

      setLiveSlot({
        start:      minToTime(s),
        end:        minToTime(en),
        lunchStart: minToTime(ls),
        lunchEnd:   minToTime(le),
      })
    }

    const onUp = () => {
      drag.current = null
      setDragMode(null)
      // Leer valor actual con setter funcional para evitar stale closure
      setLiveSlot((current) => {
        if (current) onChange(current)
        return null
      })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragMode, trackRef, onChange])

  return {
    displaySlot: liveSlot ?? slot,
    dragMode,
    startDrag,
  }
}
