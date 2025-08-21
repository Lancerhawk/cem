'use client'

import { useState, useEffect } from 'react'
import { XIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon } from 'lucide-react'

interface TaskStatusModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  task: any
  onStatusUpdated: () => void
  currentUserId?: string
  isAdmin?: boolean
  isTaskCreator?: boolean
}

interface StatusUpdateData {
  status: 'Pending' | 'In Progress' | 'Awaiting Confirmation' | 'Completed' | 'Cancelled'
  message: string
}

export default function TaskStatusModal({
  isOpen, 
  onClose, 
  workflowId,
  task,
  onStatusUpdated, 
  currentUserId,
  isAdmin,
  isTaskCreator
}: TaskStatusModalProps) {
  const [formData, setFormData] = useState<StatusUpdateData>({
    status: 'Pending',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        status: task.status || 'Pending',
        message: ''
      })
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      setError('Please provide a message explaining the status change')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/workflows/${workflowId}/tasks/${task._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        onStatusUpdated()
        onClose()
      } else {
        setError(result.message || 'Failed to update task status')
      }
    } catch (error) {
      console.error('Update task status error:', error)
      setError('An error occurred while updating the task status')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'In Progress':
        return <ClockIcon className="h-5 w-5 text-blue-600" />
      case 'Cancelled':
        return <AlertCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  if (!isOpen || !task) return null

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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Task Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Current Task Info */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
          <p className="text-gray-600 mb-3">{task.description}</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
              <span className="ml-1">{task.status}</span>
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Confirmation">Awaiting Confirmation</option>
              {/* Only show Completed option if user is admin or task creator */}
              {(isAdmin || isTaskCreator) && (
                <option value="Completed">Completed</option>
              )}
              <option value="Cancelled">Cancelled</option>
            </select>
            
            {/* Help text for assigned members */}
            {!(isAdmin || isTaskCreator) && (
              <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                💡 <strong>Workflow Tip:</strong> As an assigned member, use "Awaiting Confirmation" when you've completed your work. 
                An admin or task creator will then review and confirm the completion.
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder={formData.status === 'Awaiting Confirmation' 
                ? "Describe what was accomplished. This will be sent to admin/creator for confirmation..."
                : formData.status === 'Completed' 
                ? "Describe what was accomplished and any final notes..."
                : formData.status === 'In Progress'
                ? "Describe what progress has been made and any updates..."
                : "Explain the status change and any relevant details..."
              }
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.message.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
