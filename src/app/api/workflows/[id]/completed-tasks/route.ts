import { NextRequest, NextResponse } from 'next/server'
import { getCompletedWorkflowTasks } from '@/app/lib/actions/workflow_action'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await getCompletedWorkflowTasks(id)
    
    if (result.success) {
      return NextResponse.json({ success: true, tasks: result.tasks }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Get completed tasks API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
