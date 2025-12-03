import 'pixi.js/unsafe-eval' // Must be first - enables CSP-compliant shader compilation
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from '@ui/ErrorBoundary'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary title="The Substrate encountered an error" showReload>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
