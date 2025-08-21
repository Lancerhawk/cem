import { NextRequest, NextResponse } from 'next/server'
import { getWorkflowStats } from '@/app/lib/actions/workflow_action'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Get workflow stats API: Request received for workflow:', id)

    if (!id) {
      console.log('Get workflow stats API: No workflow ID provided')
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    console.log('Get workflow stats API: Calling getWorkflowStats with:', id)
    const result = await getWorkflowStats(id)
    console.log('Get workflow stats API: Result:', result)

    if (result.success) {
      return NextResponse.json(
        { success: true, stats: result.stats },
        { status: 200 }
      )
    } else {
      console.log('Get workflow stats API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Get workflow stats API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
