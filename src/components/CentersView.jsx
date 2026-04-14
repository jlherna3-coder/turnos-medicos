import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

// ── Íconos ───────────────────────────────────────────────────────────────────

const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const IconDelete = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const IconChevron = ({ open }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)
const IconPlus = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const IconCheck = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

// ── Formulario genérico ───────────────────────────────────────────────────────

function InlineForm({ fields, initial, onSave, onCancel, showColorPicker }) {
  const [form, setForm] = useState(initial ?? fields.reduce((a, f) => ({ ...a, [f.key]: '' }), {}))
  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-3"
    >
      <div className="grid gap-3" style={{ gridTemplateColumns: fields.length > 1 ? '1fr 1fr' : '1fr' }}>
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              required={f.required !== false}
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder ?? ''}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        ))}
      </div>

      {showColorPicker && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} type="button"
                onClick={() => setForm((p) => ({ ...p, color: c }))}
                className="w-7 h-7 rounded-full transition-all hover:scale-110"
                style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit"
          className="flex-1 py-2 text-xs font-medium rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
          Guardar
        </button>
      </div>
    </form>
  )
}

// ── Tarjeta de centro ─────────────────────────────────────────────────────────

function CenterCard({ centro, territorioColor, isActive, onSelect, onEdit, onDelete }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group
        ${isActive
          ? 'border-blue-300 bg-blue-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
        }`}
      onClick={onSelect}
    >
      {/* Indicador de activo */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
          isActive ? 'text-white' : 'text-gray-400'
        }`}
        style={{ backgroundColor: isActive ? territorioColor : territorioColor + '18' }}
      >
        {isActive
          ? <IconCheck />
          : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
            {centro.name}
          </p>
          {isActive && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-blue-600 text-white flex-shrink-0">
              Activo
            </span>
          )}
        </div>
        {centro.address && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{centro.address}</p>
        )}
      </div>

      {/* Acciones — solo si hay handlers */}
      {(onEdit || onDelete) && (
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <IconEdit />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <IconDelete />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sección de agencia (cerrada por defecto) ──────────────────────────────────

function AgencySection({ agencia, centros, territorioColor, activeCentroId, onSelectCentro, onUpdateAgencia, onDeleteAgencia, onAddCentro, onUpdateCentro, onDeleteCentro }) {
  // Empieza cerrado; si tiene el centro activo, se abre automáticamente
  const hasActive = centros.some((c) => c.id === activeCentroId)
  const [open, setOpen] = useState(hasActive)
  const [editing, setEditing] = useState(false)
  const [addingCentro, setAddingCentro] = useState(false)
  const [editingCentroId, setEditingCentroId] = useState(null)

  if (editing) {
    return (
      <InlineForm
        fields={[{ key: 'name', label: 'Nombre de agencia', placeholder: 'Agencia ...', required: true }]}
        initial={{ name: agencia.name }}
        onSave={(f) => { onUpdateAgencia(agencia.id, f); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className="text-gray-400"><IconChevron open={open} /></span>
          <span className="text-xs font-semibold text-gray-700 truncate">{agencia.name}</span>
          <span className="text-xs text-gray-400 ml-1">({centros.length})</span>
          {hasActive && !open && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </button>
        {(onUpdateAgencia || onDeleteAgencia) && (
          <div className="flex items-center gap-1">
            {onUpdateAgencia && (
              <button onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white transition-colors">
                <IconEdit />
              </button>
            )}
            {onDeleteAgencia && (
              <button onClick={() => window.confirm(`¿Eliminar agencia "${agencia.name}" y sus centros?`) && onDeleteAgencia(agencia.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-colors">
                <IconDelete />
              </button>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {centros.map((c) =>
            editingCentroId === c.id ? (
              <InlineForm
                key={c.id}
                fields={[
                  { key: 'name',    label: 'Nombre del centro', placeholder: 'CESFAM ...', required: true },
                  { key: 'address', label: 'Dirección',          placeholder: 'Opcional',  required: false },
                ]}
                initial={{ name: c.name, address: c.address }}
                onSave={(f) => { onUpdateCentro(c.id, f); setEditingCentroId(null) }}
                onCancel={() => setEditingCentroId(null)}
              />
            ) : (
              <CenterCard
                key={c.id}
                centro={c}
                territorioColor={territorioColor}
                isActive={c.id === activeCentroId}
                onSelect={() => onSelectCentro(c.id)}
                onEdit={onUpdateCentro ? () => setEditingCentroId(c.id) : null}
                onDelete={onDeleteCentro ? () => window.confirm(`¿Eliminar "${c.name}"?`) && onDeleteCentro(c.id) : null}
              />
            )
          )}

          {onAddCentro && (addingCentro ? (
            <InlineForm
              fields={[
                { key: 'name',    label: 'Nombre del centro', placeholder: 'CESFAM ...', required: true },
                { key: 'address', label: 'Dirección',          placeholder: 'Opcional',  required: false },
              ]}
              initial={{ name: '', address: '' }}
              onSave={(f) => { onAddCentro({ ...f, agenciaId: agencia.id }); setAddingCentro(false) }}
              onCancel={() => setAddingCentro(false)}
            />
          ) : (
            <button onClick={() => setAddingCentro(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-blue-600 hover:bg-white border border-dashed border-gray-200 hover:border-blue-200 transition-all">
              <IconPlus /> Agregar centro
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de territorio (cerrada por defecto) ───────────────────────────────

function TerritoryCard({ territorio, agencias, centros, activeCentroId, onSelectCentro, onUpdateTerritorio, onDeleteTerritorio, onAddAgencia, onUpdateAgencia, onDeleteAgencia, onAddCentro, onUpdateCentro, onDeleteCentro }) {
  const hasActive = centros.some((c) => agencias.some((a) => a.id === c.agenciaId) && c.id === activeCentroId)
  const [open, setOpen] = useState(hasActive)
  const [editing, setEditing] = useState(false)
  const [addingAgencia, setAddingAgencia] = useState(false)

  const totalCentros = centros.filter((c) => agencias.some((a) => a.id === c.agenciaId)).length

  if (editing) {
    return (
      <div className="rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"
          style={{ backgroundColor: territorio.color + '15' }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: territorio.color }} />
          <span className="text-sm font-semibold text-gray-900">Editar territorio</span>
        </div>
        <div className="p-4">
          <InlineForm
            fields={[{ key: 'name', label: 'Nombre', placeholder: 'Territorio ...', required: true }]}
            initial={{ name: territorio.name, color: territorio.color }}
            showColorPicker
            onSave={(f) => { onUpdateTerritorio(territorio.id, f); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100"
        style={{ backgroundColor: territorio.color + '12' }}>
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: territorio.color }} />
          <span className="text-sm font-semibold text-gray-900 truncate">{territorio.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-1"
            style={{ backgroundColor: territorio.color + '22', color: territorio.color }}>
            {agencias.length} agencia{agencias.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-400">{totalCentros} centros</span>
          {hasActive && !open && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
          )}
          <span className="text-gray-400 ml-auto"><IconChevron open={open} /></span>
        </button>
        {(onUpdateTerritorio || onDeleteTerritorio) && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {onUpdateTerritorio && (
              <button onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white/70 transition-colors">
                <IconEdit />
              </button>
            )}
            {onDeleteTerritorio && (
              <button onClick={() => window.confirm(`¿Eliminar territorio "${territorio.name}" y toda su estructura?`) && onDeleteTerritorio(territorio.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white/70 transition-colors">
                <IconDelete />
              </button>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="p-4 space-y-2">
          {agencias.map((ag) => (
            <AgencySection
              key={ag.id}
              agencia={ag}
              centros={centros.filter((c) => c.agenciaId === ag.id)}
              territorioColor={territorio.color}
              activeCentroId={activeCentroId}
              onSelectCentro={onSelectCentro}
              onUpdateAgencia={onUpdateAgencia}
              onDeleteAgencia={onDeleteAgencia}
              onAddCentro={onAddCentro}
              onUpdateCentro={onUpdateCentro}
              onDeleteCentro={onDeleteCentro}
            />
          ))}

          {onAddAgencia && (addingAgencia ? (
            <InlineForm
              fields={[{ key: 'name', label: 'Nombre de agencia', placeholder: 'Agencia ...', required: true }]}
              initial={{ name: '' }}
              onSave={(f) => { onAddAgencia({ ...f, territorioId: territorio.id }); setAddingAgencia(false) }}
              onCancel={() => setAddingAgencia(false)}
            />
          ) : (
            <button onClick={() => setAddingAgencia(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-blue-600 hover:bg-gray-50 border border-dashed border-gray-200 hover:border-blue-200 transition-all">
              <IconPlus /> Agregar agencia
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────

export default function CentersView() {
  const {
    activeCentroId, setActiveCentroId, activeCentro,
    territorios, agencias, centros,
    addTerritorio, updateTerritorio, deleteTerritorio,
    addAgencia,    updateAgencia,    deleteAgencia,
    addCentro,     updateCentro,     deleteCentro,
  } = useApp()

  const { role } = useAuth()
  const canWrite = role === 'admin'

  const [addingTerritorio, setAddingTerritorio] = useState(false)

  // Contexto del centro activo para mostrarlo en el banner
  const activoAgencia    = agencias.find((a) => a.id === activeCentro?.agenciaId)
  const activoTerritorio = territorios.find((t) => t.id === activoAgencia?.territorioId)

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Territorios', value: territorios.length, color: '#3b82f6' },
          { label: 'Agencias',    value: agencias.length,    color: '#8b5cf6' },
          { label: 'Centros',     value: centros.length,     color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Banner del centro activo */}
      {activeCentro && (
        <div className="bg-blue-600 rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{activeCentro.name}</p>
            <p className="text-blue-200 text-xs mt-0.5">
              {activoTerritorio?.name} · {activoAgencia?.name}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-blue-200 text-xs">Centro activo</p>
            <p className="text-white/60 text-xs mt-0.5">Haz click en otro para cambiar</p>
          </div>
        </div>
      )}

      {/* Territorios */}
      {territorios.map((t) => (
        <TerritoryCard
          key={t.id}
          territorio={t}
          agencias={agencias.filter((a) => a.territorioId === t.id)}
          centros={centros}
          activeCentroId={activeCentroId}
          onSelectCentro={setActiveCentroId}
          onUpdateTerritorio={canWrite ? updateTerritorio : null}
          onDeleteTerritorio={canWrite ? deleteTerritorio : null}
          onAddAgencia={canWrite ? addAgencia : null}
          onUpdateAgencia={canWrite ? updateAgencia : null}
          onDeleteAgencia={canWrite ? deleteAgencia : null}
          onAddCentro={canWrite ? addCentro : null}
          onUpdateCentro={canWrite ? updateCentro : null}
          onDeleteCentro={canWrite ? deleteCentro : null}
        />
      ))}

      {/* Agregar territorio — solo admin */}
      {canWrite && (addingTerritorio ? (
        <div className="rounded-2xl border border-blue-100 overflow-hidden shadow-sm bg-white p-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">Nuevo territorio</p>
          <InlineForm
            fields={[{ key: 'name', label: 'Nombre', placeholder: 'Territorio ...', required: true }]}
            initial={{ name: '', color: '#3b82f6' }}
            showColorPicker
            onSave={(f) => { addTerritorio(f); setAddingTerritorio(false) }}
            onCancel={() => setAddingTerritorio(false)}
          />
        </div>
      ) : (
        <button onClick={() => setAddingTerritorio(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-medium text-gray-400 hover:text-blue-600 border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
          <IconPlus /> Agregar territorio
        </button>
      ))}
    </div>
  )
}
