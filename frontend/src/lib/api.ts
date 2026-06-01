import axios from "axios"

export const API_BASE_URL = "http://localhost:3001"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smart_queue_token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export type UserRole = "MANAGER" | "CLIENT"

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  userId: number
  name: string
  surname: string
  email: string
  role: UserRole
}

export type RegisterRequest = {
  name: string
  surname: string
  email: string
  password: string
  role: UserRole
}

export type RegisterResponse = {
  id: number
  name: string
  surname: string
  email: string
  role: UserRole
}

export type ForgotPasswordRequest = {
  email: string
}

export type ResetPasswordRequest = {
  token: string
  newPassword: string
}

export type MessageResponse = {
  message: string
}

export async function loginUser(data: LoginRequest) {
  const response = await api.post<LoginResponse>("/auth/login", data)
  return response.data
}

export async function registerUser(data: RegisterRequest) {
  const response = await api.post<RegisterResponse>("/auth/register", data)
  return response.data
}

export async function forgotPassword(data: ForgotPasswordRequest) {
  const response = await api.post<MessageResponse>("/auth/forgot-password", data)
  return response.data
}

export async function resetPassword(data: ResetPasswordRequest) {
  const response = await api.post<MessageResponse>("/auth/reset-password", data)
  return response.data
}
