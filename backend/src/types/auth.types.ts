import { Request } from 'express';

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
