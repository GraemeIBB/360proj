import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Zoo from './Zoo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Zoo />
  </StrictMode>,
)
