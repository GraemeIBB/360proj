import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './Home.jsx'
import Login from './Login.jsx'
import PostBook from './PostBook.jsx'
import ViewBook from './ViewBook.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/post-book" element={<PostBook />} />
        <Route path="/books/:id" element={<ViewBook />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
