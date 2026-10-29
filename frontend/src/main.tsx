import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import App from './App.tsx'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import { queryClient } from '@/lib/queryClient'
import './index.css'

async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return
  }
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledFrame: 'bypass' })
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                {/* SocketProvider va dentro de AuthProvider para poder
                    leer isAuthenticated y conectar/desconectar el socket
                    según el estado de sesión del usuario */}
                <SocketProvider>
                  <App />
                </SocketProvider>
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </LazyMotion>
      </MotionConfig>
    </StrictMode>,
  )
})
