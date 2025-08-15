import { Link } from 'react-router-dom'
import { ShoppingCart, User, Shield } from 'lucide-react'
import { useState } from 'react'

function Navbar() {
  const [showMenu, setShowMenu] = useState(false)
  
  // Simulamos diferentes estados de usuario
  // En una aplicación real, esto vendría del estado de autenticación
  const isAdmin = true // ✅ Visible temporalmente para desarrollo
  const isLoggedIn = false // ✅ Cliente normal puede hacer login

  return (
    <nav className="bg-meow-primary text-meow-buttonText px-6 py-4 shadow-md flex justify-between items-center">
      <h1 className="text-xl font-bold">MeowThreads</h1>
      <ul className="flex items-center gap-6 text-sm font-semibold relative">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li>
          <Link to="/productos">Productos</Link>
        </li>
        <li>
          <Link to="/pedidos">Pedidos</Link>
        </li>
        {/* Enlace de administración solo para administradores */}
        {isAdmin && (
          <li>
            <Link 
              to="/admin" 
              className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors"
              title="Panel de Administración"
            >
              <Shield size={16} />
              Admin
            </Link>
          </li>
        )}
        <li>
          <Link to="/carrito">
            <ShoppingCart size={20} />
          </Link>
        </li>
        <li
          className="relative"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          <button className="flex items-center gap-1">
            <User size={20} />
          </button>
          {showMenu && (
            <div className="absolute top-5 right-0 bg-white text-meow-text shadow-lg rounded-md p-2 w-36 z-50">
              {isLoggedIn ? (
                <>
                  <div className="px-3 py-1 text-sm text-gray-600 border-b">
                    Usuario {isAdmin ? '(Admin)' : '(Cliente)'}
                  </div>
                  {isAdmin && (
                    <Link to="/admin" className="block px-3 py-1 hover:bg-meow-form rounded flex items-center gap-2">
                      <Shield size={14} />
                      Panel Admin
                    </Link>
                  )}
                  <button className="block w-full text-left px-3 py-1 hover:bg-meow-form rounded">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-1 hover:bg-meow-form rounded">
                    Iniciar sesión
                  </Link>
                  <Link to="/registro" className="block px-3 py-1 hover:bg-meow-form rounded">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
