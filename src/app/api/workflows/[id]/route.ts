import { NextRequest, NextResponse } from 'next/server'
import { getWorkflowById, updateWorkflow } from '@/app/lib/actions/workflow_action'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Get workflow API: Request received for workflow:', id)

    if (!id) {
      console.log('Get workflow API: No workflow ID provided')
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    console.log('Get workflow API: Calling getWorkflowById with:', id)
    const result = await getWorkflowById(id)
    console.log('Get workflow API: Result:', result)

    if (result.success) {
      return NextResponse.json(
        { success: true, workflow: result.workflow },
        { status: 200 }
      )
    } else {
      console.log('Get workflow API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Get workflow API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('Update workflow API: Request received for workflow:', id, 'with data:', body)

    if (!id) {
      console.log('Update workflow API: No workflow ID provided')
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Workflow name is required' },
        { status: 400 }
      )
    }

    console.log('Update workflow API: Calling updateWorkflow with:', id, body)
    const result = await updateWorkflow(id, {
      name: body.name.trim(),
      description: body.description?.trim() || ''
    })
    console.log('Update workflow API: Result:', result)

    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message, workflow: result.workflow },
        { status: 200 }
      )
    } else {
      console.log('Update workflow API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Update workflow API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
