'use server'

import bcrypt from 'bcryptjs'
import clientPromise from '../mongodb'
import { User, SignUpData, SignInData, OTPVerification, AuthResponse, UserWithoutPassword } from '../types/user'
import { OTP, CreateOTPData } from '../types/otp'
import { sendOTPEmail, generateOTP, getOTPExpiryTime } from '../utils/email'
import { serializeUser } from '../utils/serialization'
import { setUserSession, clearUserSession, getUserSession } from '../utils/session'

const getCollections = async () => {
  const client = await clientPromise
  const db = client.db('cem_app')
  return {
    users: db.collection<User>('users'),
    otps: db.collection<OTP>('otps')
  }
}

export async function sendSignUpOTP(data: SignUpData): Promise<AuthResponse> {
  try {
    const { users, otps } = await getCollections()
    
    const existingUser = await users.findOne({ email: data.email })
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists'
      }
    }

    const otp = generateOTP()
    const otpData: CreateOTPData = {
      email: data.email,
      otp,
      expiresAt: getOTPExpiryTime()
    }

    await otps.deleteMany({ email: data.email })
    
    await otps.insertOne({
      ...otpData,
      createdAt: new Date()
    })

    const emailResult = await sendOTPEmail(data.email, otp, data.firstName)
    
    if (!emailResult.success) {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Verification code sent successfully. Please check your email.'
    }
  } catch (error) {
    console.error('Send signup OTP error:', error)
    return {
      success: false,
      message: 'An error occurred while sending verification code. Please try again.'
    }
  }
}

export async function createUserAccount(data: SignUpData): Promise<AuthResponse> {
  try {
    const { users } = await getCollections()
    
    const existingUser = await users.findOne({ email: data.email })
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists'
      }
    }

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(data.password, saltRounds)

    const newUser: Omit<User, '_id'> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await users.insertOne(newUser)
    
    if (!result.acknowledged) {
      return {
        success: false,
        message: 'Failed to create user account'
      }
    }

    const user = await users.findOne({ _id: result.insertedId })
    if (!user) {
      return {
        success: false,
        message: 'Failed to retrieve created user'
      }
    }

    const { password, ...userWithoutPassword } = user
    const serializedUser = serializeUser(userWithoutPassword)

    await setUserSession(serializedUser)

    return {
      success: true,
      message: 'Account created successfully!',
      user: serializedUser
    }
  } catch (error) {
    console.error('Create user account error:', error)
    return {
      success: false,
      message: 'An error occurred while creating your account. Please try again.'
    }
  }
}

export async function verifySignUpOTP(data: OTPVerification): Promise<AuthResponse> {
  try {
    const { otps } = await getCollections()
    
    const otpRecord = await otps.findOne({ 
      email: data.email, 
      otp: data.otp,
      expiresAt: { $gt: new Date() }
    })

    if (!otpRecord) {
      return {
        success: false,
        message: 'Invalid or expired verification code'
      }
    }

    await otps.deleteOne({ _id: otpRecord._id })

    return {
      success: true,
      message: 'Email verified successfully. You can now create your account.'
    }
  } catch (error) {
    console.error('OTP verification error:', error)
    return {
      success: false,
      message: 'An error occurred during verification. Please try again.'
    }
  }
}

export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const { users } = await getCollections()
    
    const user = await users.findOne({ email: data.email })
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      }
    }

    if (!user.emailVerified) {
      return {
        success: false,
        message: 'Please verify your email before signing in'
      }
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password)
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password'
      }
    }

    const { password, ...userWithoutPassword } = user
    const serializedUser = serializeUser(userWithoutPassword)

    await setUserSession(serializedUser)

    return {
      success: true,
      message: 'Signed in successfully',
      user: serializedUser
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      success: false,
      message: 'An error occurred during sign in. Please try again.'
    }
  }
}

export async function resendOTP(email: string): Promise<AuthResponse> {
  try {
    const { users, otps } = await getCollections()
    
    const user = await users.findOne({ email })
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    const otp = generateOTP()
    const otpData: CreateOTPData = {
      email,
      otp,
      expiresAt: getOTPExpiryTime()
    }

    await otps.deleteMany({ email })
    
    await otps.insertOne({
      ...otpData,
      createdAt: new Date()
    })

    const emailResult = await sendOTPEmail(email, otp, user.firstName)
    
    if (!emailResult.success) {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Verification code sent successfully'
    }
  } catch (error) {
    console.error('Resend OTP error:', error)
    return {
      success: false,
      message: 'An error occurred while sending verification code. Please try again.'
    }
  }
}

