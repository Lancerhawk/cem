'use client'

import { useState } from 'react'
import { XIcon, CheckCircleIcon, StarIcon, MessageSquareIcon } from 'lucide-react'

interface TaskCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  task: any
  onTaskCompletionConfirmed: () => void
  currentUserId?: string
}

interface CompletionData {
  awardCredits: boolean
  feedback?: string // Optional feedback for the task completer
}

export default function TaskCompletionModal({
  isOpen,
  onClose,
  workflowId,
  task,
  onTaskCompletionConfirmed,
  currentUserId
}: TaskCompletionModalProps) {
  const [formData, setFormData] = useState<CompletionData>({
    awardCredits: true,
    feedback: '' // Initialize with empty string
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.feedback?.trim()) {
      setError('Please provide feedback for the task completer')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch(`/api/workflows/${workflowId}/tasks/${task._id}/confirm-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        onTaskCompletionConfirmed()
        onClose()
      } else {
        setError(result.message || 'Failed to confirm task completion')
      }
    } catch (error) {
      console.error('Confirm completion error:', error)
      setError('An error occurred while confirming task completion')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !task) return null

  // Find the member who completed the task
  const completedByMember = task.assignedMembers?.find((member: any) => 
    member.userId === task.completedBy
  )

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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Confirm Task Completion</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Task Info */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
            <p className="text-gray-600 mb-3">{task.description}</p>
            
            {/* Completion Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="font-medium">Task Completed</span>
              </div>
              {completedByMember && (
                <p className="text-sm text-green-700">
                  Completed by: <strong>{completedByMember.firstName} {completedByMember.lastName}</strong>
                </p>
              )}
              {task.completionMessage && (
                <div className="mt-2 p-2 bg-white rounded border">
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <MessageSquareIcon className="h-3 w-3" />
                    Completion Message:
                  </div>
                  <p className="text-sm text-gray-800">{task.completionMessage}</p>
                </div>
              )}
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

            {/* Feedback for Task Completer */}
            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Feedback for Task Completer *
              </label>
              <textarea
                id="feedback"
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Send feedback, suggestions, or appreciation to the person who completed this task..."
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                This feedback will be sent to the person who completed the task and will appear in their Messages section.
              </p>
            </div>

            {/* Award Credits */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="awardCredits"
                checked={formData.awardCredits}
                onChange={(e) => setFormData({ ...formData, awardCredits: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="awardCredits" className="flex items-center gap-2 text-sm text-gray-700">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                Award 1 credit point to the member who completed this task
              </label>
            </div>

            {/* Credit Info */}
            {formData.awardCredits && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Credit System:</strong> Awarding credits helps track member contributions and performance. 
                  Members can see their total credits in the team members section.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Form Actions - Fixed at bottom */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.feedback?.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Completion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
