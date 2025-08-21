// This file provides a way to broadcast SSE events from API routes
// Since we can't directly import from the events route, we'll use a different approach

// Global event emitter for cross-route communication
const eventEmitter = new Map<string, Set<(eventType: string, data: any) => void>>()

// Register a callback for a specific workflow
export const registerWorkflowCallback = (workflowId: string, callback: (eventType: string, data: any) => void) => {
  if (!eventEmitter.has(workflowId)) {
    eventEmitter.set(workflowId, new Set())
  }
  eventEmitter.get(workflowId)!.add(callback)
}

// Unregister a callback
export const unregisterWorkflowCallback = (workflowId: string, callback: (eventType: string, data: any) => void) => {
  const callbacks = eventEmitter.get(workflowId)
  if (callbacks) {
    callbacks.delete(callback)
    if (callbacks.size === 0) {
      eventEmitter.delete(workflowId)
    }
  }
}

// Broadcast an event to all registered callbacks for a workflow
export const broadcastToWorkflow = (workflowId: string, eventType: string, data: any) => {
  const callbacks = eventEmitter.get(workflowId)
  if (callbacks) {
    callbacks.forEach(callback => {
      try {
        callback(eventType, data)
             } catch (error) {
         // Error in workflow callback
       }
    })
    
  }
}

// Helper functions for common task events
export const broadcastTaskCreated = (workflowId: string, task: any) => {
  broadcastToWorkflow(workflowId, 'task-created', { task })
}

export const broadcastTaskUpdated = (workflowId: string, task: any) => {
  broadcastToWorkflow(workflowId, 'task-updated', { task })
}

export const broadcastTaskDeleted = (workflowId: string, taskId: string) => {
  broadcastToWorkflow(workflowId, 'task-deleted', { taskId })
}

export const broadcastTaskStatusChanged = (workflowId: string, task: any) => {
  broadcastToWorkflow(workflowId, 'task-status-changed', { task })
}

export const broadcastTaskCompleted = (workflowId: string, task: any) => {
  broadcastToWorkflow(workflowId, 'task-completed', { task })
}
