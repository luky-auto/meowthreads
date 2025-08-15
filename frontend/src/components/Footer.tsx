import { Link } from 'react-router-dom'
import { Instagram, Facebook, Twitter, Youtube, Mail, MapPin, Phone } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-meow-primary text-meow-buttonText">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4">MeowThreads</h3>
            <p className="text-sm opacity-90 mb-4">
              Ropa única con estilo felino para verdaderos amantes de los gatos. 
              Calidad premium y diseños adorables.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/meowthreads"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com/meowthreads"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://twitter.com/meowthreads"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://youtube.com/meowthreads"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="opacity-90 hover:opacity-100 transition-opacity">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/productos" className="opacity-90 hover:opacity-100 transition-opacity">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/pedidos" className="opacity-90 hover:opacity-100 transition-opacity">
                  Mis Pedidos
                </Link>
              </li>
              <li>
                <Link to="/carrito" className="opacity-90 hover:opacity-100 transition-opacity">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Atención al Cliente</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Política de Devoluciones
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Guía de Tallas
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0" />
                <a href="mailto:info@meowthreads.com" className="opacity-90 hover:opacity-100 transition-opacity">
                  info@meowthreads.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0" />
                <a href="tel:+571234567890" className="opacity-90 hover:opacity-100 transition-opacity">
                  +57 (1) 234-567-890
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                <span className="opacity-90">
                  Calle 123 #45-67<br />
                  Bogotá, Colombia
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-white/20 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-semibold mb-2">Suscríbete a nuestro newsletter</h4>
            <p className="text-sm opacity-90 mb-4">
              Recibe ofertas exclusivas y novedades directamente en tu email
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 placeholder-white/60 text-white focus:outline-none focus:border-white/40"
              />
              <button className="bg-meow-accent hover:bg-meow-accent/90 px-4 py-2 rounded-lg transition-colors font-medium">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="opacity-90 mb-4 md:mb-0">
            © 2025 MeowThreads. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 opacity-90">
            <a href="#" className="hover:opacity-100 transition-opacity">
              Política de Privacidad
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity">
              Términos de Uso
            </a>
            <a href="#" className="hover:opacity-100 transition-opacity">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
