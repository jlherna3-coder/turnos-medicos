import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]           = useState(undefined) // undefined = cargando
  const [role, setRole]                 = useState(null)
  const [permissions, setPermissions]   = useState([])
  const [needsPassword, setNeedsPassword] = useState(false) // llegó via link de invitación

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserData(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Cuando el usuario llega desde el email de invitación, Supabase
      // genera una sesión automáticamente con event = 'SIGNED_IN' pero
      // el usuario aún no tiene contraseña propia — lo detectamos por
      // el hash de la URL que incluye type=invite
      if (event === 'SIGNED_IN') {
        const hash   = window.location.hash
        const params = new URLSearchParams(hash.replace('#', ''))
        if (params.get('type') === 'invite') {
          setNeedsPassword(true)
          // Limpiar el hash de la URL sin recargar
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
      setSession(session)
      if (session) fetchUserData(session.user.id)
      else { setRole(null); setPermissions([]) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserData(userId) {
    const [{ data: roleData }, { data: permsData }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
      supabase.from('user_permissions').select('*').eq('user_id', userId),
    ])
    setRole(roleData?.role ?? null)
    setPermissions(permsData ?? [])
  }

  // ── Helpers de acceso (usan la lista de permisos + datos de jerarquía) ──
  function canAccessCentro(centroId, centros, agencias) {
    if (role === 'admin') return true
    const centro  = centros.find((c) => c.id === centroId)
    if (!centro) return false
    const agencia = agencias.find((a) => a.id === centro.agenciaId)
    return permissions.some((p) =>
      (p.scope_type === 'centro'     && p.scope_id === centroId) ||
      (p.scope_type === 'agencia'    && p.scope_id === centro.agenciaId) ||
      (p.scope_type === 'territorio' && p.scope_id === agencia?.territorioId)
    )
  }

  function canWriteCentro(centroId, centros, agencias) {
    if (role === 'admin') return true
    const centro  = centros.find((c) => c.id === centroId)
    if (!centro) return false
    const agencia = agencias.find((a) => a.id === centro.agenciaId)
    return permissions.some((p) => p.can_write && (
      (p.scope_type === 'centro'     && p.scope_id === centroId) ||
      (p.scope_type === 'agencia'    && p.scope_id === centro.agenciaId) ||
      (p.scope_type === 'territorio' && p.scope_id === agencia?.territorioId)
    ))
  }

  const login  = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const logout = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{
      session, role, permissions, needsPassword, setNeedsPassword,
      login, logout, canAccessCentro, canWriteCentro,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
