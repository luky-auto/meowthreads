import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      return;
    }

    const success = await login({ email, password });
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-meow-background px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-meow-form p-6 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-meow-text mb-5 text-center">Iniciar Sesión</h2>

        <div className="mb-4">
          <label className="block mb-2 text-meow-text font-medium">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
            placeholder="usuario@correo.com"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-meow-text font-medium">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-4 whitespace-pre-line">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-meow-accent text-meow-buttonText py-2 rounded-md hover:bg-orange-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
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
