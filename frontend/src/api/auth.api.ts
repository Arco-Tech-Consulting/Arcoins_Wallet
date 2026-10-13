import { apiRequest } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/api'

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const data = await apiRequest('/auth/login', { method: 'POST', body })
  return data as AuthResponse
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const data = await apiRequest('/auth/register', { method: 'POST', body })
  return data as AuthResponse
}

export async function getCurrentUser(): Promise<User> {
  const data = await apiRequest('/auth/me')
  return data as User
}