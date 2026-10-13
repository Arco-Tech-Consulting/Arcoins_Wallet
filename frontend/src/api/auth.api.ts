import { apiRequest } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/api'

interface AuthEnvelope {
  token: string
  user: User
}

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const data = (await apiRequest('/auth/login', {
    method: 'POST',
    body,
  })) as AuthEnvelope
  return { token: data.token, user: data.user }
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const data = (await apiRequest('/auth/register', {
    method: 'POST',
    body,
  })) as AuthEnvelope
  return { token: data.token, user: data.user }
}

export async function getCurrentUser(): Promise<User> {
  const data = (await apiRequest('/auth/me')) as { user: User }
  return data.user
}