'use client'

import { useState, useEffect } from 'react'
import { XIcon, CalendarIcon, UserIcon, FlagIcon } from 'lucide-react'
import { WorkflowMember } from '@/app/lib/types/workflow'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  task: any
  onTaskUpdated: () => void
  workflowMembers: any[]
  currentUserId?: string
  currentUserPermissions?: {
    canAssignTasks: boolean
    assignableMembers: string[]
  }
}

interface TaskFormData {
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate: string
  assignedMembers: string[]
}

export default function EditTaskModal({ 
  isOpen, 
  onClose, 
  task,
  onTaskUpdated, 
  workflowId, 
  workflowMembers, 
  currentUserId,
  currentUserPermissions
}: EditTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    assignedMembers: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedMembers: task.assignedMembers?.map((member: any) => member.userId) || []
      })
    }
  }, [task])

  // Filter assignable members based on permissions
  const getAssignableMembers = () => {
    if (!currentUserPermissions) return workflowMembers
    
    // If no assignment permission at all, return empty array
    if (!currentUserPermissions.canAssignTasks) return []
    
    // If assignableMembers is empty array, no restrictions - can assign to anyone
    if (currentUserPermissions.assignableMembers.length === 0) {
      return workflowMembers
    }
    
    // If assignableMembers has specific members, can only assign to those
    return workflowMembers.filter(member => 
      currentUserPermissions.assignableMembers.includes(member.userId)
    )
  }

  const assignableMembers = getAssignableMembers()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.assignedMembers.length === 0) {
      setError('Please assign the task to at least one member')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/workflows/${workflowId}/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        onTaskUpdated()
        onClose()
      } else {
        setError(result.message || 'Failed to update task')
      }
    } catch (error) {
      console.error('Update task error:', error)
      setError('An error occurred while updating the task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter(id => id !== memberId)
        : [...prev.assignedMembers, memberId]
    }))
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Task Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Describe what needs to be done"
              required
            />
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Assign Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Members *
            </label>
            
            {/* Permission Info */}
            {currentUserPermissions && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Your assignment permissions:</strong><br/>
                  {!currentUserPermissions.canAssignTasks ? (
                    "❌ You cannot assign tasks to other members"
                  ) : currentUserPermissions.assignableMembers.length === 0 ? (
                    "✅ You can assign tasks to ANY member in this workflow"
                  ) : (
                    `✅ You can only assign tasks to ${currentUserPermissions.assignableMembers.length} specific member(s)`
                  )}
                </p>
              </div>
            )}
            
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {assignableMembers.map((member) => (
                <label key={member.userId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedMembers.includes(member.userId)}
                    onChange={() => toggleMember(member.userId)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {assignableMembers.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  {!currentUserPermissions?.canAssignTasks 
                    ? "You don't have permission to assign tasks to other members. Contact the workflow admin to request this permission."
                    : "No members available for assignment. This might be due to permission restrictions."
                  }
                </p>
              </div>
            )}
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
              disabled={isSubmitting || formData.assignedMembers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
