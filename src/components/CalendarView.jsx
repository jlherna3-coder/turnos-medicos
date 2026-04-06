import { useState, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useApp } from '../context/AppContext'
import ShiftModal from './ShiftModal'

// Obtiene el lunes de la semana visible en el calendario
function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export default function CalendarView() {
  const { doctors, shifts, updateShift, generateWeekShifts } = useApp()
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const calendarRef = useRef(null)

  const events = shifts.map((s) => {
    const doctor = doctors.find((d) => d.id === s.doctorId)
    return {
      id: s.id,
      title: doctor?.name ?? 'Sin médico',
      start: `${s.date}T${s.startTime}`,
      end: `${s.date}T${s.endTime}`,
      backgroundColor: doctor?.color ?? '#6b7280',
      borderColor: doctor?.color ?? '#6b7280',
    }
  })

  const handleDateClick = useCallback((info) => {
    setModal({ defaultDate: info.dateStr.split('T')[0], defaultDoctorId: '' })
  }, [])

  const handleEventClick = useCallback(
    (info) => {
      const shift = shifts.find((s) => s.id === info.event.id)
      if (shift) setModal({ shift })
    },
    [shifts]
  )

  const handleEventDrop = useCallback(
    (info) => {
      const s = shifts.find((sh) => sh.id === info.event.id)
      if (!s) return
      const start = info.event.start
      const end = info.event.end ?? start
      const pad = (n) => String(n).padStart(2, '0')
      const date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
      updateShift(s.id, {
        date,
        startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
      })
    },
    [shifts, updateShift]
  )

  const handleEventResize = useCallback(
    (info) => {
      const s = shifts.find((sh) => sh.id === info.event.id)
      if (!s) return
      const end = info.event.end
      const pad = (n) => String(n).padStart(2, '0')
      updateShift(s.id, { endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}` })
    },
    [shifts, updateShift]
  )

  const handleApplyTemplate = () => {
    const api = calendarRef.current?.getApi()
    const visibleDate = api ? api.getDate() : new Date()
    const monday = getMondayOf(visibleDate)
    const added = generateWeekShifts(monday)
    if (added === 0) {
      setToast('Ya existen turnos para esta semana.')
    } else {
      setToast(`Se generaron ${added} turno${added !== 1 ? 's' : ''} para esta semana.`)
    }
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full flex flex-col gap-3">
      {/* Toolbar extra */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Haz click en un slot para agregar un turno · Arrastra para mover o redimensionar
        </p>
        <button
          onClick={handleApplyTemplate}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
        >
          Aplicar plantilla a esta semana
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg">
          {toast}
        </div>
      )}

      <div className="flex-1">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="es"
          firstDay={1}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          editable
          selectable
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="100%"
          buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
          eventContent={(arg) => (
            <div className="px-1 py-0.5 overflow-hidden">
              <div className="font-semibold text-xs truncate">{arg.event.title}</div>
              <div className="text-xs opacity-90">
                {arg.timeText}
              </div>
            </div>
          )}
        />
      </div>

      {modal && (
        <ShiftModal
          shift={modal.shift}
          defaultDate={modal.defaultDate}
          defaultDoctorId={modal.defaultDoctorId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
