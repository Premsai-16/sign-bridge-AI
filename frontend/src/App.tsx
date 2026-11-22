import Login from './pages/Login'
import AccountGate from './components/AccountGate'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import ConversationStudio from './pages/ConversationStudio'
import LearnISL from './pages/LearnISL'
import CommunicationHub from './pages/CommunicationHub'
import AccessibilityNetwork from './pages/AccessibilityNetwork'
import ResearchLab from './pages/ResearchLab'
import Community from './pages/Community'
import History from './pages/History'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import OwnerTrainer from './pages/OwnerTrainer'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
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
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          </Route>
          <Route path="/owner/trainer" element={<OwnerTrainer />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
