import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/app/lib/utils/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: session._id,
        email: session.email
      }
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
