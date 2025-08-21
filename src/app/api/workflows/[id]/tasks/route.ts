import { NextRequest, NextResponse } from 'next/server'
import { createWorkflowTask, getWorkflowTasks } from '@/app/lib/actions/workflow_action'
import { broadcastTaskCreated } from '@/lib/sse-broadcast'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const lastUpdate = searchParams.get('lastUpdate')
    
    console.log('Get workflow tasks API: Request received for workflow:', id, 'lastUpdate:', lastUpdate)

    if (!id) {
      console.log('Get workflow tasks API: No workflow ID provided')
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    console.log('Get workflow tasks API: Calling getWorkflowTasks with:', id)
    const result = await getWorkflowTasks(id)
    console.log('Get workflow tasks API: Result:', result)

    if (result.success) {
      // If this is a polling request, check for updates
      if (lastUpdate) {
        const lastUpdateTime = parseInt(lastUpdate)
        const currentTasks = result.tasks || []
        
        // For now, we'll always return hasUpdates: true to simulate real-time updates
        // In a real implementation, you'd compare timestamps to detect actual changes
        return NextResponse.json({
          success: true,
          hasUpdates: true,
          tasks: currentTasks,
          newTasks: [],
          updatedTasks: [],
          deletedTaskIds: []
        }, { status: 200 })
      }

      // Regular request - return all tasks
      return NextResponse.json(
        { success: true, tasks: result.tasks },
        { status: 200 }
      )
    } else {
      console.log('Get workflow tasks API: Failed with message:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Get workflow tasks API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Create task API: Request received for workflow:', id)
    if (!id) {
      console.log('Create task API: No workflow ID provided')
      return NextResponse.json({ success: false, message: 'Workflow ID is required' }, { status: 400 })
    }
    const body = await request.json()
    const { title, description, priority, dueDate, assignedMembers } = body
    console.log('Create task API: Request body:', { title, description, priority, dueDate, assignedMembers })
    if (!title || !description || !assignedMembers || assignedMembers.length === 0) {
      console.log('Create task API: Missing required fields')
      return NextResponse.json({ success: false, message: 'Title, description, and assigned members are required' }, { status: 400 })
    }
    console.log('Create task API: Calling createWorkflowTask with:', { workflowId: id, taskData: body })
    const result = await createWorkflowTask(id, body)
    console.log('Create task API: Result:', result)
    if (result.success) {
      // Get the complete enriched task data before broadcasting
      try {
        // Fetch the complete task with all enriched data
        const enrichedTaskResponse = await getWorkflowTasks(id)
        if (enrichedTaskResponse.success && enrichedTaskResponse.tasks) {
          // Find the newly created task in the enriched list
          const newTask = enrichedTaskResponse.tasks.find(task => 
            task._id === result.task._id || 
            task.title === result.task.title
          )
          
          if (newTask) {
            // Broadcast the enriched task data
            broadcastTaskCreated(id, newTask)
            console.log(`Broadcasted enriched task creation to workflow ${id}`)
          } else {
            // Fallback to basic task data
            broadcastTaskCreated(id, result.task)
            console.log(`Broadcasted basic task creation to workflow ${id}`)
          }
        } else {
          // Fallback to basic task data
          broadcastTaskCreated(id, result.task)
          console.log(`Broadcasted basic task creation to workflow ${id}`)
        }
      } catch (broadcastError) {
        console.log('Broadcast failed (non-critical):', broadcastError)
      }
      
      return NextResponse.json({ success: true, message: result.message, task: result.task }, { status: 200 })
    } else {
      console.log('Create task API: Failed with message:', result.message)
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Create task API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