export async function resendSignUpOTP(email: string, firstName: string): Promise<AuthResponse> {
  try {
    const { otps } = await getCollections()
    
    const otp = generateOTP()
    const otpData: CreateOTPData = {
      email,
      otp,
      expiresAt: getOTPExpiryTime()
    }

    await otps.deleteMany({ email })
    
    await otps.insertOne({
      ...otpData,
      createdAt: new Date()
    })

    const emailResult = await sendOTPEmail(email, otp, firstName)
    
    if (!emailResult.success) {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Verification code sent successfully'
    }
  } catch (error) {
    console.error('Resend signup OTP error:', error)
    return {
      success: false,
      message: 'An error occurred while sending verification code. Please try again.'
    }
  }
}

export async function getUserByEmail(email: string): Promise<UserWithoutPassword | null> {
  try {
    const { users } = await getCollections()
    const user = await users.findOne({ email })
    
    if (!user) return null
    
    const { password, ...userWithoutPassword } = user
    return serializeUser(userWithoutPassword)
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

export async function sendForgotPasswordOTP(email: string): Promise<AuthResponse> {
  try {
    const { users, otps } = await getCollections()
    
    const user = await users.findOne({ email })
    if (!user) {
      return {
        success: false,
        message: 'No account found with this email address'
      }
    }

    const otp = generateOTP()
    const otpData: CreateOTPData = {
      email,
      otp,
      expiresAt: getOTPExpiryTime()
    }

    await otps.deleteMany({ email })
    
    await otps.insertOne({
      ...otpData,
      createdAt: new Date()
    })

    const emailResult = await sendOTPEmail(email, otp, user.firstName)
    
    if (!emailResult.success) {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Password reset code sent successfully. Please check your email.'
    }
  } catch (error) {
    console.error('Send forgot password OTP error:', error)
    return {
      success: false,
      message: 'An error occurred while sending verification code. Please try again.'
    }
  }
}

export async function verifyForgotPasswordOTP(data: OTPVerification): Promise<AuthResponse> {
  try {
    const { otps } = await getCollections()
    
    const otpRecord = await otps.findOne({ 
      email: data.email, 
      otp: data.otp,
      expiresAt: { $gt: new Date() }
    })

    if (!otpRecord) {
      return {
        success: false,
        message: 'Invalid or expired verification code'
      }
    }

    await otps.deleteOne({ _id: otpRecord._id })

    return {
      success: true,
      message: 'Email verified successfully. You can now reset your password.'
    }
  } catch (error) {
    console.error('Forgot password OTP verification error:', error)
    return {
      success: false,
      message: 'An error occurred during verification. Please try again.'
    }
  }
}

export async function resetPassword(data: { email: string; password: string }): Promise<AuthResponse> {
  try {
    const { users } = await getCollections()
    
    const user = await users.findOne({ email: data.email })
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(data.password, saltRounds)

    const result = await users.updateOne(
      { email: data.email },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    )

    if (!result.acknowledged || result.modifiedCount === 0) {
      return {
        success: false,
        message: 'Failed to reset password'
      }
    }

    return {
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      success: false,
      message: 'An error occurred while resetting password. Please try again.'
    }
  }
}

export async function resendForgotPasswordOTP(email: string): Promise<AuthResponse> {
  try {
    const { users, otps } = await getCollections()
    
    const user = await users.findOne({ email })
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    const otp = generateOTP()
    const otpData: CreateOTPData = {
      email,
      otp,
      expiresAt: getOTPExpiryTime()
    }

    await otps.deleteMany({ email })
    
    await otps.insertOne({
      ...otpData,
      createdAt: new Date()
    })

    const emailResult = await sendOTPEmail(email, otp, user.firstName)
    
    if (!emailResult.success) {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Password reset code sent successfully'
    }
  } catch (error) {
    console.error('Resend forgot password OTP error:', error)
    return {
      success: false,
      message: 'An error occurred while sending verification code. Please try again.'
    }
  }
}

export async function getCurrentUser(): Promise<UserWithoutPassword | null> {
  try {
    const session = await getUserSession()
    if (!session) return null
    
    const user = await getUserByEmail(session.email)
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function logout(): Promise<{ success: boolean; message: string }> {
  try {
    await clearUserSession()
    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      message: 'An error occurred during logout'
    }
  }
}
