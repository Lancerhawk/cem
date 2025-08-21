import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/app/lib/actions/auth_action'

export async function POST(request: NextRequest) {
  try {
    const result = await logout()
    
    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
