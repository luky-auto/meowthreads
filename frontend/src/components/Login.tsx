import { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa ambos campos.');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresa un correo válido.');
    } else {
      setError('');
      // Aquí iría la lógica de autenticación
      console.log('Autenticado:', email);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-meow-background">
      <form
        onSubmit={handleSubmit}
        className="bg-meow-form p-8 rounded-2xl shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold text-meow-text mb-6 text-center">Iniciar Sesión</h2>

        <label className="block mb-2 text-meow-text font-semibold">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
          placeholder="usuario@correo.com"
        />

        <label className="block mb-2 text-meow-text font-semibold">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
          placeholder="••••••••"
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-meow-accent text-meow-buttonText py-2 rounded-md hover:bg-orange-700 transition duration-200"
        >
          Iniciar sesión
        </button>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-meow-text hover:underline text-sm">
            ¿Olvidaste tu contraseña?
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

export default Login;
