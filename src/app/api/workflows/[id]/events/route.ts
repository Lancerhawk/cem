import { NextRequest, NextResponse } from 'next/server'
import { registerWorkflowCallback, unregisterWorkflowCallback } from '@/lib/sse-broadcast'

// Track active connections per workflow
const activeConnections = new Map<string, Set<ReadableStreamDefaultController>>()

// Track connected users per workflow
const connectedUsers = new Map<string, Set<string>>()



// Function to broadcast user connection status to all clients
const broadcastUserConnectionStatus = (workflowId: string) => {
  const connectedUserIds = connectedUsers.get(workflowId) || new Set()
  const message = `data: ${JSON.stringify({ 
    type: 'user-connection-status', 
    connectedUsers: Array.from(connectedUserIds) 
  })}\n\n`
  
  const connections = activeConnections.get(workflowId)
  if (connections) {
    const encoder = new TextEncoder()
    connections.forEach(controller => {
      try {
        controller.enqueue(encoder.encode(message))
      } catch (error) {
        // Error broadcasting user connection status
      }
    })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Get user ID from query params or headers
    const userId = request.nextUrl.searchParams.get('userId') || 
                   request.headers.get('x-user-id') || 
                   'unknown'
    
    // Initialize connections set for this workflow if it doesn't exist
    if (!activeConnections.has(id)) {
      activeConnections.set(id, new Set())
    }
    
    // Initialize connected users set for this workflow if it doesn't exist
    if (!connectedUsers.has(id)) {
      connectedUsers.set(id, new Set())
    }
    
    const connections = activeConnections.get(id)!
    const connectedUserIds = connectedUsers.get(id)!
    const currentCount = connections.size
    
    

    // Set up Server-Sent Events headers
    const response = new NextResponse(
      new ReadableStream({
        start(controller) {
          // Add this controller to the active connections
          connections.add(controller)
          
                     // Add user to connected users list
           if (userId !== 'unknown') {
             connectedUserIds.add(userId)
           }
          
          // Send initial connection message
          const message = `data: ${JSON.stringify({ type: 'connected', workflowId: id })}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
          
          // Broadcast updated user connection status to all clients
          broadcastUserConnectionStatus(id)

          // Register this connection with the broadcasting system
          const broadcastCallback = (eventType: string, data: any) => {
            try {
              const eventMessage = `data: ${JSON.stringify({ type: eventType, ...data })}\n\n`
              controller.enqueue(new TextEncoder().encode(eventMessage))
            } catch (error) {
              console.log('Error sending event to client, connection may be closed')
            }
          }
          
          registerWorkflowCallback(id, broadcastCallback)

          // Keep connection alive with heartbeat (reduced frequency)
          const heartbeat = setInterval(() => {
            try {
              const heartbeatMessage = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
              controller.enqueue(new TextEncoder().encode(heartbeatMessage))
            } catch (error) {
              console.log('Error sending heartbeat, connection may be closed')
              clearInterval(heartbeat)
            }
          }, 60000) // Send heartbeat every 60 seconds

          // Clean up on close
          request.signal.addEventListener('abort', () => {
       
            clearInterval(heartbeat)
            
            // Remove this controller from active connections
            connections.delete(controller)
            
                         // Remove user from connected users list
             if (userId !== 'unknown') {
               connectedUserIds.delete(userId)
             }
            
            // Unregister from broadcasting system
            unregisterWorkflowCallback(id, broadcastCallback)
            
                         // If no more connections, remove the workflow entry
             if (connections.size === 0) {
               activeConnections.delete(id)
               connectedUsers.delete(id)
             } else {
               // Broadcast updated user connection status
               broadcastUserConnectionStatus(id)
             }
            
            controller.close()
          })
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      }
    )

    return response
     } catch (error) {
     return NextResponse.json(
       { success: false, message: 'Internal server error' },
       { status: 500 }
     )
   }
}
