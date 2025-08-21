import { NextRequest, NextResponse } from 'next/server'
import { confirmTaskCompletion } from '@/app/lib/actions/workflow_action'
import { broadcastTaskCompleted } from '@/lib/sse-broadcast'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
    const body = await request.json()

    const result = await confirmTaskCompletion(id, taskId, body)
    
    if (result.success) {
      // Get the complete enriched task data before broadcasting
      try {
        // Fetch the complete task with all enriched data
        const { getWorkflowTasks } = await import('@/app/lib/actions/workflow_action')
        const enrichedTaskResponse = await getWorkflowTasks(id)
        if (enrichedTaskResponse.success && enrichedTaskResponse.tasks) {
          // Find the updated task in the enriched list
          const updatedTask = enrichedTaskResponse.tasks.find(task => 
            task._id === taskId
          )
          
          if (updatedTask) {
            // Broadcast the enriched task data
            broadcastTaskCompleted(id, updatedTask)
            console.log(`Broadcasted enriched task completion to workflow ${id}`)
          } else {
            // Fallback to basic task data
            broadcastTaskCompleted(id, result.task || { _id: taskId, ...body })
            console.log(`Broadcasted basic task completion to workflow ${id}`)
          }
        } else {
          // Fallback to basic task data
          broadcastTaskCompleted(id, result.task || { _id: taskId, ...body })
          console.log(`Broadcasted basic task completion to workflow ${id}`)
        }
      } catch (broadcastError) {
        console.log('Broadcast failed (non-critical):', broadcastError)
      }
      
      return NextResponse.json({ success: true, message: result.message }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Confirm task completion API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
