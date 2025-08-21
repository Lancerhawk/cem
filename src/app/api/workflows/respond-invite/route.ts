import { NextRequest, NextResponse } from 'next/server'
import { respondToWorkflowInvite } from '@/app/lib/actions/workflow_action'

export async function POST(request: NextRequest) {
  try {
    console.log('Respond to invite API: Request received')
    const body = await request.json()
    const { inviteId, response } = body
    
    console.log('Respond to invite API: Request body:', { inviteId, response })
    
    if (!inviteId || !response || !['Accepted', 'Declined'].includes(response)) {
      console.log('Respond to invite API: Invalid request data')
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      )
    }

    console.log('Respond to invite API: Calling respondToWorkflowInvite with:', { inviteId, response })
    const result = await respondToWorkflowInvite(inviteId, response)
    console.log('Respond to invite API: Result:', result)
    
    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message },
        { status: 200 }
      )
    } else {
      console.log('Respond to invite API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Respond to workflow invite API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
