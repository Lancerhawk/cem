'use client'

import { useState, useEffect } from 'react'
import { XIcon, Trash2Icon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react'

interface CompletedTasksModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  onTasksDeleted: () => void
}

export default function CompletedTasksModal({
  isOpen,
  onClose,
  workflowId,
  onTasksDeleted
}: CompletedTasksModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch completed tasks when modal opens
  useEffect(() => {
    if (isOpen && workflowId) {
      fetchCompletedTasks()
    }
  }, [isOpen, workflowId])

  const fetchCompletedTasks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/workflows/${workflowId}/completed-tasks`)
      const result = await response.json()
      
      if (result.success) {
        setCompletedTasks(result.tasks || [])
      } else {
        console.error('Failed to fetch completed tasks:', result.message)
        setCompletedTasks([])
      }
    } catch (error) {
      console.error('Error fetching completed tasks:', error)
      setCompletedTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const handleDeleteAll = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    try {
      setIsDeleting(true)
      
      // Delete all completed tasks
      const deletePromises = completedTasks.map(task => 
        fetch(`/api/workflows/${task.workflowId}/tasks/${task._id}/delete`, {
          method: 'DELETE'
        })
      )

      await Promise.all(deletePromises)
      
      onTasksDeleted()
      onClose()
      setDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting completed tasks:', error)
      alert('An error occurred while deleting the tasks')
    } finally {
      setIsDeleting(false)
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

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Completed Tasks</h2>
            <p className="text-sm text-gray-600 mt-1">
              {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">⚙️</div>
              <p className="text-gray-600">Loading completed tasks...</p>
            </div>
          ) : completedTasks.length > 0 ? (
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Completed
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
                          <span className="font-medium">Completed by:</span> {task.completedBy || 'Unknown'}
                        </div>
                      </div>

                      {/* Completion Details */}
                      {task.completionMessage && (
                        <div className="bg-white border border-gray-200 rounded p-3 mb-3">
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            Completion Message:
                          </div>
                          <p className="text-sm text-gray-800">{task.completionMessage}</p>
                        </div>
                      )}

                      {/* Confirmation Details */}
                      {task.confirmedBy && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            Confirmed by Admin/Creator:
                          </div>
                          <p className="text-sm text-blue-800">
                            {task.confirmedAt ? new Date(task.confirmedAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600">No completed tasks found</p>
            </div>
          )}
        </div>

        {/* Footer with Delete Actions - Fixed at bottom */}
        {completedTasks.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''} ready for cleanup
              </div>
              
              <div className="flex items-center gap-3">
                {!deleteConfirm ? (
                  <button
                    onClick={handleDeleteAll}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={isDeleting}
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete All Completed Tasks'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">This action cannot be undone!</span>
                    </div>
                    <button
                      onClick={handleDeleteAll}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      disabled={isDeleting}
                    >
                      <Trash2Icon className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Yes, Delete All' : 'Yes, Delete All'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
