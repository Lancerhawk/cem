# Real-Time Workflow Tasks Updates

This document explains how the real-time functionality works in the workflow management system.

## Overview

The system now provides real-time updates for workflow tasks using Server-Sent Events (SSE). When tasks are created, updated, deleted, or have their status changed, all connected users will see these changes immediately without needing to refresh the page.

## How It Works

### 1. Server-Sent Events (SSE)
- Uses the native `EventSource` API for real-time communication
- Establishes a persistent connection between client and server
- Automatically reconnects if the connection is lost
- Sends heartbeat messages every 30 seconds to keep connections alive

### 2. Real-Time Updates
The system automatically updates the UI when:
- **New tasks are created** - Added to the top of the task list
- **Tasks are updated** - Modified in place with new information
- **Tasks are deleted** - Removed from the list
- **Task status changes** - Updated with new status
- **Tasks are completed** - Status updated to completed

### 3. Connection Status
- **Green dot**: Connected and receiving live updates
- **Red dot**: Disconnected (will automatically reconnect)
- **Manual refresh button**: Available for immediate updates if needed

## Technical Implementation

### Client-Side (`useSocket` hook)
```typescript
const { isConnected, refresh } = useSocket({
  workflowId,
  onTaskCreated: (task) => { /* handle new task */ },
  onTaskUpdated: (task) => { /* handle task update */ },
  onTaskDeleted: (taskId) => { /* handle task deletion */ },
  onTaskStatusChanged: (task) => { /* handle status change */ },
  onTaskCompleted: (task) => { /* handle completion */ }
})
```

### Server-Side (SSE API)
- **Endpoint**: `/api/workflows/[id]/events`
- **Method**: GET
- **Response**: Server-Sent Events stream
- **Features**: Automatic reconnection, heartbeat messages

### Toast Notifications
- Real-time notifications appear when updates occur
- Different types: Success (green), Info (blue), Error (red)
- Auto-dismiss after 4-5 seconds
- Can be manually dismissed

## Benefits

1. **Immediate Updates**: No need to refresh the page
2. **Collaborative Experience**: Team members see changes in real-time
3. **Better User Experience**: Smooth, responsive interface
4. **Automatic Reconnection**: Handles network issues gracefully
5. **Lightweight**: Uses native browser APIs, no heavy dependencies

## Browser Support

- **Modern Browsers**: Full support for SSE
- **Fallback**: Manual refresh button available
- **Mobile**: Works on mobile browsers with SSE support

## Performance Considerations

- **Connection Limits**: One SSE connection per workflow
- **Memory Usage**: Minimal overhead, automatic cleanup
- **Network**: Efficient, only sends data when changes occur
- **Scalability**: Each workflow has its own connection

## Troubleshooting

### Connection Issues
1. Check if the green dot is visible
2. Try the manual refresh button
3. Check browser console for errors
4. Ensure no firewall/proxy blocking SSE connections

### Missing Updates
1. Verify you're viewing the correct workflow
2. Check connection status
3. Try manual refresh
4. Check browser console for error messages

## Future Enhancements

- WebSocket support for bi-directional communication
- Push notifications for mobile devices
- Offline support with sync when reconnected
- Real-time chat within workflows
- Live collaboration indicators
