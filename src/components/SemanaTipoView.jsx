import { useState, useMemo } from 'react'
import { useApp, CATEGORIES, DEFAULT_DOCTOR_TEMPLATE } from '../context/AppContext'
import DoctorPanel from './DoctorPanel'
import CoverageView from './CoverageView'

const CATEGORY_COLOR = { AP: '#3b82f6', MDT: '#10b981', TMT: '#f59e0b' }
const CATEGORY_STYLE = {
  AP:  { bg: '#dbeafe', text: '#1d4ed8' },
  MDT: { bg: '#d1fae5', text: '#065f46' },
  TMT: { bg: '#fef3c7', text: '#92400e' },
}

// Convierte un template_slot en un objeto con la misma forma que un "doctor"
// para que DoctorPanel y CoverageView puedan operar sobre él sin cambios.
function slotToDoctor(slot, idxInCategory) {
  const catLabel = CATEGORIES.find((c) => c.value === slot.category)?.label ?? slot.category
  return {
    id:             slot.id,
    name:           `${catLabel} – Turno ${idxInCategory + 1}`,
    category:       slot.category,
    color:          CATEGORY_COLOR[slot.category] ?? '#64748b',
    centroId:       null,
    weeklyTemplate: slot.schedule,
  }
}

// ── Tarjeta de semana tipo ────────────────────────────────────────────────────

function TemplateCard({ template, slots, isActive, onSelect, onRename, onDuplicate, onDelete }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(template.name)
  const counts = { AP: 0, MDT: 0, TMT: 0 }
  slots.forEach((s) => { if (counts[s.category] !== undefined) counts[s.category]++ })
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
        isActive ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {renaming ? (
        <div className="flex gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(name); setRenaming(false) }
              if (e.key === 'Escape') { setName(template.name); setRenaming(false) }
            }}
            className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
          />
          <button onClick={() => { onRename(name); setRenaming(false) }}
            className="text-xs text-blue-600 font-medium px-2">Ok</button>
          <button onClick={() => { setName(template.name); setRenaming(false) }}
            className="text-xs text-gray-400 px-1">✕</button>
        </div>
      ) : (
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {isActive && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
            <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
          </div>
          <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setRenaming(true)}
              title="Renombrar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={onDuplicate}
              title="Duplicar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button onClick={onDelete}
              title="Eliminar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {Object.entries(counts).map(([cat, n]) => n > 0 && (
          <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: CATEGORY_STYLE[cat].bg, color: CATEGORY_STYLE[cat].text }}>
            {n} {cat}
          </span>
        ))}
        {total === 0 && <span className="text-xs text-gray-400 italic">Sin turnos</span>}
      </div>
    </div>
  )
}

// ── Formulario de nueva semana tipo ──────────────────────────────────────────

