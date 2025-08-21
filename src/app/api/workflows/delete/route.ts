import { NextRequest, NextResponse } from 'next/server'
import { deleteWorkflow } from '@/app/lib/actions/workflow_action'

export async function DELETE(request: NextRequest) {
  try {
    console.log('Delete workflow API: Request received')
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('id')

    console.log('Delete workflow API: Workflow ID:', workflowId)

    if (!workflowId) {
      console.log('Delete workflow API: No workflow ID provided')
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    console.log('Delete workflow API: Calling deleteWorkflow with:', workflowId)
    const result = await deleteWorkflow(workflowId)
    console.log('Delete workflow API: Result:', result)

    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message },
        { status: 200 }
      )
    } else {
      console.log('Delete workflow API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Delete workflow API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
