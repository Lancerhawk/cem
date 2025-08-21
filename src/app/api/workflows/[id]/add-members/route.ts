import { NextRequest, NextResponse } from 'next/server'
import { addMembersToWorkflow } from '@/app/lib/actions/workflow_action'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Add members API: Request received for workflow:', id)

    if (!id) {
      console.log('Add members API: No workflow ID provided')
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { memberEmails } = body

    console.log('Add members API: Request body:', { memberEmails })

    if (!memberEmails || !Array.isArray(memberEmails) || memberEmails.length === 0) {
      console.log('Add members API: Invalid member emails data')
      return NextResponse.json(
        { success: false, message: 'Valid member emails array is required' },
        { status: 400 }
      )
    }

    console.log('Add members API: Calling addMembersToWorkflow with:', { workflowId: id, memberEmails })
    const result = await addMembersToWorkflow(id, memberEmails)
    console.log('Add members API: Result:', result)

    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message },
        { status: 200 }
      )
    } else {
      console.log('Add members API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Add members API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
