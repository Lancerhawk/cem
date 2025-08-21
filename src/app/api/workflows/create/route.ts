import { NextRequest, NextResponse } from 'next/server'
import { createWorkflow } from '@/app/lib/actions/workflow_action'

export async function POST(request: NextRequest) {
  try {
    console.log('Create workflow API: Request received')
    const body = await request.json()
    console.log('Create workflow API: Request body:', body)
    
    const result = await createWorkflow(body)
    console.log('Create workflow API: Result:', result)
    
    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message, workflow: result.workflow },
        { status: 201 }
      )
    } else {
      console.log('Create workflow API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Create workflow API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
