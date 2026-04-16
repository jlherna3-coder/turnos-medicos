import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import LoginView from './components/LoginView'
import SetPasswordView from './components/SetPasswordView'
import CentersView from './components/CentersView'
import DoctorPanel from './components/DoctorPanel'
import CoverageView from './components/CoverageView'
import PlanningView from './components/PlanningView'
import UsersView from './components/UsersView'

function AppContent() {
  const { session, needsPassword, setNeedsPassword } = useAuth()
  const [view, setView] = useState('centers')

  // undefined = todavía cargando la sesión
  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Cargando…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!session) return <LoginView />

  if (needsPassword) return <SetPasswordView onDone={() => setNeedsPassword(false)} />

  return (
    <AppProvider>
      <Layout view={view} onViewChange={setView}>
        {view === 'centers'  && <CentersView />}
        {view === 'doctors'  && <DoctorPanel />}
        {view === 'planning'  && <PlanningView />}
        {view === 'coverage' && <CoverageView />}
        {view === 'users'    && <UsersView />}
      </Layout>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
