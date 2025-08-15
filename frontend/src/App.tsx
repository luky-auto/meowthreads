import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Products from './components/Products'
import Cart from './components/Cart'
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import Orders from './components/Orders'
import Home from './pages/Home'
import Admin from './pages/Admin'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Ruta de Admin sin navbar/footer */}
          <Route path="/admin/*" element={<Admin />} />
          
          {/* Rutas normales con navbar/footer */}
          <Route path="/*" element={
            <>
              <Navbar />
              <main className="flex-1 min-h-[calc(100vh-160px)]">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/registro" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/productos" element={<Products />} />
                  <Route path="/carrito" element={<Cart />} />
                  <Route path="/pedidos" element={<Orders />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
