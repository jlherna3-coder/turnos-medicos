import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const EMPTY = {
  patientName: '',
  doctorId: '',
  date: '',
  startTime: '',
  endTime: '',
  notes: '',
}

export default function AppointmentModal({ appointment, defaultDate, defaultDoctorId, onClose }) {
  const { doctors, addAppointment, updateAppointment, deleteAppointment } = useApp()
  const isEdit = Boolean(appointment)

  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (appointment) {
      setForm(appointment)
    } else {
      setForm({
        ...EMPTY,
        date: defaultDate || '',
        doctorId: defaultDoctorId || (doctors[0]?.id ?? ''),
        startTime: '09:00',
        endTime: '09:30',
      })
    }
  }, [appointment, defaultDate, defaultDoctorId])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      updateAppointment(appointment.id, form)
    } else {
      addAppointment(form)
    }
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm('¿Eliminar este turno?')) {
      deleteAppointment(appointment.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Editar turno' : 'Nuevo turno'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Paciente</label>
            <input
              required
              value={form.patientName}
              onChange={set('patientName')}
              placeholder="Nombre del paciente"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Médico</label>
            <select
              required
              value={form.doctorId}
              onChange={set('doctorId')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar médico</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
            <input
              required
              type="date"
              value={form.date}
              onChange={set('date')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora inicio</label>
              <input
                required
                type="time"
                value={form.startTime}
                onChange={set('startTime')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora fin</label>
              <input
                required
                type="time"
                value={form.endTime}
                onChange={set('endTime')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Motivo de consulta, observaciones..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Eliminar
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isEdit ? 'Guardar' : 'Crear turno'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
