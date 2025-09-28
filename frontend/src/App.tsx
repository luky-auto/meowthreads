import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Products from './components/Products'
import Cart from './components/Cart'
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import Orders from './components/Orders'
import PaymentSuccess from './components/PaymentSuccess'
import PaymentFailure from './components/PaymentFailure'
import PaymentPending from './components/PaymentPending'
import ProfileUpdate from './components/ProfileUpdate'
import Home from './pages/Home'
import Admin from './pages/Admin'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { CartProvider } from './contexts/CartContext'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
        <Router>
        <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Ruta de Admin sin navbar/footer */}
          <Route path="/admin/*" element={
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          } />
          
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
                  <Route path="/perfil" element={<ProfileUpdate />} />
                  <Route path="/pedidos" element={<Orders />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/failure" element={<PaymentFailure />} />
                  <Route path="/payment/pending" element={<PaymentPending />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
        </div>
        </Router>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
