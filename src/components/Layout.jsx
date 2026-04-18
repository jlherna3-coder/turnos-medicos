import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import logoAchs from '../assets/logo-achs-salud.svg'

const BRAND_PRIMARY   = '#4F8DF7'
const BRAND_SECONDARY = '#3C6AD4'
const BRAND_GRADIENT  = `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_SECONDARY})`

const ROLE_LABEL = { admin: 'Administrador', editor: 'Editor', viewer: 'Visualizador' }
const ROLE_STYLE = {
  admin:  { bg: '#ede9fe', color: '#6d28d9' },
  editor: { bg: '#e0eaff', color: '#3C6AD4' },
  viewer: { bg: '#f1f5f9', color: '#475569' },
}

const NAV_ITEMS = [
  {
    id: 'centers',
    label: 'Centros',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'semana-tipo',
    label: 'Semanas Tipo',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'planning',
    label: 'Planificación',
    adminOnly: false,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Usuarios',
    adminOnly: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
]

export default function Layout({ view, onViewChange, children }) {
  const { activeCentro } = useApp()
  const { session, role, logout } = useAuth()
  const email = session?.user?.email ?? ''
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.viewer
  const visibleNav = NAV_ITEMS.filter((i) => !i.adminOnly || role === 'admin')
  const current = visibleNav.find((i) => i.id === view)

  const [showChangePwd, setShowChangePwd] = useState(false)
  const [pwd, setPwd]             = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdError, setPwdError]   = useState(null)
  const [pwdOk, setPwdOk]         = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleChangePwd = async (e) => {
    e.preventDefault()
    setPwdError(null)
    if (pwd.length < 8)       { setPwdError('Mínimo 8 caracteres'); return }
    if (pwd !== pwdConfirm)   { setPwdError('Las contraseñas no coinciden'); return }
    setPwdLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    setPwdLoading(false)
    if (error) { setPwdError(error.message); return }
    setPwdOk(true)
    setTimeout(() => { setShowChangePwd(false); setPwd(''); setPwdConfirm(''); setPwdOk(false) }, 1500)
  }

  return (
    <div className="flex h-screen w-full" style={{ background: '#f0f4f8' }}>

      {/* ── Sidebar (solo desktop) ── */}
      <aside
        className="hidden md:flex w-56 flex-col flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <img src={logoAchs} alt="ACHS Salud" className="h-8 w-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? { background: 'rgba(79,141,247,0.18)', color: '#A8C8FB' }
                    : { color: 'rgba(255,255,255,0.5)' }
                }
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
              >
                <span style={active ? { color: '#7BADF9' } : {}}>{item.icon}</span>
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BRAND_PRIMARY }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Centro activo */}
        {activeCentro && (
          <div className="px-3 py-3 border-t border-white/10">
            <p className="text-white/30 text-xs px-2 mb-1.5 uppercase tracking-wide font-medium">Centro activo</p>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
              style={{ background: 'rgba(79,141,247,0.15)' }}
              onClick={() => onViewChange('centers')}
              title="Ir a Centros para cambiar"
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#7BADF9' }} />
              <p className="text-xs font-medium truncate leading-tight" style={{ color: '#A8C8FB' }}>{activeCentro.name}</p>
            </div>
          </div>
        )}

        {/* Usuario + logout */}
        <div className="px-3 py-3 border-t border-white/10 space-y-2">
          <div className="px-3">
            <p className="text-white/60 text-xs truncate">{email}</p>
            <span
              className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
            >
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>
          <button
            onClick={() => setShowChangePwd(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Cambiar contraseña
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Modal cambiar contraseña */}
      {showChangePwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Cambiar contraseña</h3>
            <p className="text-xs text-gray-400 mb-4">{email}</p>
            {pwdOk ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Contraseña actualizada
              </div>
            ) : (
              <form onSubmit={handleChangePwd} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nueva contraseña</label>
                  <input type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmar</label>
                  <input type="password" required value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => { setShowChangePwd(false); setPwd(''); setPwdConfirm(''); setPwdError(null) }}
                    className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={pwdLoading}
                    className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                    style={{ background: BRAND_GRADIENT }}>
                    {pwdLoading ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-200/80 px-4 md:px-7 py-3 md:py-4 flex items-center justify-between">
          {/* Logo mobile */}
          <div className="flex items-center gap-3">
            <img src={logoAchs} alt="ACHS Salud" className="md:hidden h-7 w-auto" />
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{current?.label}</h1>
              <p className="text-xs text-gray-400 hidden md:block mt-0.5">
                {view === 'centers'    && 'Territorios, agencias y centros de salud ambulatorios'}
                {view === 'semana-tipo' && 'Configura los turnos tipo por categoría y horario'}
                {view === 'planning'   && 'Asigna semanas tipo al calendario y gestiona cambios puntuales'}
                {view === 'users'      && 'Invita usuarios y gestiona sus permisos de acceso'}
              </p>
            </div>
          </div>

          {/* Centro activo mobile */}
          {activeCentro && (
            <button
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium truncate max-w-[140px]"
              style={{ background: 'rgba(79,141,247,0.08)', color: BRAND_PRIMARY }}
              onClick={() => onViewChange('centers')}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BRAND_PRIMARY }} />
              <span className="truncate">{activeCentro.name}</span>
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-4 md:px-7 py-4 md:py-6 pb-20 md:pb-6">
          {children}
        </main>

        {/* ── Bottom nav (solo mobile) ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-gray-200"
          style={{ background: 'white', zIndex: 50 }}
        >
          {visibleNav.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
                style={{ color: active ? BRAND_PRIMARY : '#94a3b8' }}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ backgroundColor: BRAND_PRIMARY }} />
                )}
              </button>
            )
          })}
        </nav>

      </div>
    </div>
  )
}
