import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Zoo from './Zoo.jsx'
import Home from './Home.jsx'
import Login from './Login.jsx'
import Temp from './Temp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Temp />
  </StrictMode>,
)
