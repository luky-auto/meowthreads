import { Link } from 'react-router-dom'
import { Star, ShoppingBag, Heart, Truck, Shield, Headphones, Instagram, Facebook, Twitter, Youtube } from 'lucide-react'
// import HomeCarousel from '../components/HomeCarousel'

// Productos destacados
const featuredProducts = [
  {
    id: 1,
    name: 'Camiseta Gatuna',
    price: '$35.000',
    originalPrice: '$42.000',
    image: '/images/camiseta1.webp',
    rating: 4.8,
    isNew: false,
    isBestSeller: true
  },
  {
    id: 3,
    name: 'Saco Edición Limitada',
    price: '$170.000',
    originalPrice: '$200.000',
    image: '/images/saco1.webp',
    rating: 4.9,
    isNew: true,
    isBestSeller: false
  },
  {
    id: 6,
    name: 'Zapatos Edición Limitada',
    price: '$370.000',
    originalPrice: null,
    image: '/images/zapatos1.webp',
    rating: 4.7,
    isNew: false,
    isBestSeller: true
  }
];

// Testimonios de clientes
const testimonials = [
  {
    id: 1,
    name: 'María González',
    rating: 5,
    comment: 'Increíble calidad y diseños únicos. ¡Mi camiseta gatuna es mi favorita!',
    avatar: '👩‍🦱'
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    rating: 5,
    comment: 'Excelente servicio al cliente y productos de alta calidad. Muy recomendado.',
    avatar: '👨‍💼'
  },
  {
    id: 3,
    name: 'Ana Martínez',
    rating: 4,
    comment: 'Los accesorios son hermosos y llegaron súper rápido. ¡Volveré a comprar!',
    avatar: '👩‍🎨'
  }
];

