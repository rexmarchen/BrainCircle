import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/plus-jakarta-sans'
import '@/styles/index.css'
import { App } from '@/app/App'

const container = document.getElementById('root')
if (!container) throw new Error('Root element was not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
