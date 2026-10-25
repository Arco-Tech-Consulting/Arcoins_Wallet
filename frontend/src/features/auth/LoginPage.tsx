import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname
      navigate(from ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-xl font-semibold text-on-surface">Iniciar sesión</h2>
      <p className="mb-6 text-sm text-on-surface-variant">
        Ingresa con tu correo para acceder a tu billetera
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tucorreo@ejemplo.com"
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />

        {error ? (
          <p className="rounded-lg bg-error-container/30 px-3 py-2 text-sm text-on-error-container">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={submitting}>
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </Card>
  )
}