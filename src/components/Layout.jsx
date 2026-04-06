import { useApp } from '../context/AppContext'

const NAV_ITEMS = [
  {
    id: 'centers',
    label: 'Centros',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'doctors',
    label: 'Médicos',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'coverage',
    label: 'Cobertura',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function Layout({ view, onViewChange, children }) {
  const current = NAV_ITEMS.find((i) => i.id === view)
  const { activeCentro } = useApp()

  return (
    <div className="flex h-screen w-full" style={{ background: '#f0f4f8' }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-56 flex flex-col flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">MediTurno</p>
              <p className="text-white/40 text-xs">Centro Médico</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? { background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }
                    : { color: 'rgba(255,255,255,0.5)' }
                }
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
              >
                <span style={active ? { color: '#60a5fa' } : {}}>{item.icon}</span>
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
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
              style={{ background: 'rgba(59,130,246,0.15)' }}
              onClick={() => onViewChange('centers')}
              title="Ir a Centros para cambiar"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <p className="text-blue-300 text-xs font-medium truncate leading-tight">{activeCentro.name}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-white/25 text-xs text-center">v1.0.0</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200/80 px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">{current?.label}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {view === 'centers'  && 'Territorios, agencias y centros de salud ambulatorios'}
              {view === 'doctors'  && 'Gestiona el equipo médico y sus horarios semanales'}
              {view === 'coverage' && 'Visualiza la cobertura médica por franja horaria'}
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-7 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
