export interface User {
  _id?: string
  firstName: string
  lastName: string
  email: string
  password: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserWithoutPassword {
  _id?: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface SignInData {
  email: string
  password: string
}

export interface OTPVerification {
  email: string
  otp: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: UserWithoutPassword
  token?: string
}
