'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, SearchIcon, XIcon, Trash2Icon } from 'lucide-react'
import { getUserWorkflows } from '@/app/lib/actions/workflow_action'
import { Workflow } from '@/app/lib/types/workflow'
// import { UserWithoutPassword } from '@/app/lib/types/user'
import CreateWorkflowModal from './CreateWorkflowModal'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import Link from 'next/link'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingWorkflow, setDeletingWorkflow] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    workflowId: string | null
    workflowName: string
  }>({
    isOpen: false,
    workflowId: null,
    workflowName: ''
  })

  useEffect(() => {
    loadWorkflows()
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
    getCurrentUserId()
  }, [])

  const loadWorkflows = async () => {
    try {
      setIsLoading(true)
      const userWorkflows = await getUserWorkflows()
      setWorkflows(userWorkflows)
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkflowCreated = () => {
    setIsCreateModalOpen(false)
    loadWorkflows() // Refresh the list
  }

  const openDeleteModal = (workflowId: string, workflowName: string) => {
    setDeleteModal({
      isOpen: true,
      workflowId,
      workflowName
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      workflowId: null,
      workflowName: ''
    })
  }

  const handleDeleteWorkflow = async () => {
    if (!deleteModal.workflowId) return

    try {
      setDeletingWorkflow(deleteModal.workflowId)
      const response = await fetch(`/api/workflows/delete?id=${deleteModal.workflowId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Remove the deleted workflow from the state
        setWorkflows(workflows.filter(w => w._id !== deleteModal.workflowId))
        closeDeleteModal()
      } else {
        alert(`Failed to delete workflow: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('An error occurred while deleting the workflow')
    } finally {
      setDeletingWorkflow(null)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Workflows</h1>
        <p className="text-gray-600">
              Manage your project workflows, collaborate with team members, and track progress.
        </p>
      </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Workflow
          </button>
        </div>
      </div>

      {/* Workflows Grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first workflow to start collaborating with your team.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Workflow
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              {/* Workflow Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{workflow.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{workflow.description}</p>
                </div>
                {/* Delete Button (only for admin) */}
                {currentUserId && workflow.createdBy === currentUserId && (
                  <button
                    onClick={() => openDeleteModal(workflow._id || '', workflow.name)}
                    disabled={deletingWorkflow === workflow._id}
                    className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                    title="Delete Workflow"
                  >
                    <Trash2Icon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Priority and Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(workflow.priority)}`}>
                  {workflow.priority}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>

              {/* Members Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Members</span>
                  <span>{workflow.members.length}/{workflow.estimatedMembers}</span>
                </div>
                <div className="flex -space-x-2">
                  {workflow.members.slice(0, 5).map((member, index) => (
                    <div
                      key={member.userId}
                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                      title={`${member.firstName} ${member.lastName}`}
                    >
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                  ))}
                  {workflow.members.length > 5 && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                      +{workflow.members.length - 5}
                    </div>
                  )}
                </div>
              </div>

              {/* Created Date */}
              <div className="text-xs text-gray-500 mb-4">
                Created {new Date(workflow.createdAt).toLocaleDateString()}
              </div>

              {/* Enter Workflow Button */}
              <Link
                href={`/workflows/${workflow._id}`}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
              >
                Enter Workflow
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {isCreateModalOpen && (
        <CreateWorkflowModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onWorkflowCreated={handleWorkflowCreated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteWorkflow}
          workflowName={deleteModal.workflowName}
          isDeleting={deletingWorkflow === deleteModal.workflowId}
        />
      )}
    </div>
  )
}