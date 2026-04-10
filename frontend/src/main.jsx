import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './Home.jsx'
import Login from './Login.jsx'
import PostBook from './PostBook.jsx'
import ViewBook from './ViewBook.jsx'
import SignUp from './Sign Up.jsx'
import UserProfile from './UserProfile.jsx'
import AdminPanel from './AdminPanel.jsx'
import Messages from './Messages.jsx'
// import Books from './Books.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/post-book" element={<PostBook />} />
        <Route path="/books/:id" element={<ViewBook />} />
        {/* <Route path="/books" element={<Books />} /> */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/messages" element={<Messages />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
