import { NextRequest, NextResponse } from 'next/server'
import { getPendingInvites } from '@/app/lib/actions/workflow_action'

export async function GET(request: NextRequest) {
  try {
    console.log('Get pending invites API: Request received')
    
    const invites = await getPendingInvites()
    console.log('Get pending invites API: Found invites:', invites.length)
    
    return NextResponse.json(
      { success: true, invites },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get pending invites API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
