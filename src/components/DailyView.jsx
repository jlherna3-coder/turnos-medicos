import { useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useApp } from '../context/AppContext'
import ShiftModal from './ShiftModal'

export default function DailyView() {
  const { doctors, shifts, updateShift } = useApp()
  const [modal, setModal] = useState(null)

  const resources = doctors.map((d) => ({
    id: d.id,
    title: d.name,
    extendedProps: { specialty: d.specialty, color: d.color },
  }))

  const events = shifts.map((s) => {
    const doctor = doctors.find((d) => d.id === s.doctorId)
    return {
      id: s.id,
      resourceId: s.doctorId,
      title: doctor?.name ?? '',
      start: `${s.date}T${s.startTime}`,
      end: `${s.date}T${s.endTime}`,
      backgroundColor: doctor?.color ?? '#6b7280',
      borderColor: doctor?.color ?? '#6b7280',
    }
  })

  const handleDateClick = useCallback((info) => {
    setModal({
      defaultDate: info.dateStr.split('T')[0],
      defaultDoctorId: info.resource?.id ?? '',
    })
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
      const doctorId = info.event.getResources()[0]?.id ?? s.doctorId
      updateShift(s.id, {
        date,
        startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
        doctorId,
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Vista por médico · Arrastra para cambiar horario o reasignar médico
      </p>
      <div className="flex-1">
        <FullCalendar
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          locale="es"
          firstDay={1}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          editable
          resources={resources}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="100%"
          buttonText={{ today: 'Hoy' }}
          resourceLabelContent={(arg) => {
            const { color, specialty } = arg.resource.extendedProps
            return (
              <div className="text-center py-1">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-sm text-gray-900">{arg.resource.title}</span>
                </div>
                <div className="text-xs text-gray-500">{specialty}</div>
              </div>
            )
          }}
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
