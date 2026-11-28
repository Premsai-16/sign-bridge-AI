import WorkspaceBoundary from './components/WorkspaceBoundary'
import { lazy, Suspense } from 'react'
import Profile from './pages/Profile'
import Login from './pages/Login'
import AccountGate from './components/AccountGate'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import Layout from './components/Layout'
const Landing = lazy(() => import('./pages/Landing'))
const ConversationStudio = lazy(() => import('./pages/ConversationStudio'))
const LearnISL = lazy(() => import('./pages/LearnISL'))
const CommunicationHub = lazy(() => import('./pages/CommunicationHub'))
const AccessibilityNetwork = lazy(() => import('./pages/AccessibilityNetwork'))
const ResearchLab = lazy(() => import('./pages/ResearchLab'))
const Community = lazy(() => import('./pages/Community'))
const History = lazy(() => import('./pages/History'))
const Settings = lazy(() => import('./pages/Settings'))
import NotFound from './pages/NotFound'
const OwnerTrainer = lazy(() => import('./pages/OwnerTrainer'))

function App() {
  return (
    <WorkspaceBoundary><ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<p className="page-width py-20" role="status">Opening your workspace…</p>}><Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AccountGate />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="conversation" element={<ConversationStudio />} />
            <Route path="live-translate" element={<Navigate to="/conversation" replace />} />
            <Route path="avatar" element={<Navigate to="/learn" replace />} />
            <Route path="learn" element={<LearnISL />} />
            <Route path="hub" element={<CommunicationHub />} />
            <Route path="accessibility" element={<AccessibilityNetwork />} />
            <Route path="research" element={<ResearchLab />} />
            <Route path="community" element={<Community />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          </Route>
          <Route path="/owner/trainer" element={<OwnerTrainer />} />
        </Routes></Suspense>
      </BrowserRouter>
    </ToastProvider></WorkspaceBoundary>
  )
}

export default App
