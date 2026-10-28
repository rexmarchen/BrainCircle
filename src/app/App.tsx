import { BrowserRouter } from 'react-router-dom'
import { appMode } from '@/app/config'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { AppRoutes } from '@/routes/AppRoutes'
import { ConfigRequiredPage } from '@/pages/ConfigRequiredPage'

export function App() {
  if (appMode === 'unconfigured') {
    return <ConfigRequiredPage />
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
