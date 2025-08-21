'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  UsersIcon, 
  CalendarIcon, 
  FlagIcon, 
  PlusIcon, 
  EditIcon, 
  Trash2Icon,
  ActivityIcon,
  MessageSquareIcon,
  FileTextIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon
} from 'lucide-react'
import { Workflow, WorkflowMember } from '@/app/lib/types/workflow'
import Link from 'next/link'
import AddMemberModal from '../AddMemberModal'
import CreateTaskModal from '../CreateTaskModal'
import ManagePermissionsModal from '../ManagePermissionsModal'
import EditTaskModal from '../EditTaskModal'
import TaskStatusModal from '../TaskStatusModal'
import TaskCompletionModal from '../TaskCompletionModal'
import CompletedTasksModal from '../CompletedTasksModal'
import DeleteConfirmationModal from '../DeleteConfirmationModal'
import EditWorkflowModal from '../EditWorkflowModal'
import { useSocket } from '@/lib/hooks/useSocket'
import { useToast, ToastContainer } from '@/components/Toast'

interface WorkflowStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
}

interface LocalTask {
  _id: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Pending' | 'In Progress' | 'Awaiting Confirmation' | 'Completed' | 'Cancelled'
  dueDate?: string
  assignedMembers: any[]
  createdBy: string
  creator?: any
  createdAt: string
  updatedAt: string
  confirmedBy?: string // Added for completion confirmation
  completionMessage?: string // Added for completion message
  completedAt?: string // Added for completion date
  confirmedAt?: string // Added for confirmation date
  completedBy?: string // Added for who completed the task
  feedbackForCompleter?: string // Added for feedback from admin/creator
  feedbackAt?: string // Added for when feedback was received
}

