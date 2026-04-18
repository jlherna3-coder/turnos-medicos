import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

// ── Checkbox con estado normal / heredado ────────────────────────────────────
function Checkbox({ checked, inherited, onChange }) {
  const active = checked || inherited
  return (
    <div
      onClick={inherited ? undefined : onChange}
      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors
        ${inherited ? 'opacity-40 cursor-default' : 'cursor-pointer'}
        ${active ? 'bg-blue-500' : 'bg-white border-2 border-gray-300'}`}
    >
      {active && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

// ── Modal principal ──────────────────────────────────────────────────────────
export default function PermissionsModal({ userId, userEmail, onClose }) {
  const { territorios, agencias, allCentros: centros } = useApp()

  // perms: { territorios: {id: {read,write}}, agencias: {...}, centros: {...} }
  const [perms, setPerms] = useState({ territorios: {}, agencias: {}, centros: {} })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)

      const next = { territorios: {}, agencias: {}, centros: {} }
      for (const p of data ?? []) {
        const key = p.scope_type + 's' // 'territorio' → 'territorios'
        if (next[key]) next[key][p.scope_id] = { read: true, write: p.can_write }
      }
      setPerms(next)
      setLoading(false)
    }
    load()
  }, [userId])

  // ── Herencia ──────────────────────────────────────────────────────────────
  function inheritedRead(type, id) {
    if (type === 'agencia') {
      const tId = agencias.find((a) => a.id === id)?.territorioId
      return Boolean(perms.territorios[tId]?.read)
    }
    if (type === 'centro') {
      const c   = centros.find((c) => c.id === id)
      const tId = agencias.find((a) => a.id === c?.agenciaId)?.territorioId
      return Boolean(perms.agencias[c?.agenciaId]?.read) || Boolean(perms.territorios[tId]?.read)
    }
    return false
  }

  function inheritedWrite(type, id) {
    if (type === 'agencia') {
      const tId = agencias.find((a) => a.id === id)?.territorioId
      return Boolean(perms.territorios[tId]?.write)
    }
    if (type === 'centro') {
      const c   = centros.find((c) => c.id === id)
      const tId = agencias.find((a) => a.id === c?.agenciaId)?.territorioId
      return Boolean(perms.agencias[c?.agenciaId]?.write) || Boolean(perms.territorios[tId]?.write)
    }
    return false
  }

  // ── Toggle individual ─────────────────────────────────────────────────────
  function toggle(type, id, field) {
    setPerms((prev) => {
      const key     = type + 's'
      const current = prev[key][id] ?? { read: false, write: false }
      let next      = { ...current, [field]: !current[field] }
      if (field === 'write' && next.write)   next.read  = true   // write implica read
      if (field === 'read'  && !next.read)   next.write = false  // quitar read quita write
      if (!next.read && !next.write) {
        const updated = { ...prev[key] }
        delete updated[id]
        return { ...prev, [key]: updated }
      }
      return { ...prev, [key]: { ...prev[key], [id]: next } }
    })
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true)
    await supabase.from('user_permissions').delete().eq('user_id', userId)

    const rows = []
    const push = (scope_type, key) => {
      for (const [scope_id, v] of Object.entries(perms[key])) {
        if (v.read) rows.push({ user_id: userId, scope_type, scope_id, can_write: v.write ?? false })
      }
    }
    push('territorio', 'territorios')
    push('agencia',    'agencias')
    push('centro',     'centros')

    if (rows.length > 0) await supabase.from('user_permissions').insert(rows)
    setSaving(false)
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Permisos de acceso</h2>
            <p className="text-xs text-gray-400 mt-0.5">{userEmail}</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cabeceras de columna */}
        <div className="px-6 py-2 flex items-center bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 text-xs font-medium text-gray-500">Estructura</div>
          <div className="flex items-center gap-6 pr-1">
            <span className="text-xs font-medium text-gray-500 w-8 text-center">Ver</span>
            <span className="text-xs font-medium text-gray-500 w-16 text-center">Escribir</span>
          </div>
        </div>

        {/* Árbol */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-8">Cargando…</p>
          ) : territorios.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No hay territorios</p>
          ) : (
            <div className="space-y-0.5">
              {territorios.map((t) => {
                const tp = perms.territorios[t.id] ?? {}
                return (
                  <div key={t.id}>
                    {/* Territorio */}
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="flex-1 text-sm font-semibold text-gray-900">{t.name}</span>
                      <div className="flex items-center gap-6">
                        <div className="w-8 flex justify-center">
                          <Checkbox checked={!!tp.read} onChange={() => toggle('territorio', t.id, 'read')} />
                        </div>
                        <div className="w-16 flex justify-center">
                          <Checkbox checked={!!tp.write} onChange={() => toggle('territorio', t.id, 'write')} />
                        </div>
                      </div>
                    </div>

                    {/* Agencias */}
                    {agencias.filter((a) => a.territorioId === t.id).map((ag) => {
                      const ap     = perms.agencias[ag.id] ?? {}
                      const inhR   = inheritedRead('agencia', ag.id)
                      const inhW   = inheritedWrite('agencia', ag.id)
                      return (
                        <div key={ag.id}>
                          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 ml-5">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                            <span className="flex-1 text-xs font-medium text-gray-700">{ag.name}</span>
                            <div className="flex items-center gap-6">
                              <div className="w-8 flex justify-center">
                                <Checkbox checked={!!ap.read} inherited={inhR} onChange={() => toggle('agencia', ag.id, 'read')} />
                              </div>
                              <div className="w-16 flex justify-center">
                                <Checkbox checked={!!ap.write} inherited={inhW} onChange={() => toggle('agencia', ag.id, 'write')} />
                              </div>
                            </div>
                          </div>

                          {/* Centros */}
                          {centros.filter((c) => c.agenciaId === ag.id).map((c) => {
                            const cp   = perms.centros[c.id] ?? {}
                            const cIR  = inheritedRead('centro', c.id)
                            const cIW  = inheritedWrite('centro', c.id)
                            return (
                              <div key={c.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 ml-10">
                                <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                                </svg>
                                <span className="flex-1 text-xs text-gray-600">{c.name}</span>
                                <div className="flex items-center gap-6">
                                  <div className="w-8 flex justify-center">
                                    <Checkbox checked={!!cp.read} inherited={cIR} onChange={() => toggle('centro', c.id, 'read')} />
                                  </div>
                                  <div className="w-16 flex justify-center">
                                    <Checkbox checked={!!cp.write} inherited={cIW} onChange={() => toggle('centro', c.id, 'write')} />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-3 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Checkboxes atenuados = acceso heredado del nivel superior. Escribir incluye Ver automáticamente. Los permisos de territorio aplican a centros futuros también.
          </p>
          <div className="flex gap-2.5">
            <button onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #4F8DF7, #3C6AD4)' }}>
              {saving ? 'Guardando…' : 'Guardar permisos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
