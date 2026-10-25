import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '@/api/auth.api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError('La contraseña debe contener al menos una letra mayúscula')
      return
    }
    if (!/[a-z]/.test(password)) {
      setError('La contraseña debe contener al menos una letra minúscula')
      return
    }
    if (!/[0-9\W_]/.test(password)) {
      setError('La contraseña debe contener al menos un número o símbolo')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)
    try {
      await apiRegister({ firstName, lastName, email, password, confirmPassword })
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-xl font-semibold text-on-surface">Crear cuenta</h2>
      <p className="mb-6 text-sm text-on-surface-variant">
        Administra tus saldos en COP, USD y EUR
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombres"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <Input
            label="Apellidos"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </div>
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tucorreo@ejemplo.com"
          required
        />
        <div>
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número o símbolo.
          </p>
        </div>
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repite tu contraseña"
          minLength={8}
          required
        />

        {error ? (
          <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={submitting}>
          Registrarse
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </Card>
  )
}