function NewTemplateForm({ centroId, templates, onSave, onCancel, addTemplate }) {
  const [name, setName]       = useState('')
  const [sourceId, setSourceId] = useState('')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await addTemplate(centroId, name.trim(), sourceId || null)
    setSaving(false)
    onSave()
  }

  return (
    <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50/30 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm">Nueva semana tipo</h3>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
        <input autoFocus type="text" placeholder="ej: Semana Normal, Semana Verano…"
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
      </div>
      {templates.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Duplicar desde (opcional)</label>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">En blanco</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={!name.trim() || saving}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#4F8DF7,#3C6AD4)' }}>
          {saving ? 'Creando…' : 'Crear'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────

export default function SemanaTipoView() {
  const {
    activeCentroId, activeCentro, activeCanWrite,
    centerTemplates, templateSlots,
    addTemplate, updateTemplate, deleteTemplate,
    addTemplateSlot, updateTemplateSlot, deleteTemplateSlot,
  } = useApp()

  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [subView, setSubView]                   = useState('medicos')
  const [creating, setCreating]                 = useState(false)

  const centroId        = activeCentroId
  const centroTemplates = centerTemplates.filter((t) => t.centroId === centroId)

  // Si la plantilla activa fue eliminada, resetear
  const resolvedTemplateId = centroTemplates.some((t) => t.id === activeTemplateId)
    ? activeTemplateId
    : null

  // ── Adaptar template_slots → doctors virtuales ──
  const templateDoctors = useMemo(() => {
    if (!resolvedTemplateId) return []
    const slots = templateSlots.filter((s) => s.templateId === resolvedTemplateId)
    return slots.map((slot) => {
      const sameCat = slots.filter((s) => s.category === slot.category)
      return slotToDoctor(slot, sameCat.indexOf(slot))
    })
  }, [templateSlots, resolvedTemplateId])

  // ── CRUD adaptado para DoctorPanel ──
  const templateAddDoctor = ({ category }) =>
    addTemplateSlot(resolvedTemplateId, category, DEFAULT_DOCTOR_TEMPLATE)

  const templateUpdateDoctor = (id, data) => {
    const dbData = {}
    if (data.weeklyTemplate !== undefined) dbData.schedule  = data.weeklyTemplate
    if (data.category       !== undefined) dbData.category  = data.category
    return updateTemplateSlot(id, dbData)
  }

  const templateDeleteDoctor = (id) => deleteTemplateSlot(id)

  // ── Handlers ──
  const handleDuplicate = async (template) => {
    await addTemplate(centroId, `${template.name} (copia)`, template.id)
  }

  const handleDelete = (template) => {
    if (window.confirm(`¿Eliminar "${template.name}"? También se quitará de las semanas planificadas.`)) {
      deleteTemplate(template.id)
      if (resolvedTemplateId === template.id) setActiveTemplateId(null)
    }
  }

  const activeTemplate = centroTemplates.find((t) => t.id === resolvedTemplateId) ?? null

  return (
    <div className="space-y-5">

      {/* ── Encabezado + lista de templates ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Semanas Tipo</h2>
            <p className="text-xs text-gray-400 mt-0.5">{activeCentro?.name ?? 'Sin centro'}</p>
          </div>
          {activeCanWrite && !creating && (
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#4F8DF7,#3C6AD4)' }}>
              + Nueva semana tipo
            </button>
          )}
        </div>

        {creating && (
          <div className="mb-4">
            <NewTemplateForm
              centroId={centroId}
              templates={centroTemplates}
              addTemplate={addTemplate}
              onSave={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {centroTemplates.length === 0 && !creating ? (
          <p className="text-sm text-gray-400 italic text-center py-6">
            No hay semanas tipo para este centro. Crea una para comenzar.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {centroTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                slots={templateSlots.filter((s) => s.templateId === t.id)}
                isActive={resolvedTemplateId === t.id}
                onSelect={() => { setActiveTemplateId(t.id); setSubView('medicos') }}
                onRename={(name) => updateTemplate(t.id, { name })}
                onDuplicate={() => handleDuplicate(t)}
                onDelete={() => handleDelete(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Panel de edición (cuando hay template seleccionado) ── */}
      {activeTemplate && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Sub-nav */}
          <div className="flex items-center gap-0 border-b border-gray-100 px-5">
            <div className="flex items-center gap-1 mr-4 py-3">
              <span className="text-xs font-medium text-gray-400">Editando:</span>
              <span className="text-xs font-semibold text-gray-700">{activeTemplate.name}</span>
            </div>
            {[
              { id: 'medicos',   label: 'Médicos' },
              { id: 'cobertura', label: 'Cobertura' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSubView(id)}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={subView === id
                  ? { borderColor: '#4F8DF7', color: '#4F8DF7' }
                  : { borderColor: 'transparent', color: '#64748b' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div className="p-5">
            {subView === 'medicos' && (
              <DoctorPanel
                doctorsOverride={templateDoctors}
                addDoctorOverride={templateAddDoctor}
                updateDoctorOverride={templateUpdateDoctor}
                deleteDoctorOverride={templateDeleteDoctor}
                showCenterConfig={false}
                templateMode
              />
            )}
            {subView === 'cobertura' && (
              <CoverageView
                doctorsOverride={templateDoctors}
                updateDoctorOverride={templateUpdateDoctor}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
