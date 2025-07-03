import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // Strict mode disabled to prevent twice the renders
  // <StrictMode>
    <App />
  // </StrictMode>,
)
