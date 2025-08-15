import React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

interface RegisterForm {
  firstName: string
  lastName: string
  idNumber: string
  birthDate: string
  address: string
  email: string
  password: string
}

function Register() {
  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    idNumber: '',
    birthDate: '',
    address: '',
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí podrías validar o enviar los datos
    console.log('Registro enviado:', form)
  }

  const fields = [
    { label: 'Nombre', name: 'firstName', type: 'text', placeholder: 'Nombres' },
    { label: 'Apellido', name: 'lastName', type: 'text',placeholder: 'Apellidos' },
    { label: 'Cédula', name: 'idNumber', type: 'text', placeholder: 'Numero de cedula' },
    { label: 'Fecha de nacimiento', name: 'birthDate', type: 'date',placeholder: 'Fecha de nacimiento' },
    { label: 'Dirección', name: 'address', type: 'text', placeholder: 'Calle 123 #45-67, Ciudad' },
    { label: 'Correo electrónico', name: 'email', type: 'email', placeholder: 'email@test.com' },
    { label: 'Contraseña', name: 'password', type: 'password', placeholder: '*******' }
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
          <button
            type="submit"
            className="w-full bg-meow-accent text-white py-2 rounded-xl font-semibold hover:bg-meow-accent/90 transition"
          >
            Registrarse
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
