import type { LoginResponse, UserRole } from "./api"

const TOKEN_KEY = "smart_queue_token"
const USER_KEY = "smart_queue_user"

export type { LoginResponse }

export type AuthUser = {
  id: number
  name: string
  surname: string
  email: string
  role: UserRole
}

export function saveAuthSession(loginResponse: LoginResponse) {
  const user: AuthUser = {
    id: loginResponse.userId,
    name: loginResponse.name,
    surname: loginResponse.surname,
    email: loginResponse.email,
    role: loginResponse.role,
  }

  localStorage.setItem(TOKEN_KEY, loginResponse.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function extractTokenFromLoginResponse(loginResponse: LoginResponse) {
  return loginResponse.token
}

export function saveAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function saveAuthUser(loginResponse: LoginResponse) {
  const user: AuthUser = {
    id: loginResponse.userId,
    name: loginResponse.name,
    surname: loginResponse.surname,
    email: loginResponse.email,
    role: loginResponse.role,
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAuthUser(): AuthUser | null {
  const savedUser = localStorage.getItem(USER_KEY)

  if (!savedUser) {
    return null
  }

  try {
    const parsedUser = JSON.parse(savedUser)

    if (!isValidAuthUser(parsedUser)) {
      clearAuthSession()
      return null
    }

    return parsedUser
  } catch {
    clearAuthSession()
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken() && getAuthUser())
}

export function hasRole(role: UserRole) {
  const user = getAuthUser()
  return user?.role === role
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function logout() {
  clearAuthSession()
  window.location.href = "/login"
}

function isValidAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false
  }

  const user = value as AuthUser

  return (
    typeof user.id === "number" &&
    typeof user.name === "string" &&
    typeof user.surname === "string" &&
    typeof user.email === "string" &&
    (user.role === "MANAGER" || user.role === "CLIENT")
  )
}