export default function WorkflowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workflowId = params.id as string
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<WorkflowStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  })
  const [tasks, setTasks] = useState<LocalTask[]>([])
  const [connectedUsers, setConnectedUsers] = useState<string[]>([])
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isManagePermissionsModalOpen, setIsManagePermissionsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<WorkflowMember | null>(null)
  
  // NEW: Task editing and status modals
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [isTaskStatusModalOpen, setIsTaskStatusModalOpen] = useState(false)
  const [isTaskCompletionModalOpen, setIsTaskCompletionModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  
  // NEW: Completed tasks modal
  const [isCompletedTasksModalOpen, setIsCompletedTasksModalOpen] = useState(false)
  
  // NEW: Edit workflow modal
  const [isEditWorkflowModalOpen, setIsEditWorkflowModalOpen] = useState(false)
  
  // NEW: Delete workflow modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    workflowId: string
    workflowName: string
  }>({
    isOpen: false,
    workflowId: '',
    workflowName: ''
  })

  // Toast notifications
  const { toasts, removeToast, showSuccess, showInfo } = useToast()

  // Real-time connection for live updates
  const { isConnected, refresh, disconnect, connectionId } = useSocket({
    workflowId: currentUserId ? workflowId : undefined, // Only connect when we have both workflowId and currentUserId
    userId: currentUserId || undefined,
    onTaskCreated: (newTask) => {
      // Add new task to the list
      setTasks(prevTasks => [newTask, ...prevTasks])
      // Refresh stats
      if (workflow) {
        loadWorkflowStats(workflow)
      }
      // Show notification
      showSuccess('New Task Created', `${newTask.title} has been added to the workflow`, 4000)
    },
    onTaskUpdated: (updatedTask) => {
      // Update task in the list
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        )
      )
      // Refresh stats
      if (workflow) {
        loadWorkflowStats(workflow)
      }
      // Show notification
      showInfo('Task Updated', `${updatedTask.title} has been modified`, 4000)
    },
    onTaskDeleted: (taskId) => {
      // Remove task from the list
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId))
      // Refresh stats
      if (workflow) {
        loadWorkflowStats(workflow)
      }
      // Show notification
      showInfo('Task Deleted', 'A task has been removed from the workflow', 4000)
    },
    onTaskStatusChanged: (task) => {
      // Update task in the list
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t._id === task._id ? task : t
        )
      )
      // Refresh stats
      if (workflow) {
        loadWorkflowStats(workflow)
      }
      // Show notification
      showInfo('Task Status Changed', `${task.title} status updated to ${task.status}`, 4000)
    },
    onTaskCompleted: (task) => {
      // Update task in the list
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t._id === task._id ? task : t
        )
      )
      // Refresh stats
      if (workflow) {
        loadWorkflowStats(workflow)
      }
      // Show notification
      showSuccess('Task Completed', `${task.title} has been marked as completed`, 4000)
    },
    onUserConnectionStatus: (connectedUserIds) => {
      setConnectedUsers(connectedUserIds)
    }
  })

  // Cleanup real-time connection when component unmounts
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  useEffect(() => {
    loadWorkflow()
    getCurrentUserId()
  }, [workflowId])



  useEffect(() => {
    // Check admin status after both workflow and current user are loaded
    if (workflow && currentUserId) {
      setIsAdmin(workflow.createdBy === currentUserId)
    }
  }, [workflow, currentUserId])

  const handleMemberAdded = () => {
    // Refresh the workflow to show new members
    loadWorkflow()
  }

  const handleTaskCreated = () => {
    // Refresh the workflow to show new tasks
    loadWorkflow()
    loadWorkflowTasks()
  }

  const handleOpenPermissionsModal = (member: WorkflowMember) => {
    setSelectedMember(member)
    setIsManagePermissionsModalOpen(true)
  }

  const handlePermissionsUpdated = () => {
    // Refresh the workflow to show updated permissions
    loadWorkflow()
  }

  const handleMemberRemoved = () => {
    // Refresh the workflow to show updated member list
    loadWorkflow()
  }

  // NEW: Task editing and status handlers
  const handleEditTask = (task: any) => {
    setSelectedTask(task)
    setIsEditTaskModalOpen(true)
  }

  const handleUpdateTaskStatus = (task: any) => {
    setSelectedTask(task)
    setIsTaskStatusModalOpen(true)
  }

  const handleConfirmTaskCompletion = (task: any) => {
    setSelectedTask(task)
    setIsTaskCompletionModalOpen(true)
  }

  const handleTaskUpdated = () => {
    loadWorkflow()
  }

  const handleTaskStatusUpdated = () => {
    loadWorkflow()
  }

  const handleTaskCompletionConfirmed = () => {
    loadWorkflow()
  }

  const handleDeleteTask = async (task: any) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}/tasks/${task._id}/delete`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        handleTaskUpdated() // Refresh tasks after deletion
      } else {
        alert(`Failed to delete task: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('An error occurred while deleting the task')
    }
  }

  const handleDeleteCompletionMessage = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this completion message? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}/tasks/${taskId}/completion-message/delete`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        loadWorkflow() // Refresh the workflow to remove the message
      } else {
        alert(`Failed to delete completion message: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting completion message:', error)
      alert('An error occurred while deleting the completion message')
    }
  }

  const handleDeleteFeedbackMessage = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this feedback message? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}/tasks/${taskId}/feedback-message/delete`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        loadWorkflow() // Refresh the workflow to remove the feedback message
      } else {
        alert(`Failed to delete feedback message: ${result.message}`)
      }
      } catch (error) {
    console.error('Error deleting feedback message:', error)
    alert('An error occurred while deleting the feedback message')
  }
}

const handleEditWorkflow = () => {
  setIsEditWorkflowModalOpen(true)
}

const handleWorkflowUpdated = () => {
  loadWorkflow() // Refresh the workflow data
  setIsEditWorkflowModalOpen(false)
}

const openDeleteModal = () => {
  setDeleteModal({
    isOpen: true,
    workflowId: workflowId,
    workflowName: workflow?.name || ''
  })
}

const closeDeleteModal = () => {
  setDeleteModal({
    isOpen: false,
    workflowId: '',
    workflowName: ''
  })
}

  const getCurrentUserId = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success) {
        setCurrentUserId(data.user._id)
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  const loadWorkflow = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch the specific workflow
      const response = await fetch(`/api/workflows/${workflowId}`)
      const data = await response.json()
      
      if (data.success) {
        console.log('Workflow loaded successfully:', data.workflow)
        setWorkflow(data.workflow)
        
        // Load workflow statistics and tasks
        loadWorkflowStats(data.workflow)
        loadWorkflowTasks()
      } else {
        setError(data.message || 'Failed to load workflow')
      }
    } catch (error) {
      console.error('Error loading workflow:', error)
      setError('An error occurred while loading the workflow')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorkflowStats = async (workflowData: Workflow) => {
    try {
      // Fetch real task statistics for this workflow
      const response = await fetch(`/api/workflows/${workflowId}/stats`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      } else {
        // Fallback to zero if stats fetch fails
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0
        })
      }
    } catch (error) {
      console.error('Error loading workflow stats:', error)
      // Fallback to zero on error
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0
      })
    }
  }

  const loadWorkflowTasks = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/tasks`)
      const data = await response.json()
      
      if (data.success) {
        setTasks(data.tasks || [])
      } else {
        console.error('Failed to load tasks:', data.message)
      }
    } catch (error) {
      console.error('Error loading workflow tasks:', error)
    }
  }

  const handleDeleteWorkflow = async () => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/workflows/delete?id=${workflowId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        router.push('/workflows')
      } else {
        alert(`Failed to delete workflow: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('An error occurred while deleting the workflow')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMemberRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800'
      case 'Member':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Critical':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Awaiting Confirmation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isTaskAssignedToCurrentUser = (task: LocalTask) => {
    return currentUserId && task.assignedMembers.some((member: any) => member.userId === currentUserId)
  }

  const isTaskCreatedByCurrentUser = (task: LocalTask) => {
    return currentUserId && task.createdBy === currentUserId
  }

  const getMyTasks = () => {
    return tasks.filter(task => isTaskAssignedToCurrentUser(task))
  }

  const getTasksICreated = () => {
    return tasks.filter(task => isTaskCreatedByCurrentUser(task))
  }

  const getVisibleTasks = () => {
    if (isAdmin) {
      // Admin can see all tasks
      return tasks
    } else {
      // Regular users can see tasks assigned to them + tasks they created
      return tasks.filter(task => 
        isTaskAssignedToCurrentUser(task) || isTaskCreatedByCurrentUser(task)
      )
    }
  }

  const canSeeAllTasks = () => {
    return isAdmin
  }

  // Helper function to check if current user can create tasks
  const canCreateTasks = () => {
    return isAdmin || workflow?.members.find(member => member.userId === currentUserId)?.permissions?.canCreateTasks
  }

  // Helper function to check if current user can edit a specific task
  const canEditTask = (task: any) => {
    return isAdmin || task.createdBy === currentUserId
  }

  // Helper function to check if current user can see all tasks

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-gray-500">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error ? 'Error Loading Workflow' : 'Workflow not found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error || "The workflow you're looking for doesn't exist or you don't have access to it."}
            </p>
            <Link
              href="/workflows"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Workflows
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/workflows"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
              <p className="text-gray-600 mt-1">{workflow.description}</p>
            </div>
          </div>
          
          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleEditWorkflow}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit workflow"
              >
                <EditIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={openDeleteModal}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete workflow"
              >
                <Trash2Icon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Priority and Status */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(workflow.priority)}`}>
            <FlagIcon className="h-4 w-4 mr-1" />
            {workflow.priority} Priority
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(workflow.status)}`}>
            {workflow.status}
          </span>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isAdmin ? stats.totalTasks : getVisibleTasks().filter(task => task.status !== 'Completed').length}
              </p>
              {!isAdmin && (
                <p className="text-xs text-gray-500">Your visible tasks</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isAdmin ? stats.completedTasks : '—'}
              </p>
              {!isAdmin && (
                <p className="text-xs text-gray-500">Admin only</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role & Permission Indicator */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isAdmin ? 'Workflow Admin' : 'Workflow Member'}
            </span>
            <span className="text-xs text-gray-500">
              {isAdmin 
                ? 'You can see and manage all tasks and members'
                : `You can see ${getVisibleTasks().filter(task => task.status !== 'Completed').length} active tasks`
              }
              {canCreateTasks() && !isAdmin && ' • You can create new tasks'}
              {!isAdmin && ' • Completed tasks are admin-only'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time Connection Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
              {isConnected && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Connected
                </span>
              )}

            </div>
            {!isAdmin && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {canCreateTasks() ? 'Task Creator' : 'Limited view'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <span className="text-sm text-gray-500">
                ({workflow.members.length}/{workflow.estimatedMembers})
              </span>
              {/* Online users count */}
              <span className="text-sm text-green-600 font-medium">
                • {connectedUsers.length} online
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              )}

            </div>
          </div>

          {/* Online/Offline Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Offline</span>
            </div>

          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {workflow.members.map((member, index) => (
              <div key={`${member.userId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                    {/* Online/Offline indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      connectedUsers.includes(member.userId) ? 'bg-green-500' : 'bg-red-500'
                    }`} title={
                      connectedUsers.includes(member.userId) ? 'Online' : 'Offline'
                    }></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </span>
                      {member.role === 'Admin' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMemberStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                      {/* NEW: Credits display */}
                      {member.credits !== undefined && member.credits > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐ {member.credits} credits
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMemberRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMemberStatusColor(member.status)}`}>
                    {member.status}
                  </span>
                  {/* Permission Indicators */}
                  {member.permissions && (
                    <div className="flex items-center gap-1">
                      {member.permissions.canCreateTasks && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800" title="Can create tasks">
                          📝
                        </span>
                      )}
                      {member.permissions.canAssignTasks && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                          title={member.permissions.assignableMembers.length === 0
                            ? "Can assign tasks to anyone"
                            : `Can assign tasks to ${member.permissions.assignableMembers.length} specific member(s)`
                          }>
                          📋
                        </span>
                      )}
                    </div>
                  )}
                  {/* Admin Actions */}
                  {isAdmin && member.userId !== currentUserId && (
                    <button
                      onClick={() => handleOpenPermissionsModal(member)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      title="Manage Permissions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Info & Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Created</div>
                <div className="text-sm text-gray-900">
                  {new Date(workflow.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UsersIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Total Members</div>
                <div className="text-sm text-gray-900">{workflow.members.length}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FlagIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Priority Level</div>
                <div className="text-sm text-gray-900">{workflow.priority}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {canCreateTasks() && (
                <button
                  onClick={() => setIsCreateTaskModalOpen(true)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create Task
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Section - Tasks Awaiting Confirmation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquareIcon className="h-5 w-5" />
            Messages
          </h2>
        </div>
        
        {/* Tasks Awaiting Confirmation */}
        <div className="space-y-4">
          
          {/* Tasks Awaiting Confirmation */}
          {tasks.filter(task => task.status === 'Awaiting Confirmation').length > 0 && (
            <>
              <h3 className="text-md font-medium text-gray-900 mb-3">📋 Tasks Awaiting Confirmation</h3>
              {tasks.filter(task => task.status === 'Awaiting Confirmation').map((task) => (
                <div key={task._id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          ⏳ Awaiting Confirmation
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-gray-600 mb-2">{task.description}</p>
                      
                      {/* Completion Message */}
                      {task.completionMessage && (
                        <div className="bg-white border border-yellow-200 rounded p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                              <MessageSquareIcon className="h-3 w-3" />
                              Completion Message:
                            </div>
                            {/* Delete button for the person who wrote the message */}
                            {task.completedBy === currentUserId && (
                              <button
                                onClick={() => handleDeleteCompletionMessage(task._id)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                                title="Delete this message"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-800">{task.completionMessage}</p>
                        </div>
                      )}
                      
                      {/* Task Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Created:</span> {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        {task.dueDate && (
                          <div>
                            <span className="font-medium">Due:</span> {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* Only show confirm button for admins/creators */}
                      {canEditTask(task) && (
                        <button
                          onClick={() => handleConfirmTaskCompletion(task)}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          title="Confirm task completion"
                        >
                          ✅ Confirm Completion
                        </button>
                      )}
                      {/* View details button for everyone */}
                      <button
                        onClick={() => handleEditTask(task)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        title="View task details"
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Feedback Messages for Completed Tasks */}
          {tasks.filter(task => task.status === 'Completed' && task.feedbackForCompleter && task.completedBy === currentUserId).length > 0 && (
            <>
              <h3 className="text-md font-medium text-gray-900 mb-3 mt-6">💬 Feedback Messages</h3>
              {tasks.filter(task => task.status === 'Completed' && task.feedbackForCompleter && task.completedBy === currentUserId).map((task) => (
                <div key={task._id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          ✅ Task Completed
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-gray-600 mb-2">{task.description}</p>
                      
                      {/* Feedback Message */}
                      {task.feedbackForCompleter && (
                        <div className="bg-white border border-green-200 rounded p-3 mb-3 relative">
                          {/* Delete button in top-right corner */}
                          {task.completedBy === currentUserId && (
                            <button
                              onClick={() => handleDeleteFeedbackMessage(task._id)}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                              title="Delete this feedback message"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <MessageSquareIcon className="h-3 w-3" />
                            Feedback from Admin/Creator:
                          </div>
                          <p className="text-sm text-gray-800">{task.feedbackForCompleter}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            Received on: {task.feedbackAt ? new Date(task.feedbackAt).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      )}
                      
                      {/* Task Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Completed:</span> {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Confirmed:</span> {task.confirmedAt ? new Date(task.confirmedAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Show message if no messages */}
          {tasks.filter(task => task.status === 'Awaiting Confirmation').length === 0 && 
           tasks.filter(task => task.status === 'Completed' && task.feedbackForCompleter && task.completedBy === currentUserId).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-600">No messages or tasks awaiting confirmation</p>
            </div>
          )}
        </div>
      </div>



      {/* All Workflow Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            All Workflow Tasks
          </h2>
                  <div className="flex items-center gap-2">
          {(isAdmin || workflow?.members.find(member => member.userId === currentUserId)?.permissions?.canCreateTasks) && (
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Task
            </button>
          )}
        </div>
        </div>
        
        {/* Tasks List */}
        {tasks.filter(task => task.status !== 'Completed').length > 0 ? (
          <div className="space-y-4">
            {tasks.filter(task => task.status !== 'Completed').map((task) => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTaskStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                    <p className="text-gray-600 mb-2">{task.description}</p>
                    
                    {/* Task Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Created:</span> {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                      {task.dueDate && (
                        <div>
                          <span className="font-medium">Due:</span> {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Assigned to:</span> {task.assignedMembers?.length > 0 ? task.assignedMembers.map((member: any) => member.firstName + ' ' + member.lastName).join(', ') : 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Edit Button for Admins and Task Creators */}
                    {canEditTask(task) && (
                      <button
                        onClick={() => handleEditTask(task)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        title={isAdmin ? "Edit task (Admin)" : "Edit task (Creator)"}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {/* Status Update Button for Assigned Members */}
                    {isTaskAssignedToCurrentUser(task) && task.status !== 'Completed' && task.status !== 'Awaiting Confirmation' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        title="Update task status"
                      >
                        📝 Update Status
                      </button>
                    )}
                    {/* Completion Confirmation Button for Admins/Creators */}
                    {task.status === 'Awaiting Confirmation' && (isAdmin || isTaskCreatedByCurrentUser(task)) && (
                      <button
                        onClick={() => handleConfirmTaskCompletion(task)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        title="Confirm task completion"
                      >
                        ✅ Confirm Completion
                      </button>
                    )}
                    {/* Delete Button for Admins and Task Creators */}
                    {canEditTask(task) && (
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title={isAdmin ? "Delete task (Admin)" : "Delete task (Creator)"}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {canSeeAllTasks() ? 'No active tasks' : 'No active tasks available to you'}
            </h3>
            <p className="text-gray-600 mb-4">
              {canSeeAllTasks() 
                ? 'All tasks are completed or no tasks have been created yet'
                : 'You can only see active tasks assigned to you or created by you'
              }
            </p>
            {(isAdmin || workflow?.members.find(member => member.userId === currentUserId)?.permissions?.canCreateTasks) && (
              <button 
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Task
              </button>
            )}
          </div>
        )}
        

      </div>

      {/* Completed Tasks Section - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              Completed Tasks
            </h2>
            {tasks.filter(task => task.status === 'Completed').length > 0 && (
              <button
                onClick={() => setIsCompletedTasksModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All ({tasks.filter(task => task.status === 'Completed').length})
              </button>
            )}
          </div>
          
          {/* Show only 2-3 completed tasks */}
          <div className="space-y-4">
            {tasks.filter(task => task.status === 'Completed').slice(0, 3).map((task) => (
              <div key={task._id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        ✅ Completed
                    </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                    <p className="text-gray-600 mb-2">{task.description}</p>
                    
                    {/* Task Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Completed by:</span> {task.completedBy ? (() => {
                          const member = workflow?.members.find((m: any) => m.userId === task.completedBy)
                          return member ? `${member.firstName} ${member.lastName}` : 'Unknown'
                        })() : 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Completed:</span> {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Confirmed:</span> {task.confirmedAt ? new Date(task.confirmedAt).toLocaleDateString() : 'Pending'}
                      </div>
                    </div>

                    {/* Completion Message */}
                    {task.completionMessage && (
                      <div className="bg-white border border-green-200 rounded p-3 mb-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <CheckCircleIcon className="h-3 w-3" />
                          Completion Message:
                        </div>
                        <p className="text-sm text-gray-800">{task.completionMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show message if no completed tasks */}
            {tasks.filter(task => task.status === 'Completed').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-600">No completed tasks yet</p>
              </div>
            )}
            
            {/* Show "Show All" button if more than 3 completed tasks */}
            {tasks.filter(task => task.status === 'Completed').length > 3 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setIsCompletedTasksModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Show All Completed Tasks ({tasks.filter(task => task.status === 'Completed').length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        workflowId={workflowId} 
        onMemberAdded={handleMemberAdded}
        existingMembers={workflow?.members.map(member => member.email) || []}
      />

      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen} 
        onClose={() => setIsCreateTaskModalOpen(false)} 
        workflowId={workflowId} 
        onTaskCreated={handleTaskCreated}
        workflowMembers={workflow?.members || []}
        currentUserId={currentUserId || undefined}
        currentUserPermissions={workflow?.members.find(member => member.userId === currentUserId)?.permissions}
      />

      <ManagePermissionsModal 
        isOpen={isManagePermissionsModalOpen} 
        onClose={() => setIsManagePermissionsModalOpen(false)} 
        workflowId={workflowId} 
        member={selectedMember} 
        allMembers={workflow?.members || []}
        onPermissionsUpdated={handlePermissionsUpdated}
        onMemberRemoved={handleMemberRemoved}
      />

      {/* NEW: Task editing and status modals */}
      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        workflowId={workflowId}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
        workflowMembers={workflow?.members || []}
        currentUserId={currentUserId || undefined}
        currentUserPermissions={workflow?.members.find(member => member.userId === currentUserId)?.permissions}
      />

      <TaskStatusModal 
        isOpen={isTaskStatusModalOpen} 
        onClose={() => setIsTaskStatusModalOpen(false)} 
        workflowId={workflowId} 
        task={selectedTask} 
        onStatusUpdated={handleTaskStatusUpdated}
        currentUserId={currentUserId || undefined}
        isAdmin={isAdmin}
        isTaskCreator={selectedTask ? Boolean(isTaskCreatedByCurrentUser(selectedTask)) : false}
      />

      <TaskCompletionModal 
        isOpen={isTaskCompletionModalOpen} 
        onClose={() => setIsTaskCompletionModalOpen(false)} 
        workflowId={workflowId} 
        task={selectedTask} 
        onTaskCompletionConfirmed={handleTaskCompletionConfirmed}
        currentUserId={currentUserId || undefined}
      />

      <CompletedTasksModal
        isOpen={isCompletedTasksModalOpen}
        onClose={() => setIsCompletedTasksModalOpen(false)}
        workflowId={workflowId}
        onTasksDeleted={handleTaskUpdated}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteWorkflow}
        workflowName={deleteModal.workflowName}
        isDeleting={false}
      />

      <EditWorkflowModal
        isOpen={isEditWorkflowModalOpen}
        onClose={() => setIsEditWorkflowModalOpen(false)}
        workflowId={workflowId}
        workflow={workflow}
        onWorkflowUpdated={handleWorkflowUpdated}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}