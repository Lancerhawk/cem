import { cookies } from 'next/headers'
import { UserWithoutPassword } from '../types/user'

export async function setUserSession(user: UserWithoutPassword) {
  const cookieStore = await cookies()
  
  cookieStore.set('user_id', user._id || '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 
  })
  
  cookieStore.set('user_email', user.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 
  })
}

export async function getUserSession() {
  const cookieStore = await cookies()
  
  const userId = cookieStore.get('user_id')?.value
  const userEmail = cookieStore.get('user_email')?.value
  
  if (!userId || !userEmail) {
    return null
  }
  
  return {
    _id: userId,
    email: userEmail
  }
}

export async function clearUserSession() {
  const cookieStore = await cookies()
  
  cookieStore.delete('user_id')
  cookieStore.delete('user_email')
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getUserSession()
  return session !== null
}
