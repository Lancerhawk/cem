import { ObjectId } from 'mongodb'

export function serializeMongoObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeMongoObject(item)) as T
  }

  if (obj instanceof ObjectId) {
    return obj.toString() as T
  }

  if (obj instanceof Date) {
    return obj.toISOString() as T
  }

  const serialized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof ObjectId) {
      serialized[key] = value.toString()
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString()
    } else if (value && typeof value === 'object') {
      serialized[key] = serializeMongoObject(value)
    } else {
      serialized[key] = value
    }
  }

  return serialized
}

export function serializeUser(user: any): any {
  if (!user) return user
  
  return serializeMongoObject({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  })
}
