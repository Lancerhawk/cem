import { NextRequest, NextResponse } from 'next/server'
import { deleteWorkflowTask } from '@/app/lib/actions/workflow_action'
import { broadcastTaskDeleted } from '@/lib/sse-broadcast'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params

    const result = await deleteWorkflowTask(id, taskId)
    
    if (result.success) {
      // Broadcast the task deletion to all connected clients in this workflow
      try {
        broadcastTaskDeleted(id, taskId)
        console.log(`Broadcasted task deletion to workflow ${id}`)
      } catch (broadcastError) {
        console.log('Broadcast failed (non-critical):', broadcastError)
      }
      
      return NextResponse.json({ success: true, message: result.message }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Delete task API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
