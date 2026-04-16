import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PermissionsModal from './PermissionsModal'

const ROLE_OPTIONS = [
  { value: 'admin',  label: 'Administrador', desc: 'Acceso total' },
  { value: 'editor', label: 'Editor',         desc: 'Gestiona médicos y horarios' },
  { value: 'viewer', label: 'Visualizador',   desc: 'Solo lectura' },
]

const ROLE_STYLE = {
  admin:  { bg: '#ede9fe', color: '#6d28d9' },
  editor: { bg: '#dbeafe', color: '#1d4ed8' },
  viewer: { bg: '#f1f5f9', color: '#475569' },
}

async function callApi(action, body, token) {
  const res = await fetch('/api/manage-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
  return data
}

export default function UsersView() {
  const { session } = useAuth()
  const token = session?.access_token

  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [creating, setCreating]       = useState(false)
  const [form, setForm]               = useState({ email: '', password: '', role: 'editor' })
  const [saving, setSaving]           = useState(null)
  const [error, setError]             = useState(null)
  const [success, setSuccess]         = useState(null)
  const [permissionsUser, setPermissionsUser] = useState(null)
  const [resetUser, setResetUser]     = useState(null) // { id, email }
  const [newPassword, setNewPassword] = useState('')

  // Cargar usuarios (profiles + roles)
  const loadUsers = async () => {
    setLoading(true)
    const { data: profiles } = await supabase.from('profiles').select('id, email')
    const { data: roles }    = await supabase.from('user_roles').select('user_id, role')

    const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.user_id, r.role]))
    setUsers((profiles ?? []).map((p) => ({ ...p, role: roleMap[p.id] ?? null })))
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const showSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving('create')
    try {
      await callApi('create', form, token)
      setForm({ email: '', password: '', role: 'editor' })
      setCreating(false)
      showSuccess(`Usuario ${form.email} creado`)
      await loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(resetUser.id)
    try {
      await callApi('reset_password', { userId: resetUser.id, password: newPassword }, token)
      setResetUser(null)
      setNewPassword('')
      showSuccess(`Contraseña de ${resetUser.email} actualizada`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    setSaving(userId)
    setError(null)
    try {
      await callApi('update_role', { userId, role: newRole }, token)
      setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      showSuccess('Rol actualizado')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`¿Eliminar al usuario ${email}? Esta acción no se puede deshacer.`)) return
    setSaving(userId)
    setError(null)
    try {
      await callApi('delete', { userId }, token)
      setUsers((p) => p.filter((u) => u.id !== userId))
      showSuccess('Usuario eliminado')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {ROLE_OPTIONS.map(({ value, label }) => {
          const count = users.filter((u) => u.role === value).length
          const style = ROLE_STYLE[value]
          return (
            <div key={value} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: style.color }}>{label}</p>
            </div>
          )
        })}
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Usuarios</h2>
          <p className="text-xs text-gray-400 mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo usuario
          </button>
        )}
      </div>

      {/* Formulario de creación */}
      {creating && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Crear nuevo usuario</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@email.com"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Contraseña inicial</label>
                <input
                  type="text" required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                ))}
              </select>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
              Comparte el email y la contraseña con el usuario por un canal seguro (ej: mensaje directo).
              El usuario podrá cambiarla desde la app.
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => { setCreating(false); setError(null) }}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving === 'create'}
                className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                {saving === 'create' ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de reset de contraseña */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Cambiar contraseña</h3>
            <p className="text-xs text-gray-400 mb-4">{resetUser.email}</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nueva contraseña</label>
                <input
                  type="text" required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2.5">
                <button type="button" onClick={() => { setResetUser(null); setNewPassword('') }}
                  className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving === resetUser.id}
                  className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  {saving === resetUser.id ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Cargando usuarios…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No hay usuarios registrados</p>
          </div>
        ) : (
          users.map((u) => {
            const roleStyle = ROLE_STYLE[u.role] ?? ROLE_STYLE.viewer
            const isSelf = u.id === session?.user?.id
            const isBusy = saving === u.id
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
                  style={{ backgroundColor: roleStyle.color }}>
                  {u.email[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.email}</p>
                    {isSelf && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Tú</span>
                    )}
                  </div>
                  {/* Selector de rol */}
                  <select
                    value={u.role ?? ''}
                    disabled={isSelf || isBusy}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="mt-1.5 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                    style={{ color: roleStyle.color }}
                  >
                    {!u.role && <option value="">Sin rol</option>}
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isBusy && (
                    <div style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 8px' }} />
                  )}
                  {/* Reset contraseña */}
                  {!isSelf && (
                    <button
                      onClick={() => { setResetUser({ id: u.id, email: u.email }); setNewPassword('') }}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                      title="Cambiar contraseña"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                  )}
                  {/* Permisos por centro — solo para editor/viewer */}
                  {!isSelf && u.role !== 'admin' && (
                    <button
                      onClick={() => setPermissionsUser({ id: u.id, email: u.email })}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-40"
                      title="Gestionar permisos por centro"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                  )}
                  {!isSelf && (
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Eliminar usuario"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {permissionsUser && (
        <PermissionsModal
          userId={permissionsUser.id}
          userEmail={permissionsUser.email}
          onClose={() => setPermissionsUser(null)}
        />
      )}
    </div>
  )
}
