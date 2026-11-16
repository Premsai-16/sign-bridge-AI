import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import LiveTranslate from './pages/LiveTranslate'
import ConversationStudio from './pages/ConversationStudio'
import AISignAvatar from './pages/AISignAvatar'
import LearnISL from './pages/LearnISL'
import ResearchLab from './pages/ResearchLab'
import Community from './pages/Community'
import History from './pages/History'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="live-translate" element={<LiveTranslate />} />
            <Route path="conversation" element={<ConversationStudio />} />
            <Route path="avatar" element={<AISignAvatar />} />
            <Route path="learn" element={<LearnISL />} />
            <Route path="research" element={<ResearchLab />} />
            <Route path="community" element={<Community />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App