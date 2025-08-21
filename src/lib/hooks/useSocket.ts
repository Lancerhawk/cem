import { useEffect, useRef, useCallback, useState } from 'react'

interface UseSocketOptions {
  workflowId?: string
  userId?: string
  onTaskCreated?: (task: any) => void
  onTaskUpdated?: (task: any) => void
  onTaskDeleted?: (taskId: string) => void
  onTaskStatusChanged?: (task: any) => void
  onTaskCompleted?: (task: any) => void
  onUserConnectionStatus?: (connectedUsers: string[]) => void
}

export const useSocket = ({
  workflowId,
  userId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskStatusChanged,
  onTaskCompleted,
  onUserConnectionStatus
}: UseSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)
  const connectionIdRef = useRef<string>('')

  // Connect to Server-Sent Events
  const connect = useCallback(() => {
         if (!workflowId || eventSourceRef.current || isConnectingRef.current) {
       return
     }

         isConnectingRef.current = true
     connectionIdRef.current = Math.random().toString(36).substr(2, 9)

    try {
      const url = userId ? 
        `/api/workflows/${workflowId}/events?userId=${encodeURIComponent(userId)}` : 
        `/api/workflows/${workflowId}/events`
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

             eventSource.onopen = () => {
         setIsConnected(true)
         isConnectingRef.current = false
       }

             eventSource.onmessage = (event) => {
         try {
           const data = JSON.parse(event.data)
           
           switch (data.type) {
             case 'task-created':
               onTaskCreated?.(data.task)
               break
             case 'task-updated':
               onTaskUpdated?.(data.task)
               break
             case 'task-deleted':
               onTaskDeleted?.(data.taskId)
               break
             case 'task-status-changed':
               onTaskStatusChanged?.(data.task)
               break
             case 'task-completed':
               onTaskCompleted?.(data.task)
               break
             case 'heartbeat':
               // Just log heartbeat, no action needed
               break
             case 'connected':
               break
             case 'user-connection-status':
               onUserConnectionStatus?.(data.connectedUsers)
               break
             default:
               break
           }
         } catch (error) {
           // Error parsing SSE message
         }
       }

             eventSource.onerror = (error) => {
         setIsConnected(false)
         isConnectingRef.current = false
         
         // Only attempt to reconnect if we don't have a connection
         if (!eventSourceRef.current) return
         
         // Attempt to reconnect after 5 seconds
         if (reconnectTimeoutRef.current) {
           clearTimeout(reconnectTimeoutRef.current)
         }
         reconnectTimeoutRef.current = setTimeout(() => {
           disconnect()
           // Wait a bit before reconnecting to avoid rapid reconnection attempts
           setTimeout(() => {
             if (workflowId) {
               connect()
             }
           }, 1000)
         }, 5000)
       }

         } catch (error) {
       setIsConnected(false)
       isConnectingRef.current = false
     }
  }, [workflowId, onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskStatusChanged, onTaskCompleted])

     // Disconnect from SSE
   const disconnect = useCallback(() => {
     if (eventSourceRef.current) {
       eventSourceRef.current.close()
       eventSourceRef.current = null
     }
     
     if (reconnectTimeoutRef.current) {
       clearTimeout(reconnectTimeoutRef.current)
       reconnectTimeoutRef.current = null
     }
     
     setIsConnected(false)
     isConnectingRef.current = false
   }, [])

     // Manual refresh function
   const refresh = useCallback(async () => {
     if (!workflowId) return
 
     try {
       const response = await fetch(`/api/workflows/${workflowId}/tasks`)
       if (response.ok) {
         const data = await response.json()
         if (data.success) {
           // Refresh completed
         }
       }
     } catch (error) {
       // Refresh failed
     }
   }, [workflowId])

     // Connect when workflowId is available
   useEffect(() => {
     if (workflowId) {
       connect()
     }
 
     return () => {
       disconnect()
     }
   }, [workflowId]) // Remove connect and disconnect from dependencies to prevent recreation

  return {
    isConnected,
    connect,
    disconnect,
    refresh,
    connectionId: connectionIdRef.current,
         // Simulate WebSocket-like methods for compatibility
     emit: (event: string, data: any) => {
       // In a real WebSocket setup, this would send data to the server
     }
  }
}
