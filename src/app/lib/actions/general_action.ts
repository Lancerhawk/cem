'use server'

import clientPromise from '../mongodb'
import { OTP } from '../types/otp'
import { serializeMongoObject } from '../utils/serialization'

export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    const client = await clientPromise
    const db = client.db('cem_app')
    const otps = db.collection<OTP>('otps')
    
    await otps.deleteMany({
      expiresAt: { $lt: new Date() }
    })
  } catch (error) {
    console.error('Cleanup expired OTPs error:', error)
  }
}

export async function getDatabaseStats() {
  try {
    const client = await clientPromise
    const db = client.db('cem_app')
    
    const usersCount = await db.collection('users').countDocuments()
    const otpsCount = await db.collection('otps').countDocuments()
    
    return serializeMongoObject({
      users: usersCount,
      otps: otpsCount,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Get database stats error:', error)
    return null
  }
}