const ProductCard = ({ product }: { product: typeof featuredProducts[0] }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
    <div className="relative">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        {product.isNew && (
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ¡Nuevo!
          </span>
        )}
        {product.isBestSeller && (
          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Más Vendido
          </span>
        )}
      </div>
      
      {/* Favorito */}
      <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
        <Heart size={16} className="text-gray-600 hover:text-red-500" />
      </button>
    </div>
    
    <div className="p-4">
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={`${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({product.rating})</span>
      </div>
      
      <h3 className="font-semibold text-meow-text mb-2">{product.name}</h3>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-bold text-meow-accent">{product.price}</span>
        {product.originalPrice && (
          <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
        )}
      </div>
      
      <Link
        to="/productos"
        className="w-full bg-meow-accent text-white py-2 px-4 rounded-lg hover:bg-meow-accent/90 transition-colors flex items-center justify-center gap-2"
      >
        <ShoppingBag size={16} />
        Ver Producto
      </Link>
    </div>
  </div>
);

function Home() {
  return (
    <div className="bg-meow-background min-h-screen">
      {/* Hero Section con Carousel */}
      <section className="px-4 py-8">
        {/* Carousel simple integrado */}
        <div className="relative w-full max-w-6xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <div className="w-full h-[300px] md:h-[450px] bg-gradient-to-r from-meow-primary to-meow-accent">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="text-white text-center p-6 md:p-12 max-w-2xl">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    🐱 MeowThreads
                  </h1>
                  <p className="text-xl md:text-2xl mb-6 opacity-90">
                    Ropa y accesorios únicos para amantes de los gatos
                  </p>
                  <div className="text-lg md:text-xl font-semibold mb-6">
                    Nueva Colección desde <span className="text-yellow-300">$35.000</span>
                  </div>
                  <Link 
                    to="/productos"
                    className="bg-white text-meow-accent px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <ShoppingBag size={20} />
                    Ver Productos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Sección de Bienvenida */}
        <section className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-meow-text mb-4">
            Bienvenido a MeowThreads
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Descubre nuestra colección única de ropa y accesorios inspirados en el mundo felino. 
            Cada pieza está diseñada con amor y atención al detalle para los verdaderos amantes de los gatos.
          </p>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-meow-accent mb-2">500+</div>
              <div className="text-gray-600">Clientes Felices</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-meow-accent mb-2">50+</div>
              <div className="text-gray-600">Productos Únicos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-meow-accent mb-2">4.8★</div>
              <div className="text-gray-600">Calificación Promedio</div>
            </div>
          </div>
        </section>

        {/* Productos Destacados */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-meow-text">
              Productos Destacados
            </h2>
            <Link
              to="/productos"
              className="text-meow-accent hover:underline font-medium"
            >
              Ver todos →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Características/Beneficios */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-meow-text text-center mb-12">
            ¿Por qué elegir MeowThreads?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="w-16 h-16 bg-meow-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-meow-accent" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-meow-text mb-3">Envío Rápido</h3>
              <p className="text-gray-600">
                Entrega en 2-3 días hábiles. Envío gratis en compras mayores a $150.000
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="w-16 h-16 bg-meow-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-meow-accent" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-meow-text mb-3">Calidad Garantizada</h3>
              <p className="text-gray-600">
                Materiales premium y garantía de satisfacción. Devoluciones fáciles
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="w-16 h-16 bg-meow-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="text-meow-accent" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-meow-text mb-3">Soporte 24/7</h3>
              <p className="text-gray-600">
                Atención al cliente siempre disponible para ayudarte con tus dudas
              </p>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-meow-text text-center mb-12">
            Lo que dicen nuestros clientes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={`${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{testimonial.avatar}</span>
                  <div>
                    <div className="font-semibold text-meow-text">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">Cliente verificado</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sección de Redes Sociales */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-meow-text mb-4">
              Síguenos en Redes Sociales
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Únete a nuestra comunidad felina y mantente al día con las últimas tendencias, ofertas exclusivas y contenido adorable
            </p>
          </div>

          <div className="flex justify-center gap-6 mb-8">
            <a
              href="https://instagram.com/meowthreads"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                <Instagram className="text-white" size={24} />
              </div>
              <div className="text-center">
                <div className="font-semibold text-meow-text">Instagram</div>
                <div className="text-sm text-gray-600">@meowthreads</div>
                <div className="text-xs text-meow-accent font-medium">1 seguidor</div>
              </div>
            </a>

            <a
              href="https://facebook.com/meowthreads"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                <Facebook className="text-white" size={24} />
              </div>
              <div className="text-center">
                <div className="font-semibold text-meow-text">Facebook</div>
                <div className="text-sm text-gray-600">MeowThreads</div>
                <div className="text-xs text-meow-accent font-medium">1 me gusta</div>
              </div>
            </a>

            <a
              href="https://twitter.com/meowthreads"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                <Twitter className="text-white" size={24} />
              </div>
              <div className="text-center">
                <div className="font-semibold text-meow-text">Twitter</div>
                <div className="text-sm text-gray-600">@meowthreads</div>
                <div className="text-xs text-meow-accent font-medium">1 seguidor</div>
              </div>
            </a>

            <a
              href="https://youtube.com/meowthreads"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                <Youtube className="text-white" size={24} />
              </div>
              <div className="text-center">
                <div className="font-semibold text-meow-text">YouTube</div>
                <div className="text-sm text-gray-600">MeowThreads</div>
                <div className="text-xs text-meow-accent font-medium">2 suscriptores</div>
              </div>
            </a>
          </div>

          {/* Hashtags populares */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Usa nuestros hashtags:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-meow-accent/10 text-meow-accent px-3 py-1 rounded-full text-sm font-medium">
                #MeowThreads
              </span>
              <span className="bg-meow-accent/10 text-meow-accent px-3 py-1 rounded-full text-sm font-medium">
                #RopaGatuna
              </span>
              <span className="bg-meow-accent/10 text-meow-accent px-3 py-1 rounded-full text-sm font-medium">
                #EstiloFelino
              </span>
              <span className="bg-meow-accent/10 text-meow-accent px-3 py-1 rounded-full text-sm font-medium">
                #AmantesGatos
              </span>
            </div>
          </div>
        </section>

        {/* Call to Action Final */}
        <section className="text-center bg-gradient-to-r from-meow-accent to-orange-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para lucir tu estilo felino?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a la comunidad MeowThreads y descubre la moda que amas
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/productos"
              className="bg-white text-meow-accent px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors font-medium inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag size={20} />
              Ver Productos
            </Link>
            <Link
              to="/registro"
              className="border-2 border-white text-white px-8 py-3 rounded-xl hover:bg-white hover:text-meow-accent transition-colors font-medium"
            >
              Crear Cuenta
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home