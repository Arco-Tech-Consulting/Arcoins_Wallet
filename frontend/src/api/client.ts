const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'arcoins.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: HeadersInit
  body?: unknown
}

export async function apiRequest(
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const hasBody =
    options.body !== undefined && options.body !== null
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const body: BodyInit | undefined =
    options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : (options.body as BodyInit | undefined)

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
  })

  const text = await response.text()
  const data: unknown = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
    }
    const message = extractErrorMessage(data) ?? `Error ${response.status}`
    throw new ApiError(response.status, message, data)
  }

  return data
}

function extractErrorMessage(data: unknown): string | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error
  }
  return null
}