import { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    } 
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresa un correo válido.');
      return;
    }

    setIsLoading(true);
    
    // Simulamos el envío del email de recuperación
    setTimeout(() => {
      setIsLoading(false);
      setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      console.log('Recuperación de contraseña solicitada para:', email);
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-meow-background">
      <form
        onSubmit={handleSubmit}
        className="bg-meow-form p-8 rounded-2xl shadow-md w-full max-w-sm border border-meow-border"
      >
        <h2 className="text-2xl font-bold text-meow-text mb-6 text-center">
          Recuperar Contraseña
        </h2>
        
        <p className="text-meow-text text-sm mb-6 text-center">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <label className="block mb-2 text-meow-text font-semibold">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
          placeholder="usuario@correo.com"
          disabled={isLoading}
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-meow-accent text-meow-buttonText py-2 rounded-md hover:bg-orange-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-meow-text hover:underline text-sm">
            ← Volver al inicio de sesión
          </Link>
        </div>
        
        <div className="mt-2 text-center">
          <Link to="/registro" className="text-meow-text hover:underline text-sm">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;
