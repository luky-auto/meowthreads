import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext';

interface RegisterForm {
  first_name: string
  last_name: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

function Register() {
  const [form, setForm] = useState<RegisterForm>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError();
    
    if (form.password !== form.confirmPassword) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = form;
    const success = await register(registerData);
    if (success) {
      navigate('/');
    }
  }

  const fields = [
    { label: 'Nombre', name: 'first_name', type: 'text', placeholder: 'Nombres' },
    { label: 'Apellido', name: 'last_name', type: 'text', placeholder: 'Apellidos' },
    { label: 'Teléfono', name: 'phone', type: 'tel', placeholder: '+57 300 123 4567' },
    { label: 'Correo electrónico', name: 'email', type: 'email', placeholder: 'email@test.com' },
    { label: 'Contraseña', name: 'password', type: 'password', placeholder: '*******' },
    { label: 'Confirmar contraseña', name: 'confirmPassword', type: 'password', placeholder: '*******' }
  ] as const

  return (
    <div className="min-h-screen flex items-center justify-center bg-meow-background px-4">
      <div className="w-full max-w-md bg-meow-form rounded-2xl shadow-lg p-8 border border-meow-border">
        <h2 className="text-2xl font-bold text-meow-text mb-6">Registro de Usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-meow-text font-medium mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                id={field.name}
                value={form[field.name as keyof RegisterForm]}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
                required
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-red-600 text-sm">Las contraseñas no coinciden</p>
          )}

          {error && <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>}

          <button
            type="submit"
            disabled={loading || (form.password !== form.confirmPassword)}
            className="w-full bg-meow-accent text-white py-2 rounded-xl font-semibold hover:bg-meow-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-meow-text hover:underline text-sm">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
