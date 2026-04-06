import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import CentersView from './components/CentersView'
import DoctorPanel from './components/DoctorPanel'
import CoverageView from './components/CoverageView'

function AppContent() {
  const [view, setView] = useState('centers')

  return (
    <Layout view={view} onViewChange={setView}>
      {view === 'centers'  && <CentersView />}
      {view === 'doctors'  && <DoctorPanel />}
      {view === 'coverage' && <CoverageView />}
    </Layout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
