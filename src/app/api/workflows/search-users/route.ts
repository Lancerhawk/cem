import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/app/lib/actions/workflow_action'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    const users = await searchUsers(query.trim())
    
    return NextResponse.json(
      { success: true, users },
      { status: 200 }
    )
  } catch (error) {
    console.error('Search users API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
