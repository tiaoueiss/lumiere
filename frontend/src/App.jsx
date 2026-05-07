import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar   from './components/layout/Navbar'
import Footer   from './components/layout/Footer'
import Home     from './pages/Home'
import TryOn    from './pages/TryOn'
import FindYourStyle from './pages/FindYourStyle'
import About    from './pages/About'
import JewelryPage from './pages/JewelryPage'
import MyStyle from './pages/MyStyle'
import Wishlist from './pages/Wishlist'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/style"   element={<FindYourStyle />} />
          <Route path="/tryon"   element={<TryOn />} />
          <Route path="/products" element={<JewelryPage />} />
          <Route path="/about"    element={<About />} />
          <Route path="/my-style" element={<MyStyle />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